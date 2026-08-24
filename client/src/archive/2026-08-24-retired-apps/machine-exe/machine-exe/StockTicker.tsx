// MARKET.EXE — Live Scrolling Stock Ticker
import { useEffect, useRef, useState } from 'react';
import { fetchQuote } from './useStockData';
import { StockQuote } from './types';
import { RealSparkline } from './RealSparkline';

const TICKER_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'NVDA', 'MSFT', 'AMZN', 'META', 'TSLA'];

interface TickerItem {
  quote: StockQuote;
  flash: boolean;
}

export function StockTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [flashing, setFlashing] = useState<Record<string, boolean>>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    // Stagger initial load — fetch sequentially through the rate-limited queue
    const load = async () => {
      const results: StockQuote[] = [];
      for (const sym of TICKER_SYMBOLS) {
        try { results.push(await fetchQuote(sym)); } catch { /* skip */ }
      }
      if (results.length > 0) {
        setItems(results.map(q => ({ quote: q, flash: false })));
        results.forEach(q => { prevPrices.current[q.symbol] = q.price; });
      }
    };
    load();
    // Refresh every 60s — ticker is decorative, doesn't need to be real-time
    const id = setInterval(async () => {
      const results: StockQuote[] = [];
      const newFlash: Record<string, boolean> = {};
      for (const sym of TICKER_SYMBOLS) {
        try {
          const q = await fetchQuote(sym);
          results.push(q);
          if (prevPrices.current[q.symbol] !== undefined && prevPrices.current[q.symbol] !== q.price) newFlash[q.symbol] = true;
          prevPrices.current[q.symbol] = q.price;
        } catch { /* skip */ }
      }
      if (results.length > 0) {
        setItems(results.map(q => ({ quote: q, flash: !!newFlash[q.symbol] })));
        if (Object.keys(newFlash).length > 0) { setFlashing(newFlash); setTimeout(() => setFlashing({}), 800); }
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Show placeholder items while loading so the ticker bar is always visible
  const displayItems = items.length > 0 ? items : TICKER_SYMBOLS.map(sym => ({
    quote: { symbol: sym, name: sym, price: 0, change: 0, changePercent: 0 },
    flash: false,
  }));

  // Duplicate items for seamless loop
  const doubled = [...displayItems, ...displayItems];

  return (
    <div style={{
      width: '100%',
      background: '#000',
      borderTop: '1px solid rgba(244,241,234,0.18)',
      borderBottom: '1px solid rgba(244,241,234,0.18)',
      overflow: 'hidden',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      <style>{`
        @keyframes mxTickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .mx-ticker-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: mxTickerScroll 60s linear infinite;
          will-change: transform;
        }
        .mx-ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes mxTickerPulse {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .mx-ticker-flash {
          animation: mxTickerPulse 0.4s ease 2;
        }
      `}</style>
      <div className="mx-ticker-track">
        {doubled.map((item, i) => {
          const { quote } = item;
          const up = quote.changePercent >= 0;
          const isFlashing = !!flashing[quote.symbol];
          return (
            <span
              key={`${quote.symbol}-${i}`}
              className={isFlashing ? 'mx-ticker-flash' : ''}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 20px',
                borderRight: '1px solid rgba(244,241,234,0.08)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
              }}
            >
              <span style={{ color: '#FF8A00', fontWeight: 500 }}>{quote.symbol}</span>
              {quote.price > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
                  <RealSparkline symbol={quote.symbol} width={36} height={16} currentPrice={quote.price} />
                </span>
              )}
              <span style={{ color: quote.price > 0 ? '#F4F1EA' : '#8E877B' }}>
                {quote.price > 0 ? '$' + quote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </span>
              {quote.price > 0 && (
                <span style={{ color: up ? 'rgba(110,200,130,0.85)' : 'rgba(210,90,90,0.85)', fontSize: '10px' }}>
                  {up ? '▲' : '▼'} {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
