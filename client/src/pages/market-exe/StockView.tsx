// MARKET.EXE — Stock View (individual stock detail + trade)
import { useEffect, useState } from 'react';
import { fetchSparkline, useLivePrice } from './useStockData';
import { Sparkline } from './Sparkline';
import { TradeModal } from './TradeModal';
import { AnimatedNumber, formatCurrency, formatPercent } from './AnimatedNumber';
import { Holding } from './types';

interface StockViewProps {
  symbol: string;
  holding: Holding | undefined;
  cash: number;
  onBuy: (symbol: string, name: string, price: number, shares: number) => void;
  onSell: (symbol: string, price: number, shares: number) => void;
  onBack: () => void;
  sound: {
    click: () => void;
    buy: () => void;
    sell: () => void;
    error: () => void;
  };
}

export function StockView({
  symbol,
  holding,
  cash,
  onBuy,
  onSell,
  onBack,
  sound,
}: StockViewProps) {
  const { quote, loading, flash } = useLivePrice(symbol, 15_000);
  const [sparkline, setSparkline] = useState<{ t: number; v: number }[]>([]);
  const [modal, setModal] = useState<'buy' | 'sell' | null>(null);

  useEffect(() => {
    if (!quote) return;
    fetchSparkline(symbol, quote.price).then(setSparkline);
  }, [symbol, quote?.price]);

  const positive = (quote?.changePercent ?? 0) >= 0;
  const positionValue = holding && quote ? holding.shares * quote.price : 0;
  const positionGain = holding && quote ? (quote.price - holding.avgCost) * holding.shares : 0;
  const positionGainPct = holding && quote ? ((quote.price - holding.avgCost) / holding.avgCost) * 100 : 0;

  const maxBuy = quote ? Math.floor(cash / quote.price) : 0;
  const maxSell = holding?.shares ?? 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Back button */}
      <button
        onClick={() => { sound.click(); onBack(); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(8px,0.85vw,10px)',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          padding: '0 0 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M6 1L1 4L6 7M1 4H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {loading && !quote ? (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(8px,0.85vw,10px)',
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          padding: '40px 0',
        }}>
          FETCHING...
        </div>
      ) : quote ? (
        <>
          {/* Ticker + name */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(28px,4vw,56px)',
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1,
              marginBottom: '6px',
            }}>
              {quote.symbol}
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(12px,1.2vw,15px)',
              color: 'rgba(255,255,255,0.35)',
              fontWeight: 300,
              letterSpacing: '0.02em',
            }}>
              {quote.name !== quote.symbol ? quote.name : ''}
            </div>
          </div>

          {/* Price + change */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'clamp(12px,2vw,24px)',
            margin: '24px 0',
            flexWrap: 'wrap',
          }}>
            <AnimatedNumber
              value={quote.price}
              format={formatCurrency}
              flash={flash}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(32px,5vw,72px)',
                letterSpacing: '-0.03em',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1,
              }}
            />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(14px,1.6vw,20px)',
              color: positive ? 'rgba(74,222,128,0.85)' : 'rgba(248,113,113,0.85)',
              letterSpacing: '0.02em',
            }}>
              {formatPercent(quote.changePercent)}
            </span>
          </div>

          {/* Sparkline */}
          <div style={{ marginBottom: '32px', opacity: 0.8 }}>
            <Sparkline data={sparkline} positive={positive} height={48} />
          </div>

          {/* Position info (if holding) */}
          {holding && (
            <div style={{
              marginBottom: '32px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '6px' }}>Shares</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: 'rgba(255,255,255,0.85)' }}>{holding.shares}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '6px' }}>Avg Cost</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: 'rgba(255,255,255,0.85)' }}>{formatCurrency(holding.avgCost)}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '6px' }}>Position Value</div>
                <AnimatedNumber
                  value={positionValue}
                  format={formatCurrency}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: 'rgba(255,255,255,0.85)' }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '6px' }}>Total P&L</div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(14px,1.5vw,18px)',
                  color: positionGain >= 0 ? 'rgba(74,222,128,0.85)' : 'rgba(248,113,113,0.85)',
                }}>
                  {formatCurrency(positionGain)} ({formatPercent(positionGainPct)})
                </div>
              </div>
            </div>
          )}

          {/* BUY / SELL buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => { sound.click(); setModal('buy'); }}
              disabled={maxBuy === 0}
              style={{
                flex: 1,
                padding: 'clamp(14px,2vw,20px)',
                background: maxBuy > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${maxBuy > 0 ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: maxBuy > 0 ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.15)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(10px,1vw,13px)',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                cursor: maxBuy > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, border-color 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (maxBuy > 0) (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.18)'; }}
              onMouseLeave={e => { if (maxBuy > 0) (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.1)'; }}
              onMouseDown={e => { if (maxBuy > 0) (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              BUY
            </button>
            <button
              onClick={() => { sound.click(); setModal('sell'); }}
              disabled={maxSell === 0}
              style={{
                flex: 1,
                padding: 'clamp(14px,2vw,20px)',
                background: maxSell > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${maxSell > 0 ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: maxSell > 0 ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.15)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(10px,1vw,13px)',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                cursor: maxSell > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, border-color 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (maxSell > 0) (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.18)'; }}
              onMouseLeave={e => { if (maxSell > 0) (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'; }}
              onMouseDown={e => { if (maxSell > 0) (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              SELL
            </button>
          </div>
        </>
      ) : null}

      {/* Trade modals */}
      {modal && quote && (
        <TradeModal
          mode={modal}
          quote={quote}
          maxShares={modal === 'buy' ? maxBuy : maxSell}
          cash={cash}
          onConfirm={shares => {
            if (modal === 'buy') onBuy(quote.symbol, quote.name, quote.price, shares);
            else onSell(quote.symbol, quote.price, shares);
            setModal(null);
          }}
          onClose={() => setModal(null)}
          sound={sound}
        />
      )}
    </div>
  );
}
