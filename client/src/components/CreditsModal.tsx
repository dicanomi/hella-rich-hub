/**
 * CreditsModal — hella.rich cinematic end credits
 *
 * Design: film end credits × album liner notes × old software easter egg
 * All uppercase. Slow upward scroll. Click anywhere to close.
 * Feels like hidden credits for the hella.rich universe.
 */
import { useEffect, useRef, useState } from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

const CREDITS = [
  // Opening — starts below viewport, scrolls up into view
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'title',      text: 'HELLA.RICH' },
  { type: 'subtitle',   text: 'SMALL INTERNET THINGS' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'CREATED BY' },
  { type: 'name',       text: 'DICANOMI' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'BUILT WITH' },
  { type: 'item',       text: 'ARTIFICIAL INTELLIGENCE' },
  { type: 'item',       text: 'QUESTIONABLE DECISIONS' },
  { type: 'item',       text: 'LATE NIGHT CURIOSITY' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'EXPERIMENTS IN' },
  { type: 'item',       text: 'INTERACTION' },
  { type: 'item',       text: 'SOUND' },
  { type: 'item',       text: 'MOTION' },
  { type: 'item',       text: 'EMOTION' },
  { type: 'item',       text: 'BEAUTIFULLY UNNECESSARY TECHNOLOGY' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'TOOLS' },
  { type: 'item',       text: 'MANUS' },
  { type: 'item',       text: 'CHATGPT' },
  { type: 'item',       text: 'REACT' },
  { type: 'item',       text: 'COFFEE' },
  { type: 'item',       text: 'MISTAKES' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'PRODUCTS' },
  { type: 'product',    text: 'ORB' },
  { type: 'product',    text: 'THE EYE' },
  { type: 'product',    text: 'LOW BATTERY' },
  { type: 'product',    text: 'SPACE DRONE' },
  { type: 'product',    text: 'ÆTHER' },
  { type: 'product',    text: 'DEAD AIR' },
  { type: 'product',    text: 'FOURCAST' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'label',      text: 'PHILOSOPHY' },
  { type: 'philosophy', text: 'NO DECKS.' },
  { type: 'philosophy', text: 'NO HYPOTHETICALS.' },
  { type: 'philosophy', text: 'JUST THINGS THAT EXIST.' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'copyright',  text: `© ${new Date().getFullYear()} DICANOMI` },
  // Trailing space so credits fully clear the screen
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
  { type: 'spacer-xl' },
];

export function CreditsModal({ onClose }: CreditsModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);       // current Y offset (positive = scrolled up)
  const rafRef = useRef<number>(0);
  const userScrolledRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // Fade in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Measure content height
  useEffect(() => {
    if (containerRef.current) {
      setContentHeight(containerRef.current.scrollHeight);
    }
  }, []);

  // Upward scroll animation — 0.5px per frame (~30px/s at 60fps)
  useEffect(() => {
    const SPEED = 0.5;
    const el = containerRef.current;
    if (!el) return;

    const loop = () => {
      if (!userScrolledRef.current) {
        posRef.current += SPEED;
        const maxScroll = el.scrollHeight - window.innerHeight;
        if (posRef.current >= maxScroll) {
          posRef.current = maxScroll;
          userScrolledRef.current = true; // stop at end
        }
        el.scrollTop = posRef.current;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Track manual scroll
    const onScroll = () => {
      userScrolledRef.current = true;
      posRef.current = el.scrollTop;
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('scroll', onScroll);
    };
  }, [contentHeight]);

  const renderLine = (item: typeof CREDITS[0], i: number) => {
    const key = `${item.type}-${i}`;
    const XL = 'clamp(32px, 6vh, 56px)';
    switch (item.type) {
      case 'spacer-xl':
        return <div key={key} style={{ height: XL }} />;
      case 'title':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(12px, 1.3vw, 16px)',
            letterSpacing: '0.42em',
            color: 'rgba(255,255,255,0.88)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '10px',
            paddingLeft: '0.42em', // compensate tracking
          }}>{item.text}</div>
        );
      case 'subtitle':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px, 0.8vw, 10px)',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.22)',
            textTransform: 'uppercase',
            textAlign: 'center',
            paddingLeft: '0.3em',
          }}>{item.text}</div>
        );
      case 'label':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.72vw, 9px)',
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.18)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
            paddingLeft: '0.32em',
          }}>{item.text}</div>
        );
      case 'name':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(16px, 2.2vw, 28px)',
            letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.82)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 10px)',
            paddingLeft: '0.28em',
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
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.2vh, 14px)',
          }}>{item.text}</div>
        );
      case 'product':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(9px, 0.9vw, 11px)',
            letterSpacing: '0.24em',
            color: 'rgba(255,255,255,0.32)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
            paddingLeft: '0.24em',
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
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.2vh, 14px)',
          }}>{item.text}</div>
        );
      case 'copyright':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.7vw, 8px)',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.12)',
            textTransform: 'uppercase',
            textAlign: 'center',
            paddingLeft: '0.2em',
          }}>{item.text}</div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: '#030303',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        cursor: 'pointer',
      }}
    >
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
        onClick={e => { e.stopPropagation(); onClose(); }}
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
          transition: 'color 0.25s ease, opacity 0.25s ease',
          opacity: visible ? 1 : 0,
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

      {/* Scrolling credits */}
      <div
        ref={containerRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', inset: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          cursor: 'default',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '100vh clamp(24px, 5vw, 48px) 0',
        }}>
          {CREDITS.map((item, i) => renderLine(item, i))}
        </div>
      </div>
    </div>
  );
}
