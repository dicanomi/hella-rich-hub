/**
 * CreditsModal — hella.rich cinematic credits
 *
 * Design: film end credits × album liner notes × old software easter egg
 * Discovered, not announced. Quiet. Premium. Monochrome.
 *
 * Triggered by clicking "Dicanomi" in the About modal.
 * ESC / click outside closes.
 * Auto-scrolls slowly. User can override.
 */
import { useEffect, useRef, useState } from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

const CREDITS = [
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'title', text: 'HELLA.RICH' },
  { type: 'subtitle', text: 'small internet things' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'CREATED BY' },
  { type: 'name', text: 'Dicanomi' },
  { type: 'spacer' },
  { type: 'label', text: 'HUMAN DIRECTION' },
  { type: 'name', text: 'Jeffrey Willis' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'BUILT WITH' },
  { type: 'item', text: 'Artificial intelligence' },
  { type: 'item', text: 'Questionable decisions' },
  { type: 'item', text: 'Late night curiosity' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'EXPERIMENTS IN' },
  { type: 'item', text: 'Interaction' },
  { type: 'item', text: 'Sound' },
  { type: 'item', text: 'Motion' },
  { type: 'item', text: 'Emotion' },
  { type: 'item', text: 'Beautifully unnecessary technology' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'TOOLS' },
  { type: 'item', text: 'Manus' },
  { type: 'item', text: 'ChatGPT' },
  { type: 'item', text: 'React' },
  { type: 'item', text: 'Coffee' },
  { type: 'item', text: 'Mistakes' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'PRODUCTS' },
  { type: 'product', text: 'THE EYE' },
  { type: 'product', text: 'LOW BATTERY' },
  { type: 'product', text: 'SPACE DRONE' },
  { type: 'product', text: 'ÆTHER' },
  { type: 'product', text: 'DEAD AIR' },
  { type: 'product', text: 'FOURCAST' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'label', text: 'PHILOSOPHY' },
  { type: 'philosophy', text: 'No decks.' },
  { type: 'philosophy', text: 'No hypotheticals.' },
  { type: 'philosophy', text: 'Just things that exist.' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'copyright', text: `© ${new Date().getFullYear()} Dicanomi` },
  { type: 'spacer' },
  { type: 'spacer' },
  { type: 'spacer' },
];

export function CreditsModal({ onClose }: CreditsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const userScrolledRef = useRef(false);
  const [visible, setVisible] = useState(false);

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

  // Auto-scroll — slow, 0.4px/frame (~24px/s at 60fps)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const loop = () => {
      if (!userScrolledRef.current && el) {
        el.scrollTop += 0.4;
        // Stop at bottom
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          userScrolledRef.current = true;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Detect manual scroll — pause auto-scroll
    const onScroll = () => { userScrolledRef.current = true; };
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const renderLine = (item: typeof CREDITS[0], i: number) => {
    const key = `${item.type}-${i}`;
    switch (item.type) {
      case 'spacer':
        return <div key={key} style={{ height: 'clamp(24px, 4vh, 40px)' }} />;
      case 'title':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '8px',
          }}>{item.text}</div>
        );
      case 'subtitle':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(12px, 1.1vw, 14px)',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.28)',
            textAlign: 'center',
            fontWeight: 300,
          }}>{item.text}</div>
        );
      case 'label':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px, 0.8vw, 10px)',
            letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.22)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 18px)',
          }}>{item.text}</div>
        );
      case 'name':
        return (
          <div key={key} style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(20px, 2.8vw, 36px)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.78)',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 12px)',
          }}>{item.text}</div>
        );
      case 'item':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(13px, 1.3vw, 16px)',
            fontWeight: 300,
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.52)',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 10px)',
          }}>{item.text}</div>
        );
      case 'product':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(9px, 1vw, 12px)',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.38)',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.2vh, 14px)',
          }}>{item.text}</div>
        );
      case 'philosophy':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            fontWeight: 300,
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.62)',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 10px)',
          }}>{item.text}</div>
        );
      case 'copyright':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px, 0.75vw, 9px)',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.15)',
            textAlign: 'center',
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
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        cursor: 'pointer',
      }}
    >
      {/* Fade top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 'clamp(60px, 12vh, 120px)',
        background: 'linear-gradient(to bottom, rgba(3,3,3,0.98) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 'clamp(60px, 12vh, 120px)',
        background: 'linear-gradient(to top, rgba(3,3,3,0.98) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          height: '100vh',
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
          maxWidth: '480px',
          margin: '0 auto',
          padding: '30vh clamp(24px, 5vw, 48px) 0',
        }}>
          {CREDITS.map((item, i) => renderLine(item, i))}
        </div>
      </div>

      {/* ESC hint — fades after 3s */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(16px, 3vh, 28px)',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px, 0.75vw, 9px)',
        letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.12)',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        zIndex: 20,
        whiteSpace: 'nowrap',
      }}>
        ESC TO CLOSE
      </div>
    </div>
  );
}
