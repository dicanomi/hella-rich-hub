/**
 * THE_MACHINE.EXE — Split-Flap Title Animation
 *
 * Each character cycles through a random sequence of characters before
 * landing on the final value — like a Solari departure board.
 *
 * Font: Share Tech Mono (Google Fonts) — monospace terminal aesthetic.
 * Loop: resolves → holds 3s → scrambles → resolves → repeat.
 */
import { useEffect, useState, useRef } from 'react';

// Characters to cycle through (terminal/financial feel)
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.:/-';

const TARGET = 'THE_MACHINE.EXE';

// Per-character timing: stagger so letters resolve left-to-right
const CHAR_STAGGER_MS = 55;   // delay between each char starting
const CHAR_CYCLES = 8;        // how many random chars each letter shows before settling
const CYCLE_INTERVAL_MS = 48; // ms between each random char flip
const HOLD_MS = 3200;         // pause after fully resolved
const SCRAMBLE_HOLD_MS = 200; // brief pause before re-scrambling

interface CharState {
  display: string;
  settled: boolean;
}

function randomChar(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

export function SplitFlapText() {
  const [chars, setChars] = useState<CharState[]>(
    TARGET.split('').map(c => ({ display: c === ' ' ? ' ' : randomChar(), settled: false }))
  );
  const phaseRef = useRef<'resolving' | 'holding' | 'scrambling'>('resolving');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const resolve = () => {
    phaseRef.current = 'resolving';
    const letters = TARGET.split('');

    letters.forEach((targetChar, charIdx) => {
      if (targetChar === ' ') return;

      const startDelay = charIdx * CHAR_STAGGER_MS;

      // Cycle through random chars
      for (let cycle = 0; cycle < CHAR_CYCLES; cycle++) {
        const t = startDelay + cycle * CYCLE_INTERVAL_MS;
        addTimer(() => {
          setChars(prev => {
            const next = [...prev];
            next[charIdx] = { display: randomChar(), settled: false };
            return next;
          });
        }, t);
      }

      // Settle on the real character
      const settleTime = startDelay + CHAR_CYCLES * CYCLE_INTERVAL_MS;
      addTimer(() => {
        setChars(prev => {
          const next = [...prev];
          next[charIdx] = { display: targetChar, settled: true };
          return next;
        });
      }, settleTime);
    });

    // After all chars settled, hold then scramble
    const totalResolveTime = (letters.length - 1) * CHAR_STAGGER_MS + CHAR_CYCLES * CYCLE_INTERVAL_MS + 80;
    addTimer(() => {
      phaseRef.current = 'holding';
      addTimer(() => scramble(), HOLD_MS);
    }, totalResolveTime);
  };

  const scramble = () => {
    phaseRef.current = 'scrambling';
    const letters = TARGET.split('');

    // Scramble all chars quickly (right to left for variety)
    letters.forEach((targetChar, charIdx) => {
      if (targetChar === ' ') return;
      const delay = (letters.length - 1 - charIdx) * 30;
      addTimer(() => {
        setChars(prev => {
          const next = [...prev];
          next[charIdx] = { display: randomChar(), settled: false };
          return next;
        });
      }, delay);
    });

    // Brief scramble hold then resolve again
    addTimer(() => resolve(), SCRAMBLE_HOLD_MS + letters.length * 30);
  };

  useEffect(() => {
    // Small initial delay so the page loads first
    addTimer(() => resolve(), 400);
    return () => clearTimers();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        .sft-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0;
          font-family: 'Share Tech Mono', 'DM Mono', 'Courier New', monospace;
          font-size: clamp(22px, 3.5vw, 52px);
          line-height: 1;
          letter-spacing: 0.04em;
          user-select: none;
        }

        .sft-char {
          display: inline-block;
          position: relative;
          color: #F4F1EA;
          transition: color 0.05s ease;
        }

        .sft-char.settled {
          color: #F4F1EA;
        }

        .sft-char:not(.settled) {
          color: rgba(255, 168, 74, 0.75);
          text-shadow: 0 0 8px rgba(255, 168, 74, 0.4);
        }

        /* Subtle flicker on unsettled chars */
        @keyframes sftFlicker {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.85; }
        }
        .sft-char:not(.settled) {
          animation: sftFlicker 0.06s steps(1) infinite;
        }

        /* Thin separator line under each char — like the flap hinge */
        .sft-char::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          top: 50%;
          height: 1px;
          background: rgba(0, 0, 0, 0.35);
          pointer-events: none;
        }
      `}</style>

      <div className="sft-wrap" aria-label={TARGET}>
        {chars.map((c, i) => (
          <span
            key={i}
            className={`sft-char${c.settled ? ' settled' : ''}`}
            aria-hidden="true"
          >
            {c.display}
          </span>
        ))}
      </div>
    </>
  );
}
