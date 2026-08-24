/**
 * THE_MACHINE.EXE — Market Health
 *
 * Score 0-100 from real market inputs:
 *   30% Major Index Performance (SPY/QQQ/DIA/IWM average)
 *   25% VIX (via VIXY proxy)
 *   20% Observation Deck Breadth (% positive)
 *   15% Portfolio Daily Performance
 *   10% Market Momentum (index agreement)
 *
 * Score always reflects actual conditions.
 * Bull market → 70-95. Mixed → 40-65. Selloff → 10-35.
 */
import { useEffect, useState } from 'react';
import { fetchQuote } from './useStockData';

// ── Scoring helpers ──────────────────────────────────────────────────────────
// Smooth sigmoid: -3% → ~0.1, 0% → 0.5, +3% → ~0.9
function pctToScore(pct: number): number {
  return (Math.tanh(pct / 1.5) + 1) / 2;
}

function vixToScore(vix: number): number {
  // VIXY price: <14 = calm, 14-18 = normal, 18-24 = elevated, 24-30 = fear, >30 = panic
  if (vix < 14)  return 1.0;
  if (vix < 18)  return 0.78;
  if (vix < 22)  return 0.55;
  if (vix < 26)  return 0.35;
  if (vix < 32)  return 0.18;
  return 0.05;
}

interface ScoreInputs {
  spyPct: number;
  qqqPct: number;
  diaPct: number;
  iwmPct: number;
  vix: number | null;
  deckBreadth: number;   // 0-1: fraction of watchlist positive
  portfolioPct: number;  // user portfolio daily %
  hasBreadth: boolean;
  hasPortfolio: boolean;
}

function computeScore(inp: ScoreInputs): { score: number; partial: boolean } {
  const { spyPct, qqqPct, diaPct, iwmPct, vix, deckBreadth, portfolioPct, hasBreadth, hasPortfolio } = inp;
  const indexAvg = (spyPct + qqqPct + diaPct + iwmPct) / 4;

  // 30% — Index performance
  const indexScore = pctToScore(indexAvg) * 30;

  // 25% — VIX (or fallback to index proxy)
  const vixScore = vix !== null ? vixToScore(vix) * 25 : pctToScore(indexAvg) * 25;
  const partial = vix === null;

  // 20% — Observation deck breadth
  const breadthScore = hasBreadth ? deckBreadth * 20 : pctToScore(indexAvg) * 20;

  // 15% — Portfolio daily performance
  const portfolioScore = hasPortfolio ? pctToScore(portfolioPct) * 15 : pctToScore(indexAvg) * 15;

  // 10% — Momentum: do indexes agree on direction?
  const bullish = [spyPct, qqqPct, diaPct, iwmPct].filter(p => p > 0).length;
  const momentumScore = (bullish / 4) * 10;

  const raw = indexScore + vixScore + breadthScore + portfolioScore + momentumScore;
  return { score: Math.round(Math.max(0, Math.min(100, raw))), partial };
}

// ── Health states ────────────────────────────────────────────────────────────
interface HealthState {
  status: string;
  message: string;
  color: string;
  glowColor: string;
  pulseMs: number;
}

function getHealthState(score: number): HealthState {
  if (score >= 85) return { status: 'EUPHORIA', message: 'EVERYONE THINKS THEY ARE A GENIUS.', color: 'rgba(110,200,130,0.85)', glowColor: 'rgba(110,200,130,0.2)', pulseMs: 3200 };
  if (score >= 70) return { status: 'HEALTHY',  message: 'THE MACHINE IS HUMMING.',            color: 'rgba(110,200,130,0.7)',  glowColor: 'rgba(110,200,130,0.15)', pulseMs: 2600 };
  if (score >= 55) return { status: 'FUNCTIONAL', message: 'WALL STREET IS PRETENDING THIS IS NORMAL.', color: 'rgba(180,200,110,0.75)', glowColor: 'rgba(180,200,110,0.15)', pulseMs: 2200 };
  if (score >= 40) return { status: 'MIXED',    message: 'THE MARKET HAS TRUST ISSUES.',       color: 'rgba(255,138,0,0.75)',   glowColor: 'rgba(255,138,0,0.15)',    pulseMs: 1800 };
  if (score >= 25) return { status: 'UNHEALTHY', message: 'PORTFOLIOS ARE MAKING PHONE CALLS.', color: 'rgba(210,130,80,0.8)',  glowColor: 'rgba(210,130,80,0.18)',   pulseMs: 1200 };
  return { status: 'PANIC', message: 'THE CHART HAS CHOSEN VIOLENCE.', color: 'rgba(210,70,70,0.85)', glowColor: 'rgba(210,70,70,0.2)', pulseMs: 700 };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export interface MarketHealthData {
  score: number;
  partial: boolean;
  offline: boolean;
  state: HealthState;
  spyPct: number;
  vix: number | null;
  lastUpdated: number;
}

interface MarketHealthOptions {
  watchlistSymbols?: string[];
  watchlistQuotes?: Record<string, { changePercent: number }>;
  portfolioDailyPct?: number;
}

export function useMarketHealth(intervalMs = 60_000, opts: MarketHealthOptions = {}): MarketHealthData {
  const [data, setData] = useState<MarketHealthData>({
    score: 50, partial: true, offline: false,
    state: getHealthState(50),
    spyPct: 0, vix: null, lastUpdated: 0,
  });

  const { watchlistSymbols = [], watchlistQuotes = {}, portfolioDailyPct = 0 } = opts;

  const load = async () => {
    try {
      const spy = await fetchQuote('SPY');
      const qqq = await fetchQuote('QQQ');
      const dia = await fetchQuote('DIA');
      const iwm = await fetchQuote('IWM');

      let vix: number | null = null;
      try {
        const vixy = await fetchQuote('VIXY');
        if (vixy.price > 0) vix = vixy.price;
      } catch {}

      // Observation deck breadth
      const deckSymbols = watchlistSymbols.length > 0 ? watchlistSymbols : ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY', 'QQQ'];
      let positiveCount = 0;
      let totalCount = 0;
      for (const sym of deckSymbols) {
        const q = watchlistQuotes[sym];
        if (q) { totalCount++; if (q.changePercent > 0) positiveCount++; }
      }
      const deckBreadth = totalCount > 0 ? positiveCount / totalCount : 0.5;
      const hasBreadth = totalCount >= 2;

      const { score, partial } = computeScore({
        spyPct: spy.changePercent,
        qqqPct: qqq.changePercent,
        diaPct: dia.changePercent,
        iwmPct: iwm.changePercent,
        vix,
        deckBreadth,
        portfolioPct: portfolioDailyPct,
        hasBreadth,
        hasPortfolio: portfolioDailyPct !== 0,
      });

      setData({ score, partial, offline: false, state: getHealthState(score), spyPct: spy.changePercent, vix, lastUpdated: Date.now() });
    } catch {
      setData(prev => ({ ...prev, offline: true }));
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, Math.max(intervalMs, 60_000));
    return () => clearInterval(id);
  }, [intervalMs, watchlistSymbols.join(','), JSON.stringify(watchlistQuotes), portfolioDailyPct]);

  return data;
}

// ── Component ────────────────────────────────────────────────────────────────
interface MarketHealthProps { data: MarketHealthData; }

export function MarketHealthOrb({ data }: MarketHealthProps) {
  const { score, partial, offline, state } = data;
  const orbId = `mxOrb-${score}`;

  if (offline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: 'clamp(16px,2vw,24px)', border: '1px solid rgba(244,241,234,0.1)', background: 'rgba(244,241,234,0.015)', minWidth: '180px' }}>
        <div style={{ width: 'clamp(48px,6vw,72px)', height: 'clamp(48px,6vw,72px)', borderRadius: '50%', background: 'rgba(244,241,234,0.05)', border: '1px solid rgba(244,241,234,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#8E877B' }}>?</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.18em', color: '#8E877B', textTransform: 'uppercase', textAlign: 'center' }}>
          MARKET HEALTH DEGRADED<br /><span style={{ opacity: 0.6 }}>PARTIAL SIGNAL ONLY</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ${orbId}Pulse { 0%,100% { transform:scale(1); opacity:0.9; } 50% { transform:scale(1.06); opacity:1; } }
        @keyframes ${orbId}Ring  { 0% { transform:scale(1); opacity:0.4; } 100% { transform:scale(1.6); opacity:0; } }
        .${orbId}-orb  { animation: ${orbId}Pulse ${state.pulseMs}ms ease-in-out infinite; }
        .${orbId}-ring { animation: ${orbId}Ring ${state.pulseMs * 1.5}ms ease-out infinite; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: 'clamp(16px,2vw,24px)', border: '1px solid rgba(244,241,234,0.1)', background: 'rgba(244,241,234,0.015)', minWidth: '180px', position: 'relative' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.28em', color: '#8E877B', textTransform: 'uppercase' }}>Market Health</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={`${orbId}-ring`} style={{ position: 'absolute', width: 'clamp(52px,7vw,80px)', height: 'clamp(52px,7vw,80px)', borderRadius: '50%', border: `1px solid ${state.color}`, pointerEvents: 'none' }} />
          <div className={`${orbId}-orb`} style={{ width: 'clamp(52px,7vw,80px)', height: 'clamp(52px,7vw,80px)', borderRadius: '50%', background: `radial-gradient(circle at 38% 38%, ${state.color}, rgba(0,0,0,0.6))`, border: `1px solid ${state.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(14px,1.8vw,22px)', fontWeight: 600, color: '#F4F1EA', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{score}</span>
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.12em', color: '#8E877B', textTransform: 'uppercase' }}>{score} / 100</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.18em', color: state.color, textTransform: 'uppercase', fontWeight: 600 }}>{state.status}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,8px)', letterSpacing: '0.12em', color: '#8E877B', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.5, maxWidth: '160px' }}>{state.message}</div>
        {partial && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(6px,0.65vw,7px)', letterSpacing: '0.12em', color: 'rgba(244,241,234,0.2)', textTransform: 'uppercase' }}>PARTIAL SIGNAL</div>}
      </div>
    </>
  );
}
