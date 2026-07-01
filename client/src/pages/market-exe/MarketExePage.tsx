/**
 * MARKET.EXE — Paper Trading Simulator
 * hella.rich product — Bloomberg Terminal discovered in an abandoned arcade
 *
 * Design: Black background, DM Mono, amber accents, minimal UI
 * Stack: React + TypeScript + LocalStorage + Polygon.io API
 */
import { useState, useEffect } from 'react';
import { usePortfolio } from './usePortfolio';
import { useMultipleQuotes } from './useStockData';
import { useSound } from './useSound';
import { SearchBar } from './SearchBar';
import { StockView } from './StockView';
import { PortfolioPanel } from './PortfolioPanel';
import { formatCurrency } from './AnimatedNumber';

// ── GitHub star count (dicanomi) ────────────────────────────────────────────
function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.github.com/repos/dicanomi/hella-rich-hub')
      .then(r => r.json())
      .then(d => setStars(d.stargazers_count ?? null))
      .catch(() => {});
  }, []);
  return (
    <a
      href="https://github.com/dicanomi"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px,0.75vw,9px)',
        letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.22)',
        textDecoration: 'none',
        textTransform: 'uppercase',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)')}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      {stars !== null ? stars : '—'}
    </a>
  );
}

// ── Mute toggle ─────────────────────────────────────────────────────────────
function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={muted ? 'Unmute' : 'Mute'}
      style={{
        background: 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '2px',
        cursor: 'pointer',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px,0.75vw,9px)',
        letterSpacing: '0.18em',
        color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = muted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      {muted ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      )}
      {muted ? 'Muted' : 'Sound'}
    </button>
  );
}

// ── Bankruptcy screen ────────────────────────────────────────────────────────
function BankruptScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(32px,6vw,80px)',
        letterSpacing: '0.1em',
        color: 'rgba(248,113,113,0.9)',
        textTransform: 'uppercase',
      }}>
        BANKRUPT.
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(13px,1.4vw,17px)',
        color: 'rgba(255,255,255,0.35)',
        fontWeight: 300,
      }}>
        You had your chance.
      </div>
      <button
        onClick={onRestart}
        style={{
          marginTop: '16px',
          background: 'none',
          border: '1px solid rgba(248,113,113,0.4)',
          color: 'rgba(248,113,113,0.7)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px,0.9vw,11px)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          padding: '12px 28px',
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.95)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'none';
          (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.7)';
        }}
      >
        Restart?
      </button>
    </div>
  );
}

// ── Millionaire notice ───────────────────────────────────────────────────────
function MillionaireNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'clamp(20px,3vh,32px)',
        right: 'clamp(20px,3vw,32px)',
        zIndex: 200,
        background: '#0a0908',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'mxFadeIn 0.3s ease',
      }}
    >
      <div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px,0.9vw,11px)',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          $1,000,000 reached.
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(11px,1.1vw,13px)',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 300,
        }}>
          Still not enough.
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.25)', padding: '4px',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)')}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="2" y1="2" x2="12" y2="12"/>
          <line x1="12" y1="2" x2="2" y2="12"/>
        </svg>
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MarketExePage() {
  const { portfolio, buy, sell, reset, totalValue, isBankrupt, isMillionaire } = usePortfolio();
  const sound = useSound();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [showMillionaire, setShowMillionaire] = useState(false);
  const [milestoneShown, setMilestoneShown] = useState(false);

  // Poll quotes for all holdings
  const holdingSymbols = Object.keys(portfolio.holdings);
  const quotes = useMultipleQuotes(holdingSymbols, 20_000);

  // Derived values
  const quotePrices: Record<string, number> = {};
  Object.entries(quotes).forEach(([sym, q]) => { quotePrices[sym] = q.price; });
  const total = totalValue(quotePrices);
  const bankrupt = isBankrupt(quotePrices);
  const millionaire = isMillionaire(quotePrices);

  // Millionaire milestone (once)
  useEffect(() => {
    if (millionaire && !milestoneShown) {
      setShowMillionaire(true);
      setMilestoneShown(true);
      sound.milestone();
    }
  }, [millionaire, milestoneShown]);

  const handleBuy = (symbol: string, name: string, price: number, shares: number) => {
    buy(symbol, name, price, shares);
  };

  const handleSell = (symbol: string, price: number, shares: number) => {
    sell(symbol, price, shares);
  };

  return (
    <>
      <style>{`
        @keyframes mxFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {bankrupt && <BankruptScreen onRestart={() => { sound.error(); reset(); setActiveSymbol(null); }} />}
      {showMillionaire && <MillionaireNotice onDismiss={() => setShowMillionaire(false)} />}

      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: 'rgba(255,255,255,0.88)',
        fontFamily: "'DM Mono', monospace",
        overflowX: 'hidden',
      }}>
        {/* Nav spacer for HellaRichNav */}
        <div style={{ height: 'clamp(44px, 6vh, 56px)', flexShrink: 0 }} />

        <div style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: 'clamp(32px,5vh,64px) clamp(20px,4vw,48px)',
        }}>
          {/* ── Header ── */}
          <div style={{ marginBottom: 'clamp(40px,6vh,72px)' }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(7px,0.75vw,9px)',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              hella.rich / Paper Trading Simulator
            </div>
            <h1 style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(28px,5vw,64px)',
              fontWeight: 400,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.95)',
              margin: '0 0 8px',
              lineHeight: 1,
            }}>
              MARKET.EXE
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(9px,0.9vw,11px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
              }}>
                Available Cash
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(18px,2.5vw,32px)',
                letterSpacing: '-0.01em',
                color: 'rgba(255,255,255,0.88)',
              }}>
                {formatCurrency(portfolio.cash)}
              </div>
            </div>
          </div>

          {/* ── Stock View or Search ── */}
          {activeSymbol ? (
            <StockView
              symbol={activeSymbol}
              holding={portfolio.holdings[activeSymbol]}
              cash={portfolio.cash}
              onBuy={handleBuy}
              onSell={handleSell}
              onBack={() => setActiveSymbol(null)}
              sound={sound}
            />
          ) : (
            <SearchBar onSelect={sym => { sound.click(); setActiveSymbol(sym); }} sound={sound} />
          )}

          {/* ── Portfolio ── */}
          <div style={{
            marginTop: 'clamp(48px,7vh,80px)',
            paddingTop: 'clamp(32px,4vh,48px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(7px,0.75vw,9px)',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}>
              Portfolio
            </div>
            <PortfolioPanel
              cash={portfolio.cash}
              holdings={portfolio.holdings}
              quotes={quotes}
              onSelectStock={sym => { sound.click(); setActiveSymbol(sym); }}
              totalValue={total}
            />
          </div>

          {/* ── Footer ── */}
          <footer style={{
            marginTop: 'clamp(48px,7vh,80px)',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(7px,0.75vw,9px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.12)',
                textTransform: 'uppercase',
              }}>
                Prices delayed. Paper trading only.
              </div>
            </div>
            <GitHubStars />
          </footer>
        </div>
      </div>
    </>
  );
}
