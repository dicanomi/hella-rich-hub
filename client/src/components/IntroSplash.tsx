/**
 * IntroSplash — hella.rich terminal boot sequence
 * Design: Cinematic Product Lab
 * Plays once per browser session only.
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
  'SIGNAL LOCKED',
  'PRODUCT INDEX READY',
  'HELLA.RICH SYSTEM',
  'WAITING COMPLETE',
  'INIT DISPLAY',
  'MEMORY TRACE FOUND',
  'INTERACTION PRIMED',
  'HUMAN INPUT REQUIRED',
  'IDENTITY CONFIRMED',
  'ENV: PRODUCTION',
  'STATUS: NOMINAL',
  'BOOT SECTOR OK',
];

function pickFragments(n: number): string[] {
  return [...CODE_FRAGMENTS].sort(() => Math.random() - 0.5).slice(0, n);
}

export function shouldShowIntro(): boolean {
  try { return !sessionStorage.getItem(SESSION_KEY); } catch { return false; }
}

export function markIntroSeen(): void {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* noop */ }
}

interface IntroSplashProps { onComplete: () => void; }

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [codeLines, setCodeLines] = useState<string[]>(() => pickFragments(6));
  const [currentCodeLine, setCurrentCodeLine] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const codeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Rotate code fragments
    codeIntervalRef.current = setInterval(() => {
      setCurrentCodeLine(i => (i + 1) % codeLines.length);
    }, 280);

    // Type out main text
    const typeNext = () => {
      if (indexRef.current < TEXT.length) {
        indexRef.current++;
        setDisplayed(TEXT.slice(0, indexRef.current));
        timerRef.current = setTimeout(typeNext, CHAR_DELAY);
      } else {
        // Done typing — hold then exit
        timerRef.current = setTimeout(() => {
          setExiting(true);
          if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
          setTimeout(onComplete, FADE_DURATION + 80);
        }, HOLD_AFTER);
      }
    };
    timerRef.current = setTimeout(typeNext, 300);

    // Cursor blink
    const cursorInterval = setInterval(() => setShowCursor(v => !v), 530);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0908',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(32px, 8vw, 96px)',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease`,
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Code fragments */}
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px, 0.9vw, 11px)',
          letterSpacing: '0.18em',
          color: 'rgba(80,200,120,0.55)',
          textTransform: 'uppercase',
          marginBottom: 'clamp(24px, 4vh, 48px)',
          height: '1.4em',
          overflow: 'hidden',
        }}
      >
        {codeLines[currentCodeLine]}
      </div>

      {/* Main text */}
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(22px, 4vw, 52px)',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          maxWidth: '700px',
        }}
      >
        {displayed}
        <span
          style={{
            display: 'inline-block',
            width: '2px',
            height: '0.9em',
            background: 'rgba(255,255,255,0.7)',
            marginLeft: '3px',
            verticalAlign: 'middle',
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.1s',
          }}
        />
      </div>
    </div>
  );
}
