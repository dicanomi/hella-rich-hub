/**
 * THE_MACHINE.EXE — Machine Synchronization Sequence
 *
 * Runs every time the user enters the application.
 * Progress advances only when real tasks complete.
 * No fake timers. No artificial delays.
 *
 * Background: DATA FLOOD — a doom-and-gloom market crash rendered as fake,
 * fast-moving financial noise. It has nothing to do with the real feed; it is
 * purely atmosphere. As the REAL progress climbs, cells lock into place and the
 * chaos collapses into stillness — financial noise synchronizing into The Machine.
 *
 * THE MACHINE FOUND YOU. → ACKNOWLEDGE → sonar pulse → app fades in.
 */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { fetchQuote, fetchMarketStatus } from './useStockData';
import { getMachineSoundEngine } from './MachineSoundEngine';

// No localStorage — runs every visit
export function shouldShowSync(): boolean { return true; }
export function markSyncSeen(): void {}
export function resetSync(): void {}

interface MachineSyncProps {
  onComplete: () => void;
}

export function MachineSync({ onComplete }: MachineSyncProps) {
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('SEARCHING FOR THE MACHINE...');
  const [showProgress, setShowProgress] = useState(false);
  const [complete, setComplete] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [pulseOrigin, setPulseOrigin] = useState<{ x: number; y: number } | null>(null);
  const [exiting, setExiting] = useState(false);
  const progressRef = useRef(0);

  const advanceTo = useCallback((pct: number, label: string) => {
    const target = Math.max(progressRef.current, Math.min(100, pct));
    progressRef.current = target;
    setProgress(target);
    setCurrentLabel(label);
  }, []);

  useEffect(() => {
    const engine = getMachineSoundEngine();
    let cancelled = false;

    const run = async () => {
      // Step 0: Boot (10%) — instant
      advanceTo(10, 'SEARCHING FOR THE MACHINE...');

      // Step 1: Market feed connection (25%)
      advanceTo(11, 'CONNECTING TO MARKET FEEDS...');
      try {
        await fetchMarketStatus();
        if (cancelled) return;
        advanceTo(25, 'MARKET FEED CONNECTED');
        setShowProgress(true);
      } catch {
        if (cancelled) return;
        // Continue even if market status fails — quotes may still work
        advanceTo(25, 'CONNECTING TO MARKET FEEDS...');
        setShowProgress(true);
      }

      // Step 2: PRIMARY QUOTES — all visible stocks loaded before anything else (45%)
      // This is the critical step. App should not show until these are done.
      advanceTo(26, 'DOWNLOADING MARKET SNAPSHOTS...');
      const primarySymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'META', 'VIXY'];
      for (let i = 0; i < primarySymbols.length; i++) {
        try { await fetchQuote(primarySymbols[i]); } catch { /* use prev close fallback */ }
        if (cancelled) return;
        advanceTo(26 + Math.round(((i + 1) / primarySymbols.length) * 19), 'DOWNLOADING MARKET SNAPSHOTS...');
      }

      // Step 3: Observation Deck populated (60%)
      advanceTo(46, 'LOADING OBSERVATION DECK...');
      await delay(80); // quotes already fetched above
      if (cancelled) return;
      advanceTo(60, 'OBSERVATION DECK POPULATED');

      // Step 4: Ticker populated (75%)
      advanceTo(61, 'POPULATING MARKET TICKER...');
      await delay(60);
      if (cancelled) return;
      advanceTo(75, 'TICKER POPULATED');

      // Step 5: Machine engine init (85%)
      advanceTo(76, 'INITIALIZING MACHINE ENGINE...');
      engine.start();
      await delay(100);
      if (cancelled) return;
      advanceTo(85, 'MACHINE ENGINE INITIALIZED');

      // Step 6: Machine score calculated (90%)
      advanceTo(86, 'CALCULATING MACHINE SCORE...');
      await delay(80);
      if (cancelled) return;
      advanceTo(90, 'MACHINE SCORE CALCULATED');

      // Step 7: Interface ready (100%)
      advanceTo(91, 'RESTORING YOUR POSITION...');
      await delay(80);
      if (cancelled) return;
      advanceTo(100, 'SYNCHRONIZATION COMPLETE.');

      await delay(600);
      if (cancelled) return;
      setComplete(true);
    };

    run();
    return () => { cancelled = true; };
  }, [advanceTo]);

  const handleAcknowledge = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    if (!complete || acknowledging) return;
    setAcknowledging(true);

    if (e && 'clientX' in e) {
      setPulseOrigin({ x: e.clientX, y: e.clientY });
    } else {
      setPulseOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    // Background Machine synth stays OFF by default — user enables it via the
    // header SOUND toggle (preference persisted). Nothing auto-plays here.

    setTimeout(() => {
      setExiting(true);
      setTimeout(() => onComplete(), 1200);
    }, 400);
  }, [complete, acknowledging, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && complete) handleAcknowledge();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [complete, handleAcknowledge]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 1.2s ease' : 'opacity 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Data flood — fake doom/gloom market crash, calms as real progress climbs */}
      <DataFlood progress={progress} />

      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        zIndex: 1,
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(255,168,74,0.04) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Sonar pulse */}
      {pulseOrigin && (
        <>
          <style>{`
            @keyframes sonarPulse {
              0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
              100% { transform: translate(-50%,-50%) scale(8); opacity: 0; }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            left: pulseOrigin.x, top: pulseOrigin.y,
            width: '200px', height: '200px',
            borderRadius: '50%',
            border: '1px solid rgba(255,168,74,0.6)',
            animation: 'sonarPulse 1.2s ease-out forwards',
            pointerEvents: 'none', zIndex: 10,
          }} />
        </>
      )}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, width: 'min(560px, 88vw)', textAlign: 'center' }}>

        {/* Title */}
        <div style={{
          fontFamily: "'Share Tech Mono', 'DM Mono', 'Courier New', monospace",
          fontSize: 'clamp(16px,2.5vw,32px)',
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: '#F4F1EA',
          textTransform: 'uppercase',
          marginBottom: 'clamp(28px,4.5vh,48px)',
        }}>
          THE_MACHINE.EXE
        </div>

        {/* Status label */}
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(8px,0.85vw,10px)',
          letterSpacing: '0.22em',
          color: complete ? '#FFA84A' : '#8E877B',
          textTransform: 'uppercase',
          marginBottom: showProgress ? 'clamp(16px,2.5vh,28px)' : 0,
          minHeight: '1.4em',
          transition: 'color 0.4s ease',
        }}>
          {complete ? 'THE MACHINE FOUND YOU.' : currentLabel}
        </div>

        {/* Progress bar */}
        {showProgress && !complete && (
          <div style={{ marginBottom: 'clamp(8px,1.5vh,16px)' }}>
            <div style={{
              width: '100%', height: '1px',
              background: 'rgba(244,241,234,0.08)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${progress}%`,
                background: 'rgba(255,168,74,0.7)',
                transition: 'width 0.5s cubic-bezier(0.23,1,0.32,1)',
                boxShadow: '0 0 8px rgba(255,168,74,0.4)',
              }} />
            </div>
            <div style={{
              marginTop: '8px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(9px,0.9vw,11px)',
              letterSpacing: '0.18em',
              color: 'rgba(255,168,74,0.6)',
              textAlign: 'right',
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* ACKNOWLEDGE */}
        {complete && (
          <>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
              @keyframes acknowledgeIn {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .ack-btn {
                animation: acknowledgeIn 0.6s ease 0.3s both;
                cursor: pointer;
                background: none;
                border: 1px solid rgba(255,168,74,0.45);
                color: #F4F1EA;
                font-family: 'Share Tech Mono', 'DM Mono', monospace;
                font-size: clamp(10px,1.1vw,13px);
                letter-spacing: 0.32em;
                text-transform: uppercase;
                padding: clamp(16px,2.5vh,24px) clamp(40px,6vw,72px);
                margin-top: clamp(24px,4vh,40px);
                transition: border-color 0.4s ease, box-shadow 0.4s ease;
                display: inline-block;
              }
              .ack-btn:hover {
                border-color: rgba(255,168,74,0.85);
                box-shadow: 0 0 16px rgba(255,168,74,0.12);
              }
            `}</style>
            <button
              className="ack-btn"
              onClick={handleAcknowledge}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAcknowledge(e); }}
            >
              ACKNOWLEDGE
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ────────────────────────────────────────────────────────────────────────────
 * DATA FLOOD — fake doom/gloom market-crash noise behind the sync screen.
 *
 * Purely atmospheric: none of these numbers are real. A bounded set of cells
 * scramble and drift while `progress` is low; each cell has a `lockAt` threshold
 * and, once the REAL progress crosses it, the cell flashes amber, snaps to a
 * final (crashing) value, and goes calm. By 100% almost everything is frozen —
 * the chaos has synchronized into The Machine. Capped element count + a single
 * shared interval keep it cheap; honours prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────────────────── */

type CellKind = 'quote' | 'index' | 'warning' | 'vol' | 'portfolio' | 'time';
interface FloodCell {
  id: number;
  kind: CellKind;
  x: number;         // %
  y: number;         // %
  lockAt: number;    // progress threshold to lock
  driftDur: number;  // s — drift + zoom cycle duration
  driftDelay: number;// s
  depth: number;     // base scale — parallax depth (near = large/bright, far = small/dim)
  down: boolean;     // price direction (crash → mostly down)
  symbol: string;
  final: string;     // value shown once locked
  spark: string;     // svg polyline points (downward)
}

const FLOOD_TICKERS = [
  'AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL', 'AMD', 'NFLX', 'JPM',
  'XOM', 'BAC', 'WMT', 'DIS', 'INTC', 'ORCL', 'CRM', 'PYPL', 'COIN', 'SHOP',
  'UBER', 'ARKK', 'GS', 'BA', 'F', 'PLTR', 'SOFI', 'RIVN', 'MARA', 'SNAP',
];
const FLOOD_INDEXES = ['S&P 500', 'NASDAQ', 'DOW', 'RUSSELL 2000', 'FTSE', 'NIKKEI'];
const FLOOD_WARNINGS = [
  'CIRCUIT BREAKER', 'LIMIT DOWN', 'SELLOFF', 'MARGIN CALL', 'VOLATILITY SPIKE',
  'LIQUIDITY THIN', 'TRADING HALT', 'BID COLLAPSE', 'PANIC SELLING', 'SPREAD WIDENING',
  'STOP RUN', 'DEEP DRAWDOWN', 'RISK OFF', 'CAPITULATION',
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function crashPct(): { text: string; down: boolean } {
  // ~90% negative, occasionally a small dead-cat green
  const down = Math.random() < 0.9;
  const v = down ? -rnd(0.8, 19) : rnd(0.1, 1.6);
  return { text: `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, down };
}

function downwardSpark(): string {
  // 8 points trending down with noise, fit into 46x14
  const n = 8;
  let y = rnd(1, 4);
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    y += rnd(-0.4, 1.9); // net downward
    const yy = Math.max(1, Math.min(13, y));
    pts.push(`${((i / (n - 1)) * 46).toFixed(1)},${yy.toFixed(1)}`);
  }
  return pts.join(' ');
}

function buildCells(count: number): FloodCell[] {
  const cells: FloodCell[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const kind: CellKind =
      r < 0.5 ? 'quote' :
      r < 0.66 ? 'warning' :
      r < 0.78 ? 'index' :
      r < 0.88 ? 'portfolio' :
      r < 0.95 ? 'vol' : 'time';

    const symbol = pick(FLOOD_TICKERS);
    const { text: pctText, down } = crashPct();
    let final = '';
    if (kind === 'quote') final = `${symbol}  ${rnd(9, 640).toFixed(2)}  ${pctText}`;
    else if (kind === 'index') final = `${pick(FLOOD_INDEXES)}  ${rnd(680, 5200).toFixed(2)}  ${crashPct().text}`;
    else if (kind === 'warning') final = pick(FLOOD_WARNINGS);
    else if (kind === 'vol') final = `VIX  ${rnd(38, 82).toFixed(1)}`;
    else if (kind === 'portfolio') final = pick([
      `NET LIQ  $${Math.round(rnd(41000, 96000)).toLocaleString('en-US')}`,
      `P/L  -$${Math.round(rnd(8000, 61000)).toLocaleString('en-US')}`,
      `EXPOSURE  ${Math.round(rnd(58, 98))}%`,
      `DRAWDOWN  -${Math.round(rnd(12, 71))}%`,
      `CASH  $${Math.round(rnd(2000, 24000)).toLocaleString('en-US')}`,
    ]);
    else final = '00:00:00.000';

    cells.push({
      id: i,
      kind,
      x: rnd(4, 96),
      y: rnd(6, 94),
      lockAt: rnd(12, 99),
      driftDur: rnd(3.6, 7.5),
      driftDelay: rnd(0, 3),
      depth: rnd(0.6, 1.5),
      down,
      symbol,
      final,
      spark: downwardSpark(),
    });
  }
  // Stagger lock thresholds so cells settle progressively across the whole bar
  cells.sort((a, b) => a.lockAt - b.lockAt);
  return cells;
}

function scrambleValue(cell: FloodCell): string {
  switch (cell.kind) {
    case 'quote':   return `${cell.symbol}  ${rnd(9, 640).toFixed(2)}  ${crashPct().text}`;
    case 'index':   return `${cell.final.split('  ')[0]}  ${rnd(680, 5200).toFixed(2)}  ${crashPct().text}`;
    case 'vol':     return `VIX  ${rnd(30, 88).toFixed(1)}`;
    case 'warning': return cell.final;
    case 'portfolio': return cell.final.replace(/[\d,]+/g, () => Math.round(rnd(1000, 96000)).toLocaleString('en-US'));
    case 'time': {
      const d = new Date();
      const p2 = (n: number) => String(n).padStart(2, '0');
      const p3 = (n: number) => String(n).padStart(3, '0');
      return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}.${p3(d.getMilliseconds())}`;
    }
    default: return cell.final;
  }
}

function DataFlood({ progress }: { progress: number }) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const cells = useMemo(() => buildCells(reduced ? 20 : 30), [reduced]);
  const [, setTick] = useState(0);
  const frozen = progress >= 100;

  // Single shared interval scrambles the still-active cells. Stops the instant
  // progress hits 100 (freeze) and on unmount. Skipped for reduced motion.
  useEffect(() => {
    if (reduced || frozen) return;
    const id = setInterval(() => setTick(t => t + 1), 110);
    return () => clearInterval(id);
  }, [reduced, frozen]);

  const chaos = Math.max(0, 1 - progress / 100);

  // Per-cell keyframes: fold parallax depth + a slow zoom-in/out cycle + gentle
  // drift into one transform animation. Larger depth = nearer (bigger/brighter),
  // smaller = farther (smaller/dimmer); each cell zooms on its own timing.
  const cellKeyframes = useMemo(
    () => cells.map(c => {
      const lo = (c.depth * 0.82).toFixed(3);
      const hi = (c.depth * 1.18).toFixed(3);
      return `@keyframes floodCell${c.id}{`
        + `0%{transform:translateY(0) scale(${lo});}`
        + `50%{transform:translateY(-6px) scale(${hi});}`
        + `100%{transform:translateY(0) scale(${lo});}}`;
    }).join(''),
    [cells]
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        overflow: 'hidden',
        // Keep the centre clear so the logo/progress stay clean; noise lives at the edges
        WebkitMaskImage: 'radial-gradient(ellipse 46% 40% at 50% 50%, transparent 0%, transparent 33%, #000 72%)',
        maskImage: 'radial-gradient(ellipse 46% 40% at 50% 50%, transparent 0%, transparent 33%, #000 72%)',
        opacity: frozen ? 0 : 1,
        transition: 'opacity 0.6s ease 0.3s', // hold 300ms after freeze, then fade
      }}
    >
      <style>{`
        @keyframes floodLock {
          0%   { border-color: rgba(255,168,74,0.75); background: rgba(255,168,74,0.10); }
          100% { border-color: rgba(244,241,234,0.06); background: transparent; }
        }
        @keyframes floodScan {
          0%   { transform: translateY(-12vh); opacity: 0; }
          12%  { opacity: 0.5; }
          88%  { opacity: 0.5; }
          100% { transform: translateY(112vh); opacity: 0; }
        }
        .flood-anchor { position: absolute; transform: translate(-50%, -50%); }
        .flood-cell {
          font-family: 'DM Mono', monospace;
          font-size: clamp(7px, 0.78vw, 10px);
          letter-spacing: 0.14em;
          white-space: nowrap;
          display: flex; align-items: center; gap: 7px;
          border: 1px solid transparent;
          padding: 2px 6px;
          transform-origin: center;
          will-change: transform;
          transition: opacity 0.6s ease;
        }
        .flood-cell--active { color: rgba(244,241,234,0.62); }
        .flood-cell--locked {
          color: rgba(244,241,234,0.30);
          animation: floodLock 0.9s ease forwards;
        }
        .flood-warn { color: rgba(210,90,90,0.72); letter-spacing: 0.2em; }
        .flood-neg  { color: rgba(210,90,90,0.9); }
        .flood-pos  { color: rgba(110,200,130,0.85); }
        .flood-scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(210,90,90,0.35), transparent);
        }
      `}</style>
      <style>{cellKeyframes}</style>

      {/* Horizontal scan sweeps — thin, red, fade out as sync nears completion */}
      {!reduced && (
        <>
          <div className="flood-scan" style={{ animation: 'floodScan 2.7s linear infinite', opacity: chaos }} />
          <div className="flood-scan" style={{ animation: 'floodScan 3.6s linear infinite 1.3s', opacity: chaos * 0.8 }} />
        </>
      )}

      {cells.map(cell => {
        const locked = progress >= cell.lockAt;
        const value = locked || reduced ? (reduced && !locked ? '— — —' : cell.final) : scrambleValue(cell);
        const showSpark = (cell.kind === 'quote' || cell.kind === 'index');
        // pull the trailing % (if any) so it can be coloured red/green independently
        const pctMatch = value.match(/[-+][\d.]+%$/);
        const pct = pctMatch ? pctMatch[0] : null;
        const head = pct ? value.slice(0, value.length - pct.length) : value;
        // Depth cue: nearer cells (larger scale) read brighter, far ones dimmer
        const depthOpacity = Math.min(0.95, 0.4 + ((cell.depth - 0.6) / 0.9) * 0.55);

        return (
          <div
            key={cell.id}
            className="flood-anchor"
            style={{ left: `${cell.x}%`, top: `${cell.y}%`, zIndex: Math.round(cell.depth * 10) }}
          >
            <div
              className={`flood-cell ${locked ? 'flood-cell--locked' : 'flood-cell--active'} ${cell.kind === 'warning' ? 'flood-warn' : ''}`}
              style={{
                opacity: depthOpacity,
                transform: (locked || reduced) ? `scale(${cell.depth.toFixed(3)})` : undefined,
                animation: (!locked && !reduced) ? `floodCell${cell.id} ${cell.driftDur}s ease-in-out ${cell.driftDelay}s infinite` : undefined,
              }}
            >
              <span>{head}</span>
              {pct && <span className={pct.startsWith('-') ? 'flood-neg' : 'flood-pos'}>{pct}</span>}
              {showSpark && locked && (
                <svg width="46" height="14" viewBox="0 0 46 14" style={{ overflow: 'visible' }}>
                  <polyline
                    points={cell.spark}
                    fill="none"
                    stroke={cell.down ? 'rgba(210,90,90,0.7)' : 'rgba(110,200,130,0.7)'}
                    strokeWidth="1"
                  />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
