/**
 * HeaderTicker — rotating system messages in the header
 * Design: Cinematic Product Lab
 */
import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'AI-native product experiments.',
  'Designed, directed, and shipped in days.',
  'Interaction. Emotion. Sound.',
  'No decks. No hypotheticals.',
  'Just working things.',
  'Behavior. Delight.',
  'One person. Days.',
];

export function HeaderTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(9px, 0.9vw, 11px)',
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {MESSAGES[index]}
    </span>
  );
}
