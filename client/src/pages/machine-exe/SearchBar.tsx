// THE_MACHINE.EXE — Search Bar
// Fuzzy + company name + partial matching. No Popular section.
import { useState, useRef, useCallback } from 'react';
import { searchStocks } from './useStockData';
import { StockQuote } from './types';
import { formatCurrency, formatPercent } from './AnimatedNumber';
import { RealSparkline } from './RealSparkline';

// ── Local fuzzy match dictionary ─────────────────────────────────────────────
// Maps common words/names to tickers for instant local resolution
const LOCAL_MAP: Record<string, string> = {
  // Company names
  'apple': 'AAPL', 'iphone': 'AAPL',
  'nvidia': 'NVDA', 'nvidea': 'NVDA', 'nvida': 'NVDA',
  'microsoft': 'MSFT', 'windows': 'MSFT', 'xbox': 'MSFT',
  'amazon': 'AMZN', 'aws': 'AMZN',
  'meta': 'META', 'facebook': 'META', 'instagram': 'META',
  'tesla': 'TSLA', 'elon': 'TSLA',
  'google': 'GOOGL', 'alphabet': 'GOOGL', 'youtube': 'GOOGL',
  'netflix': 'NFLX',
  'amd': 'AMD', 'advanced micro': 'AMD',
  'intel': 'INTC',
  'qualcomm': 'QCOM',
  'broadcom': 'AVGO',
  'oracle': 'ORCL',
  'salesforce': 'CRM',
  'adobe': 'ADBE',
  'paypal': 'PYPL',
  'uber': 'UBER',
  'airbnb': 'ABNB',
  'spotify': 'SPOT',
  'twitter': 'X', 'x corp': 'X',
  'snap': 'SNAP', 'snapchat': 'SNAP',
  'coinbase': 'COIN',
  'robinhood': 'HOOD',
  'berkshire': 'BRK.B', 'buffett': 'BRK.B',
  'jpmorgan': 'JPM', 'jp morgan': 'JPM',
  'goldman': 'GS', 'goldman sachs': 'GS',
  'bank of america': 'BAC',
  'wells fargo': 'WFC',
  'visa': 'V',
  'mastercard': 'MA',
  'disney': 'DIS',
  'boeing': 'BA',
  'ford': 'F',
  'gm': 'GM', 'general motors': 'GM',
  'chevron': 'CVX',
  'exxon': 'XOM', 'exxonmobil': 'XOM',
  'walmart': 'WMT',
  'target': 'TGT',
  'costco': 'COST',
  'home depot': 'HD',
  'starbucks': 'SBUX',
  'mcdonalds': 'MCD', "mcdonald's": 'MCD',
  'pfizer': 'PFE',
  'johnson': 'JNJ', 'johnson & johnson': 'JNJ',
  'abbvie': 'ABBV',
  'eli lilly': 'LLY', 'lilly': 'LLY',
  // ETFs
  'spy': 'SPY', 's&p': 'SPY', 'sp500': 'SPY', 's&p 500': 'SPY',
  'qqq': 'QQQ', 'nasdaq': 'QQQ', 'tech etf': 'QQQ',
  'dia': 'DIA', 'dow': 'DIA', 'dow jones': 'DIA',
  'iwm': 'IWM', 'russell': 'IWM', 'small cap': 'IWM',
  'vix': 'VIXY', 'volatility': 'VIXY',
  // Funny/close matches
  'racecar': 'RACE', 'ferrari': 'RACE',
  'spacex': 'TSLA',
  'openai': 'MSFT',
  'chatgpt': 'MSFT',
  'ipad': 'AAPL', 'macbook': 'AAPL', 'mac': 'AAPL',
};

function localResolve(q: string): string | null {
  const lower = q.toLowerCase().trim();
  // Exact ticker match
  if (/^[A-Z]{1,5}$/.test(q.toUpperCase())) return null; // let API handle exact tickers
  // Direct map lookup
  if (LOCAL_MAP[lower]) return LOCAL_MAP[lower];
  // Partial match
  for (const [key, ticker] of Object.entries(LOCAL_MAP)) {
    if (key.startsWith(lower) || lower.startsWith(key)) return ticker;
  }
  return null;
}

interface SearchBarProps {
  onSelect: (symbol: string) => void;
  sound: { click: () => void };
  centered?: boolean;
}

export function SearchBar({ onSelect, sound, centered = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockQuote[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);

    // Try local resolution first (instant, no API call)
    const localTicker = localResolve(q);
    if (localTicker) {
      const r = await searchStocks(localTicker);
      if (r.length > 0) { setResults(r); setSearching(false); return; }
    }

    // Fall back to API search
    const r = await searchStocks(q);
    setResults(r);
    setSearching(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 280);
  };

  const handleSelect = (symbol: string) => {
    sound.click();
    setQuery('');
    setResults([]);
    onSelect(symbol);
  };

  const showResults = focused && (results.length > 0 || searching);

  return (
    <div style={{
      width: '100%',
      maxWidth: centered ? '540px' : '480px',
      margin: centered ? '0 auto' : undefined,
    }}>
      {centered && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(7px,0.7vw,9px)',
          letterSpacing: '0.32em',
          color: '#8E877B',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: '10px',
        }}>
          Query the Machine
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={centered ? 'Search any stock, company, or index...' : 'Search any stock...'}
          autoComplete="off"
          style={{
            width: '100%',
            background: 'rgba(244,241,234,0.03)',
            border: `1px solid ${focused ? 'rgba(244,241,234,0.28)' : 'rgba(244,241,234,0.12)'}`,
            borderRadius: '2px',
            padding: centered ? 'clamp(14px,1.8vw,18px) clamp(18px,2vw,24px)' : 'clamp(12px,1.5vw,16px) clamp(16px,2vw,20px)',
            fontFamily: "'DM Mono', monospace",
            fontSize: centered ? 'clamp(14px,1.5vw,18px)' : 'clamp(13px,1.4vw,17px)',
            color: '#F4F1EA',
            outline: 'none',
            letterSpacing: '0.04em',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            textAlign: centered ? 'center' : 'left',
          }}
        />
        {searching && (
          <div style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em',
            color: '#8E877B', textTransform: 'uppercase',
          }}>
            ...
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div style={{
          marginTop: '2px',
          background: '#0a0908',
          border: '1px solid rgba(244,241,234,0.12)',
          overflow: 'hidden',
          position: 'absolute',
          zIndex: 100,
          width: '100%',
          maxWidth: centered ? '540px' : '480px',
        }}>
          {results.map(q => (
            <SearchResult key={q.symbol} quote={q} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResult({ quote, onSelect }: { quote: StockQuote; onSelect: (s: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const positive = quote.changePercent >= 0;
  return (
    <div
      onClick={() => onSelect(quote.symbol)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr 52px auto auto',
        alignItems: 'center',
        gap: '12px',
        padding: 'clamp(10px,1.2vw,14px) clamp(14px,1.5vw,18px)',
        cursor: 'pointer',
        background: hovered ? 'rgba(244,241,234,0.04)' : 'transparent',
        transition: 'background 0.12s',
        borderBottom: '1px solid rgba(244,241,234,0.04)',
      }}
    >
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,14px)', letterSpacing: '0.1em', color: '#F4F1EA' }}>
        {quote.symbol}
      </span>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(11px,1.1vw,13px)', color: '#8E877B', fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {quote.name !== quote.symbol ? quote.name : ''}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RealSparkline symbol={quote.symbol} width={48} height={20} currentPrice={quote.price} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,14px)', color: '#B8B2A7', whiteSpace: 'nowrap' }}>
        {formatCurrency(quote.price)}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(10px,1vw,12px)', color: positive ? 'rgba(110,200,130,0.85)' : 'rgba(210,90,90,0.85)', whiteSpace: 'nowrap' }}>
        {formatPercent(quote.changePercent)}
      </span>
    </div>
  );
}
