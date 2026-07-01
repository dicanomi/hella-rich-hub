/**
 * THE_MACHINE.EXE — Startup Synchronization Sequence
 * Plays once on first launch, skippable, remembers via localStorage.
 */
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'machine_exe_synced_v1';

export function shouldShowStartup(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== 'true'; } catch { return false; }
}
export function markStartupSeen(): void {
  try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
}
export function resetStartup(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const LINES = [
  { text: 'INITIALIZING...', delay: 0 },
  { text: 'SYNCHRONIZING WITH THE MACHINE...', delay: 600 },
  { text: 'READING GLOBAL MARKETS...', delay: 1300 },
  { text: 'MEASURING HUMAN SENTIMENT...', delay: 2000 },
  { text: 'ASSESSING YOUR EXPOSURE...', delay: 2700 },
  { text: 'THE MACHINE IS AWAKE.', delay: 3400 },
];

interface MachineStartupProps {
  onComplete: () => void;
}

export function MachineStartup({ onComplete }: MachineStartupProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showEnter, setShowEnter] = useState(false);
  const [exiting, setExiting] = useState(false);

  const complete = useCallback(() => {
    setExiting(true);
    setTimeout(() => { markStartupSeen(); onComplete(); }, 600);
  }, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay));
    });
    timers.push(setTimeout(() => setShowEnter(true), 4200));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') complete();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, [complete]);

  return (
    <div
      onClick={showEnter ? complete : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: 'clamp(40px,8vw,120px)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.6s ease',
        cursor: showEnter ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
        {LINES.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(10px,1.1vw,13px)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: i === LINES.length - 1 ? '#FFA84A' : '#B8B2A7',
              opacity: visibleLines.includes(i) ? 1 : 0,
              transform: visibleLines.includes(i) ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              fontWeight: i === LINES.length - 1 ? 600 : 400,
            }}
          >
            {line.text}
          </div>
        ))}

        {showEnter && (
          <div
            style={{
              marginTop: '28px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(9px,0.9vw,11px)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#F4F1EA',
              opacity: showEnter ? 1 : 0,
              transition: 'opacity 0.5s ease',
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'pointer',
            }}
            onClick={complete}
          >
            <span style={{ color: '#FFA84A' }}>→</span>
            ENTER
            <span style={{ color: '#8E877B', fontSize: 'clamp(7px,0.7vw,9px)' }}>PRESS ENTER OR CLICK</span>
          </div>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={complete}
        style={{
          position: 'absolute', bottom: '28px', right: '28px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(7px,0.7vw,9px)',
          letterSpacing: '0.18em',
          color: '#8E877B',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
          padding: '8px',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#B8B2A7')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
      >
        Skip
      </button>
    </div>
  );
}
