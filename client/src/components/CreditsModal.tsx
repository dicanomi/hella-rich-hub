/**
 * CreditsModal — hella.rich cinematic end credits
 *
 * Design: film end credits × album liner notes × old software easter egg
 * All uppercase. CSS keyframe upward scroll — starts immediately, no timing bugs.
 * Click anywhere / X icon closes. No ESC hint. No personal names.
 */
import { useEffect, useRef, useState } from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

// Total animation duration in seconds — adjust to taste
// At ~80 lines of content, 90s gives a cinematic pace
const SCROLL_DURATION = 90;

const CREDITS_LINES = [
  { type: 'spacer' },
  { type: 'title',      text: 'HELLA.RICH' },
  { type: 'subtitle',   text: 'SMALL INTERNET THINGS' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'CREATED BY' },
  { type: 'name',       text: 'DICANOMI' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'BUILT WITH' },
  { type: 'item',       text: 'ARTIFICIAL INTELLIGENCE' },
  { type: 'item',       text: 'QUESTIONABLE DECISIONS' },
  { type: 'item',       text: 'LATE NIGHT CURIOSITY' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'EXPERIMENTS IN' },
  { type: 'item',       text: 'INTERACTION' },
  { type: 'item',       text: 'SOUND' },
  { type: 'item',       text: 'MOTION' },
  { type: 'item',       text: 'EMOTION' },
  { type: 'item',       text: 'BEAUTIFULLY UNNECESSARY TECHNOLOGY' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'TOOLS' },
  { type: 'item',       text: 'MANUS' },
  { type: 'item',       text: 'CHATGPT' },
  { type: 'item',       text: 'REACT' },
  { type: 'item',       text: 'COFFEE' },
  { type: 'item',       text: 'MISTAKES' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'PRODUCTS' },
  { type: 'product',    text: 'ORB' },
  { type: 'product',    text: 'THE EYE' },
  { type: 'product',    text: 'LOW BATTERY' },
  { type: 'product',    text: 'SPACE DRONE' },
  { type: 'product',    text: 'ÆTHER' },
  { type: 'product',    text: 'DEAD AIR' },
  { type: 'product',    text: 'FOURCAST' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label',      text: 'PHILOSOPHY' },
  { type: 'philosophy', text: 'NO DECKS.' },
  { type: 'philosophy', text: 'NO HYPOTHETICALS.' },
  { type: 'philosophy', text: 'JUST THINGS THAT EXIST.' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'copyright',  text: `© ${new Date().getFullYear()} DICANOMI` },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'spacer' },
];

export function CreditsModal({ onClose }: CreditsModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const animRef = useRef<HTMLDivElement>(null);

  // Fade in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ESC closes (silent — no hint shown)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 400);
  };

  const renderLine = (item: typeof CREDITS_LINES[0], i: number) => {
    const key = `${item.type}-${i}`;
    switch (item.type) {
      case 'spacer':
        return <div key={key} style={{ height: 'clamp(28px, 5vh, 48px)' }} />;
      case 'title':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(12px, 1.3vw, 16px)',
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            color: 'rgba(255,255,255,0.88)',
            textAlign: 'center',
            marginBottom: '10px',
          }}>{item.text}</div>
        );
      case 'subtitle':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px, 0.8vw, 10px)',
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            color: 'rgba(255,255,255,0.22)',
            textAlign: 'center',
          }}>{item.text}</div>
        );
      case 'label':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.72vw, 9px)',
            letterSpacing: '0.32em',
            paddingLeft: '0.32em',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'center',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
          }}>{item.text}</div>
        );
      case 'name':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(16px, 2.2vw, 28px)',
            letterSpacing: '0.28em',
            paddingLeft: '0.28em',
            color: 'rgba(255,255,255,0.82)',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 10px)',
          }}>{item.text}</div>
        );
      case 'item':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(11px, 1.1vw, 14px)',
            fontWeight: 400,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.42)',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.2vh, 14px)',
            textTransform: 'uppercase',
          }}>{item.text}</div>
        );
      case 'product':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(9px, 0.9vw, 11px)',
            letterSpacing: '0.24em',
            paddingLeft: '0.24em',
            color: 'rgba(255,255,255,0.32)',
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
          }}>{item.text}</div>
        );
      case 'philosophy':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(12px, 1.2vw, 15px)',
            fontWeight: 400,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.2vh, 14px)',
            textTransform: 'uppercase',
          }}>{item.text}</div>
        );
      case 'copyright':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.7vw, 8px)',
            letterSpacing: '0.2em',
            paddingLeft: '0.2em',
            color: 'rgba(255,255,255,0.12)',
            textAlign: 'center',
          }}>{item.text}</div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: '#030303',
        overflow: 'hidden',
        opacity: visible && !closing ? 1 : 0,
        transition: 'opacity 0.5s ease',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes creditsScroll {
          0%   { transform: translateY(100vh); }
          100% { transform: translateY(-100%); }
        }
        .credits-track {
          animation: creditsScroll ${SCROLL_DURATION}s linear forwards;
          animation-play-state: running;
          will-change: transform;
        }
        .credits-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Fade top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 'clamp(80px, 15vh, 140px)',
        background: 'linear-gradient(to bottom, #030303 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 'clamp(80px, 15vh, 140px)',
        background: 'linear-gradient(to top, #030303 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Close icon — fixed top-right, always visible */}
      <button
        onClick={e => { e.stopPropagation(); handleClose(); }}
        aria-label="Close credits"
        style={{
          position: 'fixed',
          top: 'clamp(20px, 3.5vh, 32px)',
          right: 'clamp(20px, 3.5vw, 36px)',
          zIndex: 30,
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.28)',
          transition: 'color 0.25s ease',
          lineHeight: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="2" y1="2" x2="14" y2="14" />
          <line x1="14" y1="2" x2="2" y2="14" />
        </svg>
      </button>

      {/* Credits track — CSS keyframe upward scroll, starts immediately */}
      <div
        ref={animRef}
        className="credits-track"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: 0, right: 0,
          cursor: 'default',
        }}
      >
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '0 clamp(24px, 5vw, 48px)',
        }}>
          {CREDITS_LINES.map((item, i) => renderLine(item, i))}
        </div>
      </div>
    </div>
  );
}
