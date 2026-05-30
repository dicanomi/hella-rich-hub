/**
 * IntroSplash — hella.rich analog boot sequence
 *
 * Source: dicanomi/hella-rich (deployed repo) — restored + upgraded
 *
 * Design: a strange machine turning on. A digital object waking up.
 * - Vertical scanning line (termScanline) — the original deployed behavior
 * - CRT flicker (termFlicker)
 * - Phosphor green terminal type
 * - Analog grain overlay
 * - Signal distortion / waveform noise
 *
 * localStorage behavior:
 * - First visit: full sequence (~3s) — typewriter + scan + fragments
 * - Returning visits: short scan only (~1.2s) — just the signal sweep
 *
 * Accessibility: respects prefers-reduced-motion
 */
import { useEffect, useRef, useState } from 'react';

const TEXT = "WE'VE BEEN WAITING FOR YOU";
const LS_KEY = 'hellaIntroVisited';   // localStorage — persists across sessions
const SESSION_KEY = 'hellaIntroSeen'; // sessionStorage — once per tab

const CHAR_DELAY = 52;
const HOLD_AFTER = 500;
const FADE_DURATION = 280;

const CODE_FRAGMENTS = [
  'ACCESS REQUEST ACCEPTED',
  'USER DETECTED',
  'SESSION OPEN',
  'CONTROL HANDSHAKE',
  'ROUTE / HOME',
  'SIGNAL LOCKED',
  'PRODUCT INDEX READY',
  'HELLA.RICH SYSTEM',
  'WAITING COMPLETE',
  'INIT DISPLAY',
  'MEMORY TRACE FOUND',
  'INTERACTION PRIMED',
  'HUMAN INPUT REQUIRED',
  'IDENTITY CONFIRMED',
  'LOADING SEQUENCE 0x4F',
  'ENV: PRODUCTION',
  'STATUS: NOMINAL',
  'BOOT SECTOR OK',
];

function pickFragments(n: number): string[] {
  return [...CODE_FRAGMENTS].sort(() => Math.random() - 0.5).slice(0, n);
}

function isFirstVisit(): boolean {
  try { return !localStorage.getItem(LS_KEY); } catch { return false; }
}

function markVisited(): void {
  try { localStorage.setItem(LS_KEY, '1'); } catch { /* noop */ }
}

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false;
  return sessionStorage.getItem(SESSION_KEY) !== 'true';
}

export function markIntroSeen(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

interface IntroSplashProps {
  onComplete: () => void;
}

// ── Short returning-visitor scan ────────────────────────────────────────────
function ShortScan({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Just show the scan sweep for ~1.2s then fade out
    const t1 = setTimeout(() => setExiting(true), 900);
    const t2 = setTimeout(onComplete, 900 + FADE_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes shortScan {
          0%   { transform: translateY(-4px); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0.6; }
        }
        @keyframes shortScanGlow {
          0%   { transform: translateY(-4px); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#030303',
          opacity: exiting ? 0 : 1,
          transition: `opacity ${FADE_DURATION}ms ease`,
          pointerEvents: exiting ? 'none' : 'all',
          overflow: 'hidden',
        }}
      >
        {/* Primary scan line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'rgba(0,255,70,0.55)',
          boxShadow: '0 0 8px 2px rgba(0,255,70,0.3)',
          animation: 'shortScan 0.9s cubic-bezier(0.25, 0, 0.55, 1) forwards',
          pointerEvents: 'none',
        }} />
        {/* Glow trail */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '40px',
          background: 'linear-gradient(to bottom, rgba(0,255,70,0.04) 0%, transparent 100%)',
          animation: 'shortScanGlow 0.9s cubic-bezier(0.25, 0, 0.55, 1) forwards',
          pointerEvents: 'none',
        }} />
        {/* hella.rich wordmark — briefly visible */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          letterSpacing: '0.3em',
          color: 'rgba(0,255,70,0.18)',
          textTransform: 'uppercase',
          opacity: exiting ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}>
          hella.rich
        </div>
      </div>
    </>
  );
}

// ── Full first-visit sequence ────────────────────────────────────────────────
export function IntroSplash({ onComplete }: IntroSplashProps) {
  const firstVisit = useRef(isFirstVisit());
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [codeLines, setCodeLines] = useState<string[]>(() => pickFragments(6));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const codeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mark visited on first render
  useEffect(() => { markVisited(); }, []);

  // Returning visitor — use short scan
  if (!firstVisit.current) {
    return <ShortScan onComplete={onComplete} />;
  }

  // First visit — full sequence rendered below
  return <FullIntro
    displayed={displayed}
    setDisplayed={setDisplayed}
    showCursor={showCursor}
    setShowCursor={setShowCursor}
    exiting={exiting}
    setExiting={setExiting}
    codeLines={codeLines}
    setCodeLines={setCodeLines}
    timerRef={timerRef}
    indexRef={indexRef}
    codeIntervalRef={codeIntervalRef}
    onComplete={onComplete}
  />;
}

// ── Full intro component (first visit only) ──────────────────────────────────
interface FullIntroProps {
  displayed: string;
  setDisplayed: (v: string) => void;
  showCursor: boolean;
  setShowCursor: (v: boolean) => void;
  exiting: boolean;
  setExiting: (v: boolean) => void;
  codeLines: string[];
  setCodeLines: (fn: (prev: string[]) => string[]) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  indexRef: React.MutableRefObject<number>;
  codeIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  onComplete: () => void;
}

function FullIntro({
  displayed, setDisplayed, showCursor, setShowCursor,
  exiting, setExiting, codeLines, setCodeLines,
  timerRef, indexRef, codeIntervalRef, onComplete,
}: FullIntroProps) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayed(TEXT);
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, FADE_DURATION);
      }, 700);
      return;
    }

    // Rotate code fragments
    codeIntervalRef.current = setInterval(() => {
      setCodeLines(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const pool = CODE_FRAGMENTS.filter(f => !next.includes(f));
        if (pool.length > 0) next[idx] = pool[Math.floor(Math.random() * pool.length)];
        return next;
      });
    }, 280);

    // Typewriter
    const type = () => {
      if (indexRef.current < TEXT.length) {
        indexRef.current++;
        setDisplayed(TEXT.slice(0, indexRef.current));
        timerRef.current = setTimeout(type, CHAR_DELAY + (Math.random() * 14 - 7));
      } else {
        if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
        timerRef.current = setTimeout(() => {
          setShowCursor(false);
          timerRef.current = setTimeout(() => {
            setExiting(true);
            setTimeout(onComplete, FADE_DURATION);
          }, HOLD_AFTER);
        }, 180);
      }
    };
    timerRef.current = setTimeout(type, 380);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
    };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes termCursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes termLineFade {
          0%   { opacity: 0; transform: translateX(-4px); }
          15%  { opacity: 1; transform: translateX(0); }
          85%  { opacity: 1; }
          100% { opacity: 0.55; }
        }
        @keyframes termScanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes termFlicker {
          0%, 100% { opacity: 1; }
          92%       { opacity: 1; }
          93%       { opacity: 0.85; }
          94%       { opacity: 1; }
          97%       { opacity: 0.9; }
          98%       { opacity: 1; }
        }
        @keyframes signalDistort {
          0%   { transform: scaleX(1) translateX(0); opacity: 0.6; }
          15%  { transform: scaleX(1.003) translateX(1px); opacity: 0.8; }
          30%  { transform: scaleX(0.998) translateX(-2px); opacity: 0.6; }
          45%  { transform: scaleX(1.002) translateX(1px); opacity: 0.7; }
          60%  { transform: scaleX(1) translateX(0); opacity: 0.5; }
          75%  { transform: scaleX(0.999) translateX(-1px); opacity: 0.65; }
          100% { transform: scaleX(1) translateX(0); opacity: 0.6; }
        }
        @keyframes waveformPulse {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.14; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#030303',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'clamp(32px, 6vw, 80px)',
          opacity: exiting ? 0 : 1,
          transition: `opacity ${FADE_DURATION}ms ease`,
          animation: 'termFlicker 4s linear',
          overflow: 'hidden',
          pointerEvents: exiting ? 'none' : 'all',
        }}
      >
        {/* ── Primary vertical scan line ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(to right, transparent 0%, rgba(0,255,70,0.5) 20%, rgba(0,255,70,0.8) 50%, rgba(0,255,70,0.5) 80%, transparent 100%)',
          boxShadow: '0 0 12px 3px rgba(0,255,70,0.25)',
          animation: 'termScanline 2.8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* ── Scan glow trail ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to bottom, rgba(0,255,70,0.04) 0%, transparent 100%)',
          animation: 'termScanline 2.8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* ── Signal distortion lines (horizontal noise) ── */}
        {[15, 38, 62, 81].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${pct}%`,
            left: 0, right: 0,
            height: '1px',
            background: `rgba(0,255,70,${0.03 + i * 0.01})`,
            animation: `signalDistort ${1.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* ── CRT grain overlay ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />

        {/* ── Waveform background ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,70,0.008) 3px, rgba(0,255,70,0.008) 4px)`,
          animation: 'waveformPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* ── System label top-left ── */}
        <div style={{
          position: 'absolute',
          top: 'clamp(16px, 3vh, 28px)',
          left: 'clamp(20px, 4vw, 48px)',
          fontFamily: "'DM Mono', 'Space Mono', monospace",
          fontSize: 'clamp(8px, 0.8vw, 10px)',
          letterSpacing: '0.2em',
          color: 'rgba(0,255,70,0.35)',
          textTransform: 'uppercase',
        }}>
          hella.rich / sys
        </div>

        {/* ── Animated code fragments — right column ── */}
        <div style={{
          position: 'absolute',
          top: '50%', right: 'clamp(20px, 5vw, 80px)',
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: '6px',
          alignItems: 'flex-end', pointerEvents: 'none',
        }}>
          {codeLines.map((line, i) => (
            <div key={`${line}-${i}`} style={{
              fontFamily: "'DM Mono', 'Space Mono', monospace",
              fontSize: 'clamp(7px, 0.75vw, 9px)',
              letterSpacing: '0.14em',
              color: 'rgba(0,255,70,0.22)',
              textTransform: 'uppercase',
              animation: 'termLineFade 0.35s ease both',
              whiteSpace: 'nowrap',
            }}>
              {line}
            </div>
          ))}
        </div>

        {/* ── Main message ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: "'DM Mono', 'Space Mono', monospace",
            fontSize: 'clamp(9px, 0.9vw, 11px)',
            letterSpacing: '0.18em',
            color: 'rgba(0,255,70,0.45)',
            marginBottom: 'clamp(8px, 1.5vh, 16px)',
            textTransform: 'uppercase',
          }}>
            {'>'} SYSTEM MESSAGE
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(24px, 4.5vw, 64px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'rgba(0,255,70,0.92)',
            lineHeight: 1.05,
            minHeight: '1.1em',
            display: 'flex',
            alignItems: 'center',
            textShadow: '0 0 40px rgba(0,255,70,0.25)',
          }}>
            {displayed}
            {showCursor && (
              <span style={{
                display: 'inline-block',
                width: 'clamp(2px, 0.25vw, 3px)',
                height: '0.85em',
                background: 'rgba(0,255,70,0.8)',
                marginLeft: '0.06em',
                verticalAlign: 'middle',
                animation: 'termCursorBlink 0.5s steps(1) infinite',
              }} />
            )}
          </div>
        </div>

        {/* ── Bottom status bar ── */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(16px, 3vh, 28px)',
          left: 'clamp(20px, 4vw, 48px)',
          right: 'clamp(20px, 4vw, 48px)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'DM Mono', 'Space Mono', monospace",
          fontSize: 'clamp(7px, 0.7vw, 9px)',
          letterSpacing: '0.16em',
          color: 'rgba(0,255,70,0.2)',
          textTransform: 'uppercase',
        }}>
          <span>STATUS: NOMINAL</span>
          <span>ENV: PRODUCTION</span>
        </div>
      </div>
    </>
  );
}
