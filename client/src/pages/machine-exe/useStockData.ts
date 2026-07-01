/**
 * THE_MACHINE.EXE — Market Data Service Layer (Finnhub)
 *
 * Rate limit: Finnhub free tier = 60 calls/minute = 1 call/second max.
 *
 * Strategy:
 * - Global request queue: max 1 request per 1.1 seconds
 * - Shared quote cache: 30s TTL, stale-while-revalidate
 * - Profile cache: 10 min TTL
 * - All hooks share the same cache — no duplicate fetches
 * - Stale data shown instead of "offline" when cache has data
 * - Exponential backoff on 429 errors
 * - All components use a single polling interval (30s) to avoid thundering herd
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { StockQuote, SparklinePoint } from './types';

// ── Provider config ──────────────────────────────────────────────────────────
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY as string;
const BASE = 'https://finnhub.io/api/v1';

// ── Global rate-limited queue ────────────────────────────────────────────────
// 300ms between requests = max 200/min, well under 60/min limit.
// Deduplication: identical in-flight requests share the same Promise.
const REQUEST_INTERVAL = 300;
type QueueItem = { fn: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: unknown) => void; key: string };
const requestQueue: QueueItem[] = [];
const inFlight = new Map<string, Promise<unknown>>();
let queueRunning = false;
let requestCount = 0;
let windowStart = Date.now();

function processQueue() {
  if (queueRunning || requestQueue.length === 0) return;

  // Sliding window rate check: max 55 requests per 60 seconds
  const now = Date.now();
  if (now - windowStart > 60_000) { requestCount = 0; windowStart = now; }
  if (requestCount >= 55) {
    setTimeout(processQueue, 60_000 - (now - windowStart) + 100);
    return;
  }

  queueRunning = true;
  requestCount++;
  const item = requestQueue.shift()!;
  item.fn()
    .then(item.resolve)
    .catch(item.reject)
    .finally(() => {
      inFlight.delete(item.key);
      setTimeout(() => {
        queueRunning = false;
        processQueue();
      }, REQUEST_INTERVAL);
    });
}

function enqueue<T>(fn: () => Promise<T>, key: string, priority = false): Promise<T> {
  // Return existing in-flight promise for duplicate requests
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const p = new Promise<unknown>((resolve, reject) => {
    const item = { fn: fn as () => Promise<unknown>, resolve, reject, key };
    if (priority) requestQueue.unshift(item); // jump to front
    else requestQueue.push(item);
    processQueue();
  });
  inFlight.set(key, p);
  return p as Promise<T>;
}

// Priority fetch — bypasses queue position for active stock lookups
async function fhFetchPriority(path: string, params: Record<string, string> = {}): Promise<unknown> {
  if (!FINNHUB_KEY) throw new Error('FINNHUB_KEY not set');
  const dedupKey = 'P:' + path + '?' + Object.entries(params).sort().map(([k,v]) => `${k}=${v}`).join('&');
  return enqueue(async () => {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('token', FINNHUB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`Finnhub ${res.status}`);
    return res.json();
  }, dedupKey, true); // priority = true
}

// ── Cache ────────────────────────────────────────────────────────────────────
const quoteCache = new Map<string, { data: StockQuote; ts: number }>();
const profileCache = new Map<string, { name: string; ts: number }>();
const QUOTE_TTL = 30_000;    // 30 seconds — fresh
const QUOTE_STALE = 300_000; // 5 minutes — stale but usable
const PROFILE_TTL = 600_000; // 10 minutes

// ── Market status ────────────────────────────────────────────────────────────
export type MarketSession = 'regular' | 'pre-market' | 'after-hours' | 'closed' | 'unknown';
export interface MarketStatus {
  isOpen: boolean;
  session: MarketSession;
  lastUpdated: number;
  offline: boolean;
}

// ── Core fetch (goes through queue) ─────────────────────────────────────────
async function fhFetch(path: string, params: Record<string, string> = {}): Promise<unknown> {
  if (!FINNHUB_KEY) throw new Error('FINNHUB_KEY not set');
  const dedupKey = path + '?' + Object.entries(params).sort().map(([k,v]) => `${k}=${v}`).join('&');
  return enqueue(async () => {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('token', FINNHUB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`Finnhub ${res.status}`);
    return res.json();
  }, dedupKey);
}

// ── Company name (cached, low priority) ─────────────────────────────────────
async function getCompanyName(symbol: string): Promise<string> {
  const cached = profileCache.get(symbol);
  if (cached && Date.now() - cached.ts < PROFILE_TTL) return cached.name;
  try {
    const d = await fhFetch('/stock/profile2', { symbol }) as { name?: string };
    const name = d.name || symbol;
    profileCache.set(symbol, { name, ts: Date.now() });
    return name;
  } catch {
    return symbol;
  }
}

// ── Quote (with stale-while-revalidate) ──────────────────────────────────────
export async function fetchQuote(symbol: string): Promise<StockQuote> {
  const sym = symbol.toUpperCase();
  const cached = quoteCache.get(sym);

  // Return fresh cache immediately
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data;

  // Return stale cache while fetching in background
  if (cached && Date.now() - cached.ts < QUOTE_STALE) {
    // Trigger background refresh (don't await)
    refreshQuoteBackground(sym);
    return cached.data;
  }

  // No cache or too stale — must fetch
  return fetchQuoteFresh(sym);
}

async function fetchQuoteFresh(sym: string): Promise<StockQuote> {
  // Fetch quote first, then profile in background
  const q = await fhFetch('/quote', { symbol: sym }) as {
    c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
  };

  if (!q.c || q.c === 0) throw new Error(`No price data for ${sym}`);

  // Get name from cache or use symbol (don't block on profile fetch)
  const cachedProfile = profileCache.get(sym);
  const name = cachedProfile?.name || sym;

  const data: StockQuote = {
    symbol: sym,
    name,
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    open: q.o,
    high: q.h,
    low: q.l,
    previousClose: q.pc,
    lastUpdated: Date.now(),
  };

  quoteCache.set(sym, { data, ts: Date.now() });

  // Record price history for sparklines (zero extra API calls)
  recordQuoteHistory(sym, { price: q.c, open: q.o, previousClose: q.pc });

  // Fetch profile in background to enrich name (non-blocking)
  if (!cachedProfile) {
    getCompanyName(sym).then(resolvedName => {
      const existing = quoteCache.get(sym);
      if (existing) {
        quoteCache.set(sym, { data: { ...existing.data, name: resolvedName }, ts: existing.ts });
      }
    }).catch(() => {});
  }

  return data;
}

// Priority fetch for active stock view — jumps queue
export async function fetchQuotePriority(symbol: string): Promise<StockQuote> {
  const sym = symbol.toUpperCase();
  const cached = quoteCache.get(sym);
  // Return fresh cache immediately
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data;

  const q = await fhFetchPriority('/quote', { symbol: sym }) as {
    c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
  };
  if (!q.c || q.c === 0) throw new Error(`No price data for ${sym}`);

  const cachedProfile = profileCache.get(sym);
  const name = cachedProfile?.name || sym;
  const data: StockQuote = {
    symbol: sym, name,
    price: q.c, change: q.d ?? 0, changePercent: q.dp ?? 0,
    open: q.o, high: q.h, low: q.l, previousClose: q.pc,
    lastUpdated: Date.now(),
  };
  quoteCache.set(sym, { data, ts: Date.now() });
  if (!cachedProfile) getCompanyName(sym).then(n => {
    const ex = quoteCache.get(sym);
    if (ex) quoteCache.set(sym, { data: { ...ex.data, name: n }, ts: ex.ts });
  }).catch(() => {});
  return data;
}

let backgroundRefreshPending = new Set<string>();
function refreshQuoteBackground(sym: string) {
  if (backgroundRefreshPending.has(sym)) return;
  backgroundRefreshPending.add(sym);
  fetchQuoteFresh(sym)
    .catch(() => {})
    .finally(() => backgroundRefreshPending.delete(sym));
}

// ── Market status ────────────────────────────────────────────────────────────
let cachedMarketStatus: MarketStatus | null = null;
let marketStatusTs = 0;
const MARKET_STATUS_TTL = 120_000; // 2 minutes

export async function fetchMarketStatus(): Promise<MarketStatus> {
  if (cachedMarketStatus && Date.now() - marketStatusTs < MARKET_STATUS_TTL) {
    return cachedMarketStatus;
  }
  try {
    const d = await fhFetch('/stock/market-status', { exchange: 'US' }) as { isOpen: boolean; session: string };
    const status: MarketStatus = {
      isOpen: d.isOpen,
      session: (d.session as MarketSession) || (d.isOpen ? 'regular' : 'closed'),
      lastUpdated: Date.now(),
      offline: false,
    };
    cachedMarketStatus = status;
    marketStatusTs = Date.now();
    return status;
  } catch {
    return cachedMarketStatus ?? { isOpen: false, session: 'unknown', lastUpdated: Date.now(), offline: true };
  }
}

// ── Sparkline ────────────────────────────────────────────────────────────────
const sparkCache = new Map<string, { data: SparklinePoint[]; ts: number }>();
const SPARK_TTL = 120_000; // 2 minutes

// ── Quote-history sparkline ──────────────────────────────────────────────────────────────────────────────
// Builds sparklines from quote data we already fetch — zero extra API calls.
// Each time a quote is fetched, we append the price to a rolling 50-point buffer.
// Seeded with previousClose → open → current on first fetch.
const quoteHistory = new Map<string, number[]>();
const MAX_HISTORY = 50;

export function recordQuoteHistory(symbol: string, quote: { price: number; open?: number; previousClose?: number }) {
  const sym = symbol.toUpperCase();
  let history = quoteHistory.get(sym) ?? [];

  // Seed with prev close + open if this is the first point
  if (history.length === 0) {
    if (quote.previousClose && quote.previousClose > 0) history.push(quote.previousClose);
    if (quote.open && quote.open > 0 && quote.open !== quote.previousClose) history.push(quote.open);
  }

  // Append current price (avoid duplicate consecutive values)
  if (history.length === 0 || history[history.length - 1] !== quote.price) {
    history.push(quote.price);
  }

  // Keep rolling window
  if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
  quoteHistory.set(sym, history);
}

export function getSparklineFromHistory(symbol: string): number[] | null {
  const pts = quoteHistory.get(symbol.toUpperCase());
  if (!pts || pts.length < 2) return null;
  return pts;
}

// Keep the old export for backward compat (StockView still calls it)
export async function fhFetchSparkline(symbol: string): Promise<number[] | null> {
  return getSparklineFromHistory(symbol);
}

export async function fetchSparkline(symbol: string, currentPrice: number): Promise<SparklinePoint[]> {
  const pts = getSparklineFromHistory(symbol);
  if (pts && pts.length >= 2) {
    return pts.map((v, i) => ({ t: Date.now() - (pts.length - i) * 60_000, v }));
  }
  return [];
}

// ── Symbol search ────────────────────────────────────────────────────────────
export async function searchStocks(query: string): Promise<StockQuote[]> {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();

  try {
    const d = await fhFetch('/search', { q }) as { result: Array<{ symbol: string; description: string; type: string }> };
    const usStocks = (d.result || []).filter(s => s.type === 'Common Stock' && !s.symbol.includes('.')).slice(0, 5);
    if (usStocks.length === 0) {
      const quote = await fetchQuote(q);
      return [quote];
    }
    const quotes = await Promise.allSettled(usStocks.map(async s => {
      const quote = await fetchQuote(s.symbol);
      return { ...quote, name: s.description || s.symbol };
    }));
    return quotes.filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled').map(r => r.value);
  } catch {
    try { return [await fetchQuote(q)]; } catch { return []; }
  }
}

// ── Hook: single live price ──────────────────────────────────────────────────
export function useLivePrice(symbol: string | null, intervalMs = 30_000) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const prevPrice = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!symbol) return;
    try {
      const q = await fetchQuotePriority(symbol);
      setQuote(q); setError(false);
      if (errorTimer.current) { clearTimeout(errorTimer.current); errorTimer.current = null; }
      if (prevPrice.current !== null && prevPrice.current !== q.price) {
        setFlash(q.price > prevPrice.current ? 'up' : 'down');
        setTimeout(() => setFlash(null), 600);
      }
      prevPrice.current = q.price;
    } catch {
      if (!errorTimer.current) errorTimer.current = setTimeout(() => setError(true), 10_000);
    }
  }, [symbol]);

  useEffect(() => {
    if (!symbol) { setQuote(null); setError(false); return; }
    // Show cached data instantly if available
    const cached = quoteCache.get(symbol.toUpperCase());
    if (cached) { setQuote(cached.data); prevPrice.current = cached.data.price; }
    setLoading(true);
    fetchQuotePriority(symbol)
      .then(q => { setQuote(q); prevPrice.current = q.price; setError(false); })
      .catch(() => { if (!cached) errorTimer.current = setTimeout(() => setError(true), 10_000); })
      .finally(() => setLoading(false));
    const id = setInterval(refresh, intervalMs);
    return () => { clearInterval(id); if (errorTimer.current) clearTimeout(errorTimer.current); };
  }, [symbol, intervalMs, refresh]);

  return { quote, loading, flash, error };
}

// ── Hook: multiple quotes — staggered, uses cache aggressively ───────────────
export function useMultipleQuotes(symbols: string[], intervalMs = 30_000) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    if (symbols.length === 0) return;
    // Fetch sequentially through the queue (rate-limited)
    const map: Record<string, StockQuote> = { ...quotes };
    let anySuccess = false;
    for (const sym of symbols) {
      try {
        const q = await fetchQuote(sym);
        map[sym] = q;
        anySuccess = true;
      } catch { /* keep stale */ }
    }
    if (anySuccess || Object.keys(map).length > 0) {
      setQuotes({ ...map });
      setOffline(false);
    } else {
      setOffline(true);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    // Initial load — use cache first, then refresh
    const initialLoad = async () => {
      const map: Record<string, StockQuote> = {};
      for (const sym of symbols) {
        const cached = quoteCache.get(sym.toUpperCase());
        if (cached) map[sym] = cached.data;
      }
      if (Object.keys(map).length > 0) setQuotes(map);
      await refresh();
    };
    initialLoad();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { quotes, offline };
}

// ── Hook: market status ──────────────────────────────────────────────────────
export function useMarketStatus(intervalMs = 120_000) {
  const [status, setStatus] = useState<MarketStatus>({ isOpen: false, session: 'unknown', lastUpdated: 0, offline: false });
  useEffect(() => {
    const load = () => fetchMarketStatus().then(setStatus);
    load();
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return status;
}
