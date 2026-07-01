// MARKET.EXE — Search Bar + Popular Tickers
import { useState, useRef, useEffect, useCallback } from 'react';
import { searchStocks, fetchQuote } from './useStockData';
import { StockQuote, POPULAR_TICKERS } from './types';
import { formatCurrency, formatPercent } from './AnimatedNumber';

interface SearchBarProps {
  onSelect: (symbol: string) => void;
  sound: { click: () => void };
}

export function SearchBar({ onSelect, sound }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockQuote[]>([]);
  const [popularQuotes, setPopularQuotes] = useState<Record<string, StockQuote>>({});
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load popular ticker quotes on mount
  useEffect(() => {
    Promise.all(POPULAR_TICKERS.map(t => fetchQuote(t))).then(quotes => {
      const map: Record<string, StockQuote> = {};
      quotes.forEach(q => { map[q.symbol] = q; });
      setPopularQuotes(map);
    });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const r = await searchStocks(q);
    setResults(r);
    setSearching(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSelect = (symbol: string) => {
    sound.click();
    setQuery('');
    setResults([]);
    onSelect(symbol);
  };

  const showResults = focused && (results.length > 0 || searching);
  const showPopular = !query.trim();

  return (
    <div style={{ width: '100%', maxWidth: '560px' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search any stock..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '2px',
            padding: 'clamp(12px,1.5vw,16px) clamp(16px,2vw,20px)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(13px,1.4vw,17px)',
            color: 'rgba(255,255,255,0.88)',
            outline: 'none',
            letterSpacing: '0.04em',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        {searching && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'DM Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
          }}>
            ...
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && (
        <div style={{
          marginTop: '2px',
          background: '#0d0c0b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          {results.map(q => (
            <SearchResult key={q.symbol} quote={q} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {/* Popular tickers */}
      {showPopular && (
        <div style={{ marginTop: 'clamp(20px,3vw,32px)' }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px,0.75vw,9px)',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Popular
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {POPULAR_TICKERS.map(ticker => {
              const q = popularQuotes[ticker];
              const positive = (q?.changePercent ?? 0) >= 0;
              return (
                <button
                  key={ticker}
                  onClick={() => handleSelect(ticker)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    transition: 'background 0.15s, border-color 0.15s',
                    minWidth: '80px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 'clamp(10px,1vw,13px)',
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.85)',
                  }}>
                    {ticker}
                  </span>
                  {q && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 'clamp(8px,0.8vw,10px)',
                      color: positive ? 'rgba(74,222,128,0.75)' : 'rgba(248,113,113,0.75)',
                    }}>
                      {formatPercent(q.changePercent)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResult({
  quote,
  onSelect,
}: {
  quote: StockQuote;
  onSelect: (symbol: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const positive = quote.changePercent >= 0;

  return (
    <div
      onClick={() => onSelect(quote.symbol)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr auto auto',
        alignItems: 'center',
        gap: '12px',
        padding: 'clamp(10px,1.2vw,14px) clamp(14px,1.5vw,18px)',
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.12s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(11px,1.1vw,14px)',
        letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.9)',
      }}>
        {quote.symbol}
      </span>
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(11px,1.1vw,13px)',
        color: 'rgba(255,255,255,0.35)',
        fontWeight: 300,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {quote.name !== quote.symbol ? quote.name : ''}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(11px,1.1vw,14px)',
        color: 'rgba(255,255,255,0.75)',
        whiteSpace: 'nowrap',
      }}>
        {formatCurrency(quote.price)}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(10px,1vw,12px)',
        color: positive ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)',
        whiteSpace: 'nowrap',
      }}>
        {formatPercent(quote.changePercent)}
      </span>
    </div>
  );
}
