/**
 * CreditsModal — hella.rich cinematic end credits
 *
 * Design: film end credits — clear, uppercase, cinematic hierarchy
 * Active-section highlighting: IntersectionObserver on a real scrolling container.
 * Sections passing through the middle third of the viewport brighten slightly (scale 1.02, opacity boost).
 * Inactive sections dim to 0.35 opacity. Smooth CSS transitions.
 * Auto-closes when scroll reaches end. X icon fixed top-right.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

// px/second scroll speed — 40 = slow/cinematic
const SCROLL_SPEED = 40;

// Group lines into sections for highlighting
// Each section is an array of lines
const SECTIONS = [
  [
    { type: 'spacer-lg' },
    { type: 'title',    text: 'HELLA.RICH' },
    { type: 'subtitle', text: 'SMALL INTERNET THINGS' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'CREATED BY' },
    { type: 'name',     text: 'DICANOMI' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'CREATIVE DIRECTION' },
    { type: 'item',     text: 'CONCEPT DESIGN' },
    { type: 'item',     text: 'INTERACTION DESIGN' },
    { type: 'item',     text: 'VISUAL DESIGN' },
    { type: 'item',     text: 'SOUND DESIGN' },
    { type: 'item',     text: 'MOTION DESIGN' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'BUILT WITH' },
    { type: 'item',     text: 'ARTIFICIAL INTELLIGENCE' },
    { type: 'item',     text: 'MANUS' },
    { type: 'item',     text: 'CHATGPT' },
    { type: 'item',     text: 'REACT' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'PRODUCTS' },
    { type: 'product',  text: 'THE EYE' },
    { type: 'product',  text: 'LOW BATTERY' },
    { type: 'product',  text: 'SPACE DRONE' },
    { type: 'product',  text: 'ÆTHER' },
    { type: 'product',  text: 'DEAD AIR' },
    { type: 'product',  text: 'FOURCAST' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'PROCESS' },
    { type: 'item',     text: 'IDEA' },
    { type: 'item',     text: 'PROMPT' },
    { type: 'item',     text: 'PROTOTYPE' },
    { type: 'item',     text: 'TEST' },
    { type: 'item',     text: 'REFINE' },
    { type: 'item',     text: 'PUBLISH' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'label',    text: 'EXPLORING' },
    { type: 'item',     text: 'HUMAN CREATIVITY' },
    { type: 'item',     text: 'AI COLLABORATION' },
    { type: 'item',     text: 'RAPID PRODUCT CREATION' },
    { type: 'spacer-lg' },
  ],
  [
    { type: 'spacer-lg' },
    { type: 'copyright', text: `© ${new Date().getFullYear()} DICANOMI` },
    { type: 'spacer-lg' },
    { type: 'spacer-lg' },
  ],
];

export function CreditsModal({ onClose }: CreditsModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);
  const userPausedRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fade in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ESC closes silently
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    cancelAnimationFrame(rafRef.current);
    setClosing(true);
    setTimeout(onClose, 400);
  }, [onClose]);

  // rAF scroll loop — smooth, continuous
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const loop = () => {
      if (!userPausedRef.current) {
        posRef.current += SCROLL_SPEED / 60; // px per frame at 60fps
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (posRef.current >= maxScroll) {
          posRef.current = maxScroll;
          // Auto-close: pause 0.5s then fade out
          closeTimerRef.current = setTimeout(() => {
            setClosing(true);
            setTimeout(onClose, 500);
          }, 500);
          return; // stop loop
        }
        el.scrollTop = posRef.current;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Hover pauses
    const onEnter = () => { userPausedRef.current = true; };
    const onLeave = () => { userPausedRef.current = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [onClose]);

  // IntersectionObserver — active section = intersects middle third of viewport
  useEffect(() => {
    const rootMargin = '-33% 0px -33% 0px'; // middle third
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = Number(entry.target.getAttribute('data-section'));
          if (entry.isIntersecting) {
            setActiveSection(idx);
          } else {
            setActiveSection(prev => prev === idx ? null : prev);
          }
        });
      },
      { root: scrollRef.current, rootMargin, threshold: 0 }
    );
    sectionRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const renderLine = (item: { type: string; text?: string }, i: number) => {
    const key = `line-${i}`;
    switch (item.type) {
      case 'spacer-lg':
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

      {/* Close icon — fixed top-right */}
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

      {/* Scrolling container */}
      <div
        ref={scrollRef}
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
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Top spacer — pushes first section to start below viewport */}
        <div style={{ height: '100vh' }} />

        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 48px)' }}>
          {SECTIONS.map((section, sIdx) => {
            const isActive = activeSection === sIdx;
            return (
              <div
                key={sIdx}
                ref={el => { sectionRefs.current[sIdx] = el; }}
                data-section={sIdx}
                style={{
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  opacity: isActive ? 1 : 0.35,
                  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.6s ease',
                  transformOrigin: 'center center',
                }}
              >
                {section.map((item, lIdx) => renderLine(item, sIdx * 100 + lIdx))}
              </div>
            );
          })}
        </div>

        {/* Bottom spacer — ensures last section scrolls fully off */}
        <div style={{ height: '100vh' }} />
      </div>
    </div>
  );
}
