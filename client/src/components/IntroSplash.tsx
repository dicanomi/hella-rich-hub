/**
 * IntroSplash — hella.rich terminal boot sequence
 *
 * Design: strange terminal overlay, green system type, animated code fragments
 * Copy: "WE'VE BEEN WAITING FOR YOU"
 * Duration: ~3s total
 * Session logic: plays once per browser session only
 * Accessibility: respects prefers-reduced-motion
 */

import { useEffect, useRef, useState } from 'react';

const TEXT = "WE'VE BEEN WAITING FOR YOU";
const SESSION_KEY = 'hellaIntroSeen';

const CHAR_DELAY = 52;
const HOLD_AFTER = 600;
const FADE_DURATION = 220;

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

interface IntroSplashProps {
  onComplete: () => void;
}

// Pick N random fragments from the list
function pickFragments(n: number): string[] {
  const shuffled = [...CODE_FRAGMENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [codeLines, setCodeLines] = useState<string[]>(() => pickFragments(6));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const codeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Animate code fragments — randomly swap lines
    codeIntervalRef.current = setInterval(() => {
      setCodeLines(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const pool = CODE_FRAGMENTS.filter(f => !next.includes(f));
        if (pool.length > 0) {
          next[idx] = pool[Math.floor(Math.random() * pool.length)];
        }
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
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#050805',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'clamp(32px, 6vw, 80px)',
          opacity: exiting ? 0 : 1,
          transition: `opacity ${FADE_DURATION}ms ease`,
          animation: 'termFlicker 4s linear',
          overflow: 'hidden',
        }}
      >
        {/* Scanline sweep */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(to bottom, transparent, rgba(0,255,70,0.06), transparent)',
          animation: 'termScanline 2.8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* CRT grain overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />

        {/* System label top-left */}
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

        {/* Animated code fragments — left column */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: 'clamp(20px, 5vw, 80px)',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}>
          {codeLines.map((line, i) => (
            <div
              key={`${line}-${i}`}
              style={{
                fontFamily: "'DM Mono', 'Space Mono', monospace",
                fontSize: 'clamp(7px, 0.75vw, 9px)',
                letterSpacing: '0.14em',
                color: 'rgba(0,255,70,0.22)',
                textTransform: 'uppercase',
                animation: 'termLineFade 0.35s ease both',
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Main message */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Prompt prefix */}
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

        {/* Bottom status bar */}
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

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== 'true';
  } catch {
    // Storage blocked (iOS Private Browsing / "Block All Cookies"). Show the
    // intro; we just can't persist that it was seen.
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    // Storage blocked (iOS Private Browsing / "Block All Cookies"). Ignore so
    // the caller can still dismiss the splash. Without this, the thrown error
    // aborts the dismiss and the boot screen stays on screen forever.
  }
}
