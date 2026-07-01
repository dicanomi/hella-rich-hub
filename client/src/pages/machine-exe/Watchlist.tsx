// THE_MACHINE.EXE — Observation Deck (Watchlist)
import { useState, useEffect, useCallback } from 'react';
import { fetchQuote } from './useStockData';
import { StockQuote } from './types';
import { formatCurrency, formatPercent } from './AnimatedNumber';
import { RealSparkline } from './RealSparkline';

const STORAGE_KEY = 'machine_exe_watchlist_v1';
const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY', 'QQQ'];

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_WATCHLIST;
}

function saveWatchlist(list: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

interface WatchlistProps {
  onSelect: (symbol: string) => void;
  activeSymbol: string | null;
}

export function Watchlist({ onSelect, activeSymbol }: WatchlistProps) {
  const [symbols, setSymbols] = useState<string[]>(loadWatchlist);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const map: Record<string, StockQuote> = { ...quotes };
    for (const sym of symbols) {
      try { map[sym] = await fetchQuote(sym); } catch { /* keep stale */ }
    }
    setQuotes({ ...map });
  }, [symbols.join(',')]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const addSymbol = async () => {
    const sym = addInput.toUpperCase().trim();
    if (!sym || symbols.includes(sym)) { setAddInput(''); setAdding(false); return; }
    const newList = [...symbols, sym];
    setSymbols(newList);
    saveWatchlist(newList);
    setAddInput('');
    setAdding(false);
  };

  const removeSymbol = (sym: string) => {
    const newList = symbols.filter(s => s !== sym);
    setSymbols(newList);
    saveWatchlist(newList);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(7px,0.75vw,9px)',
          letterSpacing: '0.28em',
          color: '#8E877B',
          textTransform: 'uppercase',
        }}>
          Observation Deck
        </div>
        <button
          onClick={() => setAdding(v => !v)}
          style={{
            background: 'none', border: '1px solid rgba(244,241,234,0.12)',
            color: '#8E877B', cursor: 'pointer', padding: '3px 8px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px,0.7vw,8px)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8E877B'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.12)'; }}
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            type="text"
            value={addInput}
            onChange={e => setAddInput(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') addSymbol(); if (e.key === 'Escape') { setAdding(false); setAddInput(''); } }}
            placeholder="TICKER"
            autoFocus
            style={{
              flex: 1, background: 'rgba(244,241,234,0.04)',
              border: '1px solid rgba(244,241,234,0.18)',
              padding: '7px 10px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(10px,1vw,12px)',
              color: '#F4F1EA', outline: 'none',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          />
          <button
            onClick={addSymbol}
            style={{
              background: 'rgba(255,168,74,0.1)', border: '1px solid rgba(255,168,74,0.3)',
              color: '#FFA84A', cursor: 'pointer', padding: '7px 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(8px,0.8vw,10px)',
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}
          >
            Add
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {symbols.map(sym => {
          const q = quotes[sym];
          const up = (q?.changePercent ?? 0) >= 0;
          const isActive = sym === activeSymbol;

          return (
            <div
              key={sym}
              onClick={() => onSelect(sym)}
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr auto auto auto',
                alignItems: 'center',
                gap: '10px',
                padding: 'clamp(8px,1.2vw,12px) 8px',
                borderBottom: '1px solid rgba(244,241,234,0.05)',
                cursor: 'pointer',
                background: isActive ? 'rgba(255,168,74,0.05)' : 'transparent',
                borderLeft: isActive ? '2px solid rgba(255,168,74,0.5)' : '2px solid transparent',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(244,241,234,0.03)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Ticker */}
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(10px,1vw,12px)',
                letterSpacing: '0.1em',
                color: isActive ? '#FFA84A' : '#F4F1EA',
                fontWeight: isActive ? 600 : 400,
              }}>
                {sym}
              </span>

              {/* Sparkline */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <RealSparkline symbol={sym} width={64} height={24} currentPrice={q?.price} />
              </div>

              {/* Price */}
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(10px,1vw,12px)',
                color: '#B8B2A7',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}>
                {q ? formatCurrency(q.price) : '—'}
              </span>

              {/* % change */}
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', color: up ? 'rgba(110,200,130,0.85)' : 'rgba(210,90,90,0.85)', whiteSpace: 'nowrap', minWidth: '52px', textAlign: 'right' }}>
                {q ? formatPercent(q.changePercent) : '—'}
              </span>
              {/* Remove button */}
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeSymbol(sym);
                }}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  background: 'none',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  color: 'rgba(244,241,234,0.25)',
                  padding: '6px 8px',
                  fontSize: '14px',
                  lineHeight: 1,
                  transition: 'color 0.15s, border-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '28px',
                  minHeight: '28px',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(210,90,90,0.9)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(210,90,90,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(244,241,234,0.25)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
                title={`Remove ${sym}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
