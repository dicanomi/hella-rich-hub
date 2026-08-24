// MARKET.EXE — Stock View (individual stock detail + trade)
import { useState } from 'react';
import { useLivePrice } from './useStockData';
import { RealSparkline } from './RealSparkline';
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
  const { quote, loading, flash, error } = useLivePrice(symbol, 30_000);
  const [modal, setModal] = useState<'buy' | 'sell' | null>(null);

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
          color: '#8E877B',
          textTransform: 'uppercase',
          padding: '40px 0',
        }}>
          FETCHING...
        </div>
      ) : error ? (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: 'rgba(210,90,90,0.7)', textTransform: 'uppercase', padding: '40px 0' }}>
          MARKET FEED OFFLINE — Portfolio data preserved.
        </div>
      ) : quote ? (
        <>
          {/* Ticker + name */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(28px,4vw,56px)',
              letterSpacing: '-0.02em',
              color: '#F4F1EA',
              lineHeight: 1,
              marginBottom: '6px',
            }}>
              {quote.symbol}
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(12px,1.2vw,15px)',
              color: '#B8B2A7',
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
color: '#F4F1EA',
              lineHeight: 1,
            }}
            />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(14px,1.6vw,20px)',
              color: positive ? 'rgba(110,200,130,0.9)' : 'rgba(210,90,90,0.9)',
              letterSpacing: '0.02em',
            }}>
              {formatPercent(quote.changePercent)}
            </span>
          </div>

          {/* Day stats */}
          {(quote.high || quote.low || quote.previousClose) && (
            <div style={{ display: 'flex', gap: 'clamp(16px,2vw,32px)', marginBottom: '16px', flexWrap: 'wrap' }}>
              {quote.previousClose && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '3px' }}>Prev Close</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,14px)', color: '#B8B2A7' }}>${quote.previousClose.toFixed(2)}</div>
                </div>
              )}
              {quote.high && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '3px' }}>Day High</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,14px)', color: 'rgba(110,200,130,0.85)' }}>${quote.high.toFixed(2)}</div>
                </div>
              )}
              {quote.low && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '3px' }}>Day Low</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,14px)', color: 'rgba(210,90,90,0.85)' }}>${quote.low.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}

          {/* Sparkline */}
          <div style={{ marginBottom: '32px' }}>
            <RealSparkline symbol={quote.symbol} height={48} currentPrice={quote.price} />
          </div>

          {/* Position info (if holding) */}
          {holding && (
            <div style={{
              marginBottom: '32px',
              padding: '20px',
              border: '1px solid rgba(244,241,234,0.12)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>Shares</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: '#F4F1EA' }}>{holding.shares}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>Avg Cost</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: '#F4F1EA' }}>{formatCurrency(holding.avgCost)}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>Position Value</div>
                <AnimatedNumber
                  value={positionValue}
                  format={formatCurrency}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.5vw,18px)', color: '#F4F1EA' }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.2em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>Total P&L</div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(14px,1.5vw,18px)',
                  color: positionGain >= 0 ? 'rgba(110,200,130,0.9)' : 'rgba(210,90,90,0.9)',
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
          ownedShares={modal === 'buy' ? maxBuy : maxSell}
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
