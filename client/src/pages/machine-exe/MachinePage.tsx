/**
 * THE_MACHINE.EXE
 * hella.rich — Interactive satire of capitalism disguised as premium financial software.
 *
 * Phase 1: Layout, The Machine hero, live data, trading UX, portfolio, watchlist.
 */
import { useState, useEffect } from 'react';
import { usePortfolio } from './usePortfolio';
import { useMultipleQuotes, useMarketStatus } from './useStockData';
import { useSound } from './useSound';
import { getMachineSoundEngine, scoreToState } from './MachineSoundEngine';
import { StockTicker } from './StockTicker';
import { StockView } from './StockView';
import { PortfolioPanel } from './PortfolioPanel';
import { Watchlist } from './Watchlist';
import { TheMachine, MachineState } from './TheMachine';
import { MarketPulse } from './MarketPulse';
import { TerminalBar } from './TerminalBar';
import { MachineSync, shouldShowSync, resetSync } from './MachineSync';
import { SplitFlapText } from './SplitFlapText';
import { useMarketHealth } from './MarketHealth';
import { AnimatedNumber, formatCurrency, formatPercent } from './AnimatedNumber';
import type { MarketStatus } from './useStockData';

// ── Search bar ───────────────────────────────────────────────────────────────
import { SearchBar } from './SearchBar';

// ── Market status label ──────────────────────────────────────────────────────
function StatusLabel({ status }: { status: MarketStatus }) {
  const label = status.offline && status.lastUpdated === 0 ? 'FEED OFFLINE'
    : status.session === 'regular' ? 'MARKET OPEN'
    : status.session === 'pre-market' ? 'PRE-MARKET'
    : status.session === 'after-hours' ? 'AFTER HOURS'
    : 'MARKET CLOSED';
  const color = (status.offline && status.lastUpdated === 0) ? 'rgba(210,90,90,0.8)'
    : status.isOpen ? 'rgba(110,200,130,0.8)'
    : '#8E877B';
  const lastUpdate = status.lastUpdated
    ? new Date(status.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block',
          ...(status.isOpen ? { animation: 'mxDotPulse 2s ease infinite' } : {}) }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.18em', color, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      {!status.isOpen && lastUpdate && (
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(6px,0.6vw,8px)', letterSpacing: '0.12em', color: '#8E877B', textTransform: 'uppercase' }}>
          LAST UPDATE {lastUpdate}
        </span>
      )}
    </div>
  );
}

// ── Mute button ──────────────────────────────────────────────────────────────
function MuteBtn({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      background: 'none',
      border: `1px solid ${muted ? 'rgba(244,241,234,0.12)' : 'rgba(255,168,74,0.3)'}`,
      cursor: 'pointer',
      padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '5px',
      fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)',
      letterSpacing: '0.15em',
      color: muted ? '#8E877B' : '#FFA84A',
      textTransform: 'uppercase',
      transition: 'color 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.3)'; }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = muted ? '#8E877B' : '#FFA84A';
        (e.currentTarget as HTMLElement).style.borderColor = muted ? 'rgba(244,241,234,0.12)' : 'rgba(255,168,74,0.3)';
      }}
    >
      {muted ? 'STANDBY' : 'ENGAGED'}
    </button>
  );
}

// ── GitHub stars ─────────────────────────────────────────────────────────────
function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.github.com/repos/dicanomi/hella-rich-hub').then(r => r.json()).then(d => setStars(d.stargazers_count ?? null)).catch(() => {});
  }, []);
  return (
    <a href="https://github.com/dicanomi" target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.15em', color: '#8E877B', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#B8B2A7')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      {stars !== null ? stars : '—'}
    </a>
  );
}

// ── Bankruptcy ───────────────────────────────────────────────────────────────
function BankruptScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', animation: 'mxFadeIn 0.4s ease' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(28px,5vw,64px)', letterSpacing: '0.1em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase' }}>BANKRUPT.</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(12px,1.3vw,16px)', color: '#8E877B', fontWeight: 300 }}>The Machine predicted this.</div>
      <button onClick={onRestart} style={{ marginTop: '12px', background: 'none', border: '1px solid rgba(210,90,90,0.4)', color: 'rgba(210,90,90,0.7)', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.8vw,10px)', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(210,90,90,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(210,90,90,0.95)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(210,90,90,0.7)'; }}
      >
        Restart?
      </button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MachinePage() {
  const { portfolio, buy, sell, reset, totalValue, isBankrupt, isMillionaire } = usePortfolio();
  const sound = useSound();
  const machineEngine = getMachineSoundEngine();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [showStartup, setShowStartup] = useState(true); // always show on every visit
  const [engineVolume, setEngineVolume] = useState(0.7);
  const [mounted, setMounted] = useState(false);
  const [showMillionaire, setShowMillionaire] = useState(false);
  const [milestoneShown, setMilestoneShown] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const holdingSymbols = Object.keys(portfolio.holdings);
  const { quotes, offline } = useMultipleQuotes(holdingSymbols, 60_000);
  const marketStatus = useMarketStatus(120_000);
  // Portfolio daily % for health scoring
  const portfolioDailyPct = holdingSymbols.length > 0
    ? Object.values(portfolio.holdings).reduce((sum, h) => {
        const q = quotes[h.symbol];
        return sum + (q ? (h.shares * q.change) / (h.shares * h.avgCost) * 100 : 0);
      }, 0) / holdingSymbols.length
    : 0;

  // Watchlist symbols from Observation Deck default
  const watchlistSymbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY', 'QQQ'];
  const healthData = useMarketHealth(60_000, {
    watchlistSymbols,
    watchlistQuotes: quotes as Record<string, { changePercent: number }>,
    portfolioDailyPct,
  });

  const quotePrices: Record<string, number> = {};
  Object.entries(quotes).forEach(([sym, q]) => { quotePrices[sym] = q.price; });
  const total = totalValue(quotePrices);
  const bankrupt = isBankrupt(quotePrices);
  const portfolioGain = total - 100_000;
  const todayGain = Object.values(portfolio.holdings).reduce((sum, h) => {
    const q = quotes[h.symbol];
    return sum + (q ? h.shares * q.change : 0);
  }, 0);

  // Sync machine sound engine with health score
  useEffect(() => {
    const state = scoreToState(healthData.score);
    machineEngine.setMarketState(state);
  }, [healthData.score]);

  // Sync mute state between old sound hook and machine engine
  useEffect(() => {
    if (sound.muted) machineEngine.mute();
    else machineEngine.unmute();
  }, [sound.muted]);

  // Sync volume
  const handleVolumeChange = (v: number) => {
    setEngineVolume(v);
    machineEngine.setVolume(v);
  };

  useEffect(() => {
    if (isMillionaire(quotePrices) && !milestoneShown) { setShowMillionaire(true); setMilestoneShown(true); sound.milestone(); }
  }, [total]);

  // Machine state from health score
  const machineState: MachineState = healthData.score >= 55 ? 'healthy' : healthData.score >= 30 ? 'weak' : 'panic';

  return (
    <>
      <style>{`
        @keyframes mxFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes mxSectionIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes mxDotPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        * { box-sizing:border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        .mx-btn { transition: background 0.18s, border-color 0.18s, transform 0.1s, box-shadow 0.18s !important; }
        .mx-btn:hover { box-shadow: 0 0 0 1px rgba(255,168,74,0.3) !important; }
        .mx-btn:active { transform: scale(0.97) !important; }
        .mx-stock-row { transition: background 0.15s, transform 0.15s !important; }
        .mx-stock-row:hover { transform: translateY(-1px) !important; background: rgba(244,241,234,0.03) !important; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,168,74,0.85);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(255,168,74,0.4);
        }
        input[type=range]::-moz-range-thumb {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,168,74,0.85);
          cursor: pointer;
          border: none;
        }
      `}</style>

      {showStartup && <MachineSync onComplete={() => setShowStartup(false)} />}
      {bankrupt && <BankruptScreen onRestart={() => { sound.error(); reset(); setActiveSymbol(null); }} />}

      <div style={{ minHeight: '100vh', background: '#000', color: '#F4F1EA', fontFamily: "'DM Mono', monospace", overflowX: 'hidden', paddingBottom: '48px', opacity: mounted && !showStartup ? 1 : 0, transition: 'opacity 0.4s ease' }}>

        {/* Nav spacer + gap so ticker doesn't touch the nav */}
        <div style={{ height: 'clamp(44px,6vh,56px)' }} />
        <div style={{ height: '12px' }} />

        {/* Live ticker */}
        <StockTicker />

        {/* ── Global Header — centered ── */}
        <div style={{ padding: 'clamp(24px,4vh,48px) clamp(20px,4vw,48px) 0', animation: 'mxSectionIn 0.4s ease both', position: 'relative' }}>
          {/* Status + controls — top right */}
          <div style={{ position: 'absolute', top: 'clamp(16px,2.5vh,28px)', right: 'clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <StatusLabel status={marketStatus} />
            {/* Volume slider — only visible when sound is engaged */}
            {!sound.muted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E877B" strokeWidth="1.8" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={engineVolume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  style={{
                    width: 'clamp(48px,5vw,72px)',
                    height: '2px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: `linear-gradient(to right, rgba(255,168,74,0.7) ${engineVolume * 100}%, rgba(244,241,234,0.15) ${engineVolume * 100}%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    borderRadius: '1px',
                  }}
                />
              </div>
            )}
            <MuteBtn muted={sound.muted} onToggle={sound.toggleMute} />
          </div>

          {/* Centered title + search */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,3vh,36px)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.28em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '8px' }}>
              hella.rich / Paper Trading
            </div>
            <div style={{ margin: '0 0 clamp(20px,3vh,36px)' }}>
              <SplitFlapText />
            </div>
            {/* Centered search */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <SearchBar onSelect={sym => { sound.click(); setActiveSymbol(sym); }} sound={sound} centered={true} />
            </div>
          </div>
        </div>

        {/* ── Main Dashboard Grid ── */}
        <style>{`
          .machine-grid {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-areas: "hero" "data" "sidebar";
            gap: clamp(16px,2vw,28px);
            padding: clamp(16px,2.5vh,28px) clamp(20px,4vw,48px) 0;
          }
          @media (min-width: 960px) {
            .machine-grid {
              grid-template-columns: auto 1fr 260px;
              grid-template-areas: "hero data sidebar";
              align-items: start;
            }
          }
        `}</style>

        <div className="machine-grid" style={{ animation: 'mxSectionIn 0.5s ease 0.1s both' }}>

          {/* ── HERO: The Machine ── */}
          <div style={{ gridArea: 'hero', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <TheMachine state={machineState} score={healthData.score} size={280} holdingSymbols={holdingSymbols} />
            {/* State label */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '3px' }}>
                The Machine
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.18em', color: machineState === 'panic' ? 'rgba(210,90,90,0.9)' : machineState === 'weak' ? '#B8A070' : '#FFA84A', textTransform: 'uppercase', fontWeight: 600 }}>
                {healthData.state.status}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,8px)', letterSpacing: '0.12em', color: '#8E877B', textTransform: 'uppercase', marginTop: '3px', maxWidth: '200px' }}>
                {healthData.state.message}
              </div>
            </div>
          </div>

          {/* ── DATA COLUMN ── */}
          <div style={{ gridArea: 'data', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,2vh,24px)' }}>

            {/* Position summary — one horizontal row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1px',
              background: 'rgba(244,241,234,0.06)',
              border: '1px solid rgba(244,241,234,0.12)',
            }}>
              {[
                { label: 'Cash', value: formatCurrency(portfolio.cash) },
                { label: 'Portfolio', value: formatCurrency(total) },
                { label: "Today's P/L", value: formatCurrency(todayGain), colored: true, val: todayGain },
                { label: 'Overall Return', value: formatPercent(portfolioGain / 100_000 * 100), colored: true, val: portfolioGain },
              ].map(item => (
                <div key={item.label} style={{ background: '#000', padding: 'clamp(12px,1.5vw,18px)' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 'clamp(14px,1.6vw,20px)',
                    letterSpacing: '-0.01em',
                    color: item.colored
                      ? (item.val ?? 0) >= 0 ? 'rgba(110,200,130,0.9)' : 'rgba(210,90,90,0.9)'
                      : '#F4F1EA',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Heartbeat pulse */}
            <MarketPulse height={56} />

            {/* Stock detail view */}
            {activeSymbol ? (
              <div style={{ borderTop: '1px solid rgba(244,241,234,0.08)', paddingTop: 'clamp(16px,2vh,24px)' }}>
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
            ) : null}

            {/* Exposure (portfolio table) */}
            <div style={{ borderTop: '1px solid rgba(244,241,234,0.06)', paddingTop: 'clamp(16px,2vh,24px)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.28em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '14px' }}>
                Exposure
              </div>
              <PortfolioPanel
                cash={portfolio.cash}
                holdings={portfolio.holdings}
                quotes={quotes}
                onSelectStock={sym => { sound.click(); setActiveSymbol(sym); }}
                totalValue={total}
              />
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ gridArea: 'sidebar', display: 'flex', flexDirection: 'column', gap: 'clamp(16px,2vh,24px)' }}>
            <Watchlist onSelect={sym => { sound.click(); setActiveSymbol(sym); }} activeSymbol={activeSymbol} />
          </div>

        </div>

        {/* Footer */}
        <footer style={{ padding: 'clamp(16px,2.5vh,28px) clamp(20px,4vw,48px) 48px', borderTop: '1px solid rgba(244,241,234,0.06)', marginTop: 'clamp(24px,3vh,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)', letterSpacing: '0.15em', color: '#8E877B', textTransform: 'uppercase' }}>
            Prices delayed. Paper trading only.
          </div>
          <GitHubStars />
        </footer>
      </div>

      {/* Terminal status bar */}
      <TerminalBar holdingSymbols={holdingSymbols} portfolioGain={portfolioGain} healthScore={healthData.score} />
    </>
  );
}
