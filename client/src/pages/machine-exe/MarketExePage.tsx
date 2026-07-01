/**
 * MARKET.EXE — Paper Trading Simulator v3
 * hella.rich product — Bloomberg Terminal discovered in an abandoned arcade
 *
 * v3: Live Finnhub data, market status, offline handling, expanded ticker
 */
import { useState, useEffect } from 'react';
import { usePortfolio } from './usePortfolio';
import { useMultipleQuotes, useMarketStatus } from './useStockData';
import { useSound } from './useSound';
import { SearchBar } from './SearchBar';
import { StockView } from './StockView';
import { PortfolioPanel } from './PortfolioPanel';
import { StockTicker } from './StockTicker';
import { Leaderboard } from './Leaderboard';
import { MarketAlerts } from './MarketAlerts';
import { MarketHealthOrb, useMarketHealth } from './MarketHealth';
import { MarketPulse } from './MarketPulse';
import { AnimatedNumber, formatCurrency } from './AnimatedNumber';
import type { MarketStatus } from './useStockData';

// ── Market Status Badge ──────────────────────────────────────────────────────
function MarketStatusBadge({ status }: { status: MarketStatus }) {
  if (status.session === 'unknown' && !status.offline) return null;

  const label = status.offline
    ? 'MARKET FEED OFFLINE'
    : status.session === 'regular'
    ? 'MARKET OPEN'
    : status.session === 'pre-market'
    ? 'PRE-MARKET'
    : status.session === 'after-hours'
    ? 'AFTER HOURS'
    : 'MARKET CLOSED';

  const color = status.offline
    ? 'rgba(210,90,90,0.8)'
    : status.isOpen
    ? 'rgba(110,200,130,0.8)'
    : '#8E877B';

  const dot = status.offline ? null : (
    <span style={{
      display: 'inline-block',
      width: '5px', height: '5px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      ...(status.isOpen ? { animation: 'mxDotPulse 2s ease infinite' } : {}),
    }} />
  );

  const lastUpdate = status.lastUpdated
    ? new Date(status.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 'clamp(7px,0.75vw,9px)',
      letterSpacing: '0.18em',
      color,
      textTransform: 'uppercase',
    }}>
      {dot}
      {label}
      {lastUpdate && !status.offline && (
        <span style={{ color: '#8E877B', letterSpacing: '0.1em' }}>{lastUpdate}</span>
      )}
    </div>
  );
}

// ── Offline Banner ───────────────────────────────────────────────────────────
function OfflineBanner() {
  return (
    <div style={{
      background: 'rgba(210,90,90,0.08)',
      border: '1px solid rgba(210,90,90,0.25)',
      padding: '10px 20px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 'clamp(8px,0.85vw,10px)',
      letterSpacing: '0.18em',
      color: 'rgba(210,90,90,0.8)',
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: '12px',
      marginBottom: '16px',
    }}>
      <span>MARKET FEED OFFLINE</span>
      <span style={{ color: '#8E877B' }}>Attempting reconnect…</span>
    </div>
  );
}

// ── GitHub star count ────────────────────────────────────────────────────────
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
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px,0.75vw,9px)',
        letterSpacing: '0.18em',
        color: '#8E877B',
        textDecoration: 'none',
        textTransform: 'uppercase',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#B8B2A7')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
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
        background: 'none', border: '1px solid rgba(244,241,234,0.18)', borderRadius: '2px',
        cursor: 'pointer', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px',
        fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)',
        letterSpacing: '0.18em', color: muted ? '#8E877B' : '#B8B2A7', textTransform: 'uppercase',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = muted ? '#8E877B' : '#B8B2A7'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.18)'; }}
    >
      {muted ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
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
      position: 'fixed', inset: 0, zIndex: 100, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px',
      animation: 'mxFadeIn 0.4s ease',
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(32px,6vw,80px)', letterSpacing: '0.1em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase' }}>BANKRUPT.</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(13px,1.4vw,17px)', color: '#8E877B', fontWeight: 300 }}>You had your chance.</div>
      <button
        onClick={onRestart}
        style={{
          marginTop: '16px', background: 'none', border: '1px solid rgba(210,90,90,0.4)',
          color: 'rgba(210,90,90,0.7)', fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.22em', textTransform: 'uppercase',
          padding: '12px 28px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s, transform 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(210,90,90,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(210,90,90,0.95)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(210,90,90,0.7)'; }}
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      >
        Restart?
      </button>
    </div>
  );
}

// ── Millionaire notice ───────────────────────────────────────────────────────
function MillionaireNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 'clamp(20px,3vh,32px)', right: 'clamp(20px,3vw,32px)',
      zIndex: 200, background: '#000', border: '1px solid rgba(244,241,234,0.18)',
      padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px',
      animation: 'mxFadeIn 0.3s ease',
    }}>
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.18em', color: '#F4F1EA', textTransform: 'uppercase', marginBottom: '4px' }}>$1,000,000 reached.</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(11px,1.1vw,13px)', color: '#8E877B', fontWeight: 300 }}>Still not enough.</div>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E877B', padding: '4px', transition: 'color 0.2s' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F4F1EA')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const holdingSymbols = Object.keys(portfolio.holdings);
  const { quotes, offline } = useMultipleQuotes(holdingSymbols, 10_000);
  const marketStatus = useMarketStatus(60_000);
  const healthData = useMarketHealth(30_000);

  const quotePrices: Record<string, number> = {};
  Object.entries(quotes).forEach(([sym, q]) => { quotePrices[sym] = q.price; });
  const total = totalValue(quotePrices);
  const bankrupt = isBankrupt(quotePrices);
  const millionaire = isMillionaire(quotePrices);
  const portfolioGain = total - 100_000;

  useEffect(() => {
    if (millionaire && !milestoneShown) {
      setShowMillionaire(true);
      setMilestoneShown(true);
      sound.milestone();
    }
  }, [millionaire, milestoneShown]);

  return (
    <>
      <style>{`
        @keyframes mxFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mxSectionIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mxDotPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .mx-section-animate { opacity: 0; animation: mxSectionIn 0.5s ease forwards; }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .mx-btn { transition: background 0.18s ease, border-color 0.18s ease, transform 0.1s ease, box-shadow 0.18s ease !important; }
        .mx-btn:hover { box-shadow: 0 0 0 1px rgba(255,138,0,0.3) !important; }
        .mx-btn:active { transform: scale(0.97) !important; }
        .mx-stock-row { transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease !important; }
        .mx-stock-row:hover { transform: translateY(-1px) !important; border-color: rgba(244,241,234,0.22) !important; }
        .mx-link { transition: opacity 0.2s ease, color 0.2s ease !important; }
        .mx-link:hover { opacity: 0.7 !important; }
      `}</style>

      {bankrupt && <BankruptScreen onRestart={() => { sound.error(); reset(); setActiveSymbol(null); }} />}
      {showMillionaire && <MillionaireNotice onDismiss={() => setShowMillionaire(false)} />}
      <MarketAlerts holdingSymbols={holdingSymbols} portfolioGain={portfolioGain} healthScore={healthData.score} vix={healthData.vix} spyPct={healthData.spyPct} />

      <div style={{
        minHeight: '100vh', background: '#000', color: '#F4F1EA',
        fontFamily: "'DM Mono', monospace", overflowX: 'hidden',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        {/* Nav spacer */}
        <div style={{ height: 'clamp(44px, 6vh, 56px)', flexShrink: 0 }} />

        {/* Live ticker */}
        <StockTicker />

        {/* Header: title + cash + market status + search */}
        <div style={{ padding: 'clamp(20px,3vh,32px) clamp(20px,4vw,48px) 0', animation: 'mxSectionIn 0.4s ease 0.05s both' }}>
          {/* Title row */}
          <div style={{ marginBottom: 'clamp(12px,2vh,20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.28em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>
                hella.rich / Paper Trading Simulator
              </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(24px,4vw,52px)', fontWeight: 400, letterSpacing: '0.06em', color: '#F4F1EA', margin: 0, lineHeight: 1 }}>
                MARKET.EXE
              </h1>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.18em', color: '#8E877B', textTransform: 'uppercase' }}>Cash</div>
                  <AnimatedNumber value={portfolio.cash} format={formatCurrency} style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.8vw,22px)', letterSpacing: '-0.01em', color: '#F4F1EA' }} />
                </div>
              </div>
            </div>
            <MarketStatusBadge status={marketStatus} />
          </div>

          {/* Offline banner */}
          {offline && <OfflineBanner />}

          {/* Persistent search */}
          <SearchBar onSelect={sym => { sound.click(); setActiveSymbol(sym); }} sound={sound} />
        </div>

        {/* Market Pulse — full width below header */}
        <div style={{ padding: '0 clamp(20px,4vw,48px)', marginTop: 'clamp(8px,1.5vh,16px)' }}>
          <MarketPulse height={72} />
        </div>

        {/* ── Dashboard Grid ── */}
        <style>{`
          .mx-dashboard {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-areas:
              "main"
              "sidebar";
            gap: clamp(16px,2vw,28px);
            padding: clamp(20px,3vh,32px) clamp(20px,4vw,48px) clamp(48px,7vh,80px);
            animation: mxSectionIn 0.5s ease 0.1s both;
          }
          @media (min-width: 900px) {
            .mx-dashboard {
              grid-template-columns: 1fr 280px;
              grid-template-areas: "main sidebar";
            }
          }
          @media (min-width: 1200px) {
            .mx-dashboard {
              grid-template-columns: 1fr 300px;
            }
          }
        `}</style>

        <div className="mx-dashboard">

          {/* ── LEFT / MAIN COLUMN ── */}
          <div style={{ gridArea: 'main', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(20px,2.5vh,32px)' }}>

            {/* Search + popular tickers row is already in the header above */}

            {/* Market Health + Portfolio summary — side by side on wide screens */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(16px,2vw,28px)', alignItems: 'start' }}>
              <MarketHealthOrb data={healthData} />
              <PortfolioPanel
                cash={portfolio.cash}
                holdings={portfolio.holdings}
                quotes={quotes}
                onSelectStock={sym => { sound.click(); setActiveSymbol(sym); }}
                totalValue={total}
              />
            </div>

            {/* Stock detail view — appears when a stock is selected */}
            {activeSymbol && (
              <div style={{ borderTop: '1px solid rgba(244,241,234,0.1)', paddingTop: 'clamp(24px,3vh,36px)' }}>
                <StockView
                  symbol={activeSymbol}
                  holding={portfolio.holdings[activeSymbol]}
                  cash={portfolio.cash}
                  onBuy={(sym, name, price, shares) => buy(sym, name, price, shares)}
                  onSell={(sym, price, shares) => sell(sym, price, shares)}
                  onBack={() => setActiveSymbol(null)}
                  sound={sound}
                />
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ gridArea: 'sidebar', display: 'flex', flexDirection: 'column', gap: 'clamp(16px,2vh,24px)' }}>
            <Leaderboard yourValue={total} />
          </div>

        </div>

        {/* Footer */}
        <footer style={{
          padding: 'clamp(20px,3vh,32px) clamp(20px,4vw,48px)',
          borderTop: '1px solid rgba(244,241,234,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.18em', color: '#8E877B', textTransform: 'uppercase' }}>
              Prices delayed. Paper trading only.
            </div>
          </div>
          <GitHubStars />
        </footer>
      </div>
    </>
  );
}
