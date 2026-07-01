// MARKET.EXE — Stock Data Hook
// Primary: Polygon.io (free tier, delayed data)
// Fallback: Finnhub
// Note: API keys are public-facing (free tier, read-only market data)
import { useState, useEffect, useRef, useCallback } from 'react';
import { StockQuote, SparklinePoint } from './types';

// Free-tier keys — read-only market data, no account access
const POLYGON_KEY = 'demo'; // polygon.io demo key (limited tickers)
const FINNHUB_KEY = 'demo'; // finnhub demo key

// Cache to avoid redundant fetches
const quoteCache = new Map<string, { data: StockQuote; ts: number }>();
const sparkCache = new Map<string, { data: SparklinePoint[]; ts: number }>();
const CACHE_TTL = 15_000; // 15 seconds

async function fetchPolygonQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const r = await fetch(
      `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${POLYGON_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.results) return null;

    // Also fetch previous close
    const snap = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!snap.ok) return null;
    const sd = await snap.json();
    const ticker = sd.ticker;
    if (!ticker) return null;

    const price = ticker.day?.c ?? ticker.lastTrade?.p ?? 0;
    const prevClose = ticker.prevDay?.c ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      name: symbol,
      price,
      change,
      changePercent,
      open: ticker.day?.o,
      high: ticker.day?.h,
      low: ticker.day?.l,
      volume: ticker.day?.v,
      previousClose: prevClose,
    };
  } catch {
    return null;
  }
}

async function fetchFinnhubQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (!quoteRes.ok) return null;
    const q = await quoteRes.json();
    if (!q.c || q.c === 0) return null;

    let name = symbol;
    if (profileRes.ok) {
      const p = await profileRes.json();
      if (p.name) name = p.name;
    }

    return {
      symbol,
      name,
      price: q.c,
      change: q.d ?? 0,
      changePercent: q.dp ?? 0,
      open: q.o,
      high: q.h,
      low: q.l,
      previousClose: q.pc,
    };
  } catch {
    return null;
  }
}

// Simulated quote for demo/fallback when APIs are unavailable
function simulateQuote(symbol: string): StockQuote {
  const basePrices: Record<string, number> = {
    AAPL: 189.5, NVDA: 875.0, MSFT: 415.0, TSLA: 248.0,
    AMZN: 185.0, META: 520.0, SPY: 525.0, GOOGL: 175.0,
    NFLX: 680.0, AMD: 165.0,
  };
  const base = basePrices[symbol] ?? 100 + Math.random() * 400;
  const seed = symbol.charCodeAt(0) + (symbol.charCodeAt(1) ?? 0);
  const noise = ((seed * 9301 + 49297) % 233280) / 233280;
  const price = base * (0.97 + noise * 0.06);
  const change = price * (noise > 0.5 ? 0.012 : -0.008) * noise;
  return {
    symbol,
    name: symbol,
    price: +price.toFixed(2),
    change: +change.toFixed(2),
    changePercent: +((change / (price - change)) * 100).toFixed(2),
    previousClose: +(price - change).toFixed(2),
  };
}

export async function fetchQuote(symbol: string): Promise<StockQuote> {
  const sym = symbol.toUpperCase();
  const cached = quoteCache.get(sym);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Try Polygon first, then Finnhub, then simulate
  let data = await fetchPolygonQuote(sym);
  if (!data) data = await fetchFinnhubQuote(sym);
  if (!data) data = simulateQuote(sym);

  quoteCache.set(sym, { data, ts: Date.now() });
  return data;
}

// Generate sparkline data (intraday simulation or real data)
function generateSparkline(basePrice: number, points = 20): SparklinePoint[] {
  const now = Date.now();
  const interval = 15 * 60 * 1000; // 15 min
  let price = basePrice * 0.985;
  return Array.from({ length: points }, (_, i) => {
    price = price * (1 + (Math.random() - 0.48) * 0.004);
    return { t: now - (points - i) * interval, v: +price.toFixed(2) };
  });
}

export async function fetchSparkline(
  symbol: string,
  currentPrice: number
): Promise<SparklinePoint[]> {
  const sym = symbol.toUpperCase();
  const cached = sparkCache.get(sym);
  if (cached && Date.now() - cached.ts < 60_000) return cached.data;

  // Try Polygon intraday aggregates
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const r = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/15/minute/${dateStr}/${dateStr}?adjusted=true&sort=asc&limit=30&apiKey=${POLYGON_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.results && d.results.length > 2) {
        const data: SparklinePoint[] = d.results.map((bar: { t: number; c: number }) => ({
          t: bar.t,
          v: bar.c,
        }));
        sparkCache.set(sym, { data, ts: Date.now() });
        return data;
      }
    }
  } catch {
    // fall through
  }

  // Fallback: generate simulated sparkline
  const data = generateSparkline(currentPrice);
  sparkCache.set(sym, { data, ts: Date.now() });
  return data;
}

// Search stocks
export async function searchStocks(query: string): Promise<StockQuote[]> {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();

  try {
    // Try Polygon ticker search
    const r = await fetch(
      `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(q)}&active=true&limit=8&apiKey=${POLYGON_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.results && d.results.length > 0) {
        const quotes = await Promise.all(
          d.results.slice(0, 5).map(async (t: { ticker: string; name: string }) => {
            const quote = await fetchQuote(t.ticker);
            return { ...quote, name: t.name || t.ticker };
          })
        );
        return quotes;
      }
    }
  } catch {
    // fall through
  }

  // Fallback: try Finnhub symbol lookup
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${FINNHUB_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.result && d.result.length > 0) {
        const usStocks = d.result
          .filter((s: { type: string; symbol: string }) => s.type === 'Common Stock' && !s.symbol.includes('.'))
          .slice(0, 5);
        const quotes = await Promise.all(
          usStocks.map(async (s: { symbol: string; description: string }) => {
            const quote = await fetchQuote(s.symbol);
            return { ...quote, name: s.description || s.symbol };
          })
        );
        return quotes;
      }
    }
  } catch {
    // fall through
  }

  // Last resort: treat input as exact ticker
  const quote = await fetchQuote(q);
  return [quote];
}

// Hook for live price polling
export function useLivePrice(symbol: string | null, intervalMs = 15_000) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const prevPrice = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  const refresh = useCallback(async () => {
    if (!symbol) return;
    const q = await fetchQuote(symbol);
    setQuote(q);
    if (prevPrice.current !== null && prevPrice.current !== q.price) {
      setFlash(q.price > prevPrice.current ? 'up' : 'down');
      setTimeout(() => setFlash(null), 600);
    }
    prevPrice.current = q.price;
  }, [symbol]);

  useEffect(() => {
    if (!symbol) { setQuote(null); return; }
    setLoading(true);
    fetchQuote(symbol).then(q => {
      setQuote(q);
      prevPrice.current = q.price;
      setLoading(false);
    });
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [symbol, intervalMs, refresh]);

  return { quote, loading, flash };
}

// Hook for polling multiple symbols (portfolio)
export function useMultipleQuotes(symbols: string[], intervalMs = 20_000) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});

  const refresh = useCallback(async () => {
    if (symbols.length === 0) return;
    const results = await Promise.all(symbols.map(s => fetchQuote(s)));
    const map: Record<string, StockQuote> = {};
    results.forEach(q => { map[q.symbol] = q; });
    setQuotes(map);
  }, [symbols.join(',')]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return quotes;
}
