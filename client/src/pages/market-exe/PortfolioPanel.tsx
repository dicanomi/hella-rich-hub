// MARKET.EXE — Portfolio Panel
import { Holding, StockQuote } from './types';
import { AnimatedNumber, formatCurrency, formatPercent } from './AnimatedNumber';

interface PortfolioPanelProps {
  cash: number;
  holdings: Record<string, Holding>;
  quotes: Record<string, StockQuote>;
  onSelectStock: (symbol: string) => void;
  totalValue: number;
}

export function PortfolioPanel({
  cash,
  holdings,
  quotes,
  onSelectStock,
  totalValue,
}: PortfolioPanelProps) {
  const holdingList = Object.values(holdings);

  return (
    <div style={{ width: '100%' }}>
      {/* Portfolio summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '32px',
      }}>
        <div style={{ background: '#0a0908', padding: 'clamp(16px,2vw,24px)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '8px' }}>Available Cash</div>
          <AnimatedNumber
            value={cash}
            format={formatCurrency}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(16px,2vw,24px)', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}
          />
        </div>
        <div style={{ background: '#0a0908', padding: 'clamp(16px,2vw,24px)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Value</div>
          <AnimatedNumber
            value={totalValue}
            format={formatCurrency}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(16px,2vw,24px)', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}
          />
        </div>
        <div style={{ background: '#0a0908', padding: 'clamp(16px,2vw,24px)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '8px' }}>P&L vs Start</div>
          {(() => {
            const gain = totalValue - 100_000;
            const pct = (gain / 100_000) * 100;
            return (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(16px,2vw,24px)',
                color: gain >= 0 ? 'rgba(74,222,128,0.85)' : 'rgba(248,113,113,0.85)',
                letterSpacing: '-0.01em',
              }}>
                {formatCurrency(gain)} ({formatPercent(pct)})
              </div>
            );
          })()}
        </div>
      </div>

      {/* Holdings */}
      {holdingList.length === 0 ? (
        <div style={{
          padding: 'clamp(40px,6vh,64px) 0',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(10px,1vw,13px)',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.18)',
          textTransform: 'uppercase',
        }}>
          Your fortune begins now.
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr 1fr',
            gap: '8px',
            padding: '0 0 12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '4px',
          }}>
            {['Ticker', 'Shares', 'Value', "Today's G/L", 'Total G/L'].map(h => (
              <div key={h} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(7px,0.75vw,9px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.22)',
                textTransform: 'uppercase',
              }}>
                {h}
              </div>
            ))}
          </div>

          {holdingList.map(h => {
            const q = quotes[h.symbol];
            const price = q?.price ?? h.avgCost;
            const value = h.shares * price;
            const totalGain = (price - h.avgCost) * h.shares;
            const totalGainPct = ((price - h.avgCost) / h.avgCost) * 100;
            const todayGain = q ? h.shares * q.change : 0;
            const todayGainPct = q?.changePercent ?? 0;

            return (
              <div
                key={h.symbol}
                onClick={() => onSelectStock(h.symbol)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr 1fr 1fr',
                  gap: '8px',
                  padding: 'clamp(12px,1.5vw,16px) 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(12px,1.2vw,15px)',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.88)',
                }}>
                  {h.symbol}
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(11px,1.1vw,14px)',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  {h.shares}
                </div>
                <AnimatedNumber
                  value={value}
                  format={formatCurrency}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 'clamp(11px,1.1vw,14px)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                />
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(11px,1.1vw,14px)',
                  color: todayGain >= 0 ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)',
                }}>
                  {formatCurrency(todayGain)} ({formatPercent(todayGainPct)})
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(11px,1.1vw,14px)',
                  color: totalGain >= 0 ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)',
                }}>
                  {formatCurrency(totalGain)} ({formatPercent(totalGainPct)})
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
