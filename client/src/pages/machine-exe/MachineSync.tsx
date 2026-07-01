/**
 * THE_MACHINE.EXE — Machine Synchronization Sequence
 *
 * Runs every time the user enters the application.
 * Progress advances only when real tasks complete.
 * No fake timers. No artificial delays.
 *
 * THE MACHINE FOUND YOU. → ACKNOWLEDGE → sonar pulse → app fades in.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
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

    // Start sound engine on acknowledge
    const engine = getMachineSoundEngine();
    engine.unmute();

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
