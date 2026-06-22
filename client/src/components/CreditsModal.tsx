/**
 * CreditsModal — hella.rich cinematic end credits
 *
 * EXPERIENCE, not a modal. Film end credits.
 * CSS @keyframes scroll (translateY 100vh → -100%) — starts immediately, no timing bugs.
 * IntersectionObserver on viewport (root: null) for active-section highlighting.
 * FIN at end — click closes. X icon fixed top-right.
 * 25s total — cinematic but not slow.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

// Total scroll duration in seconds — 25s = cinematic, readable
const DURATION = 25;

// Sections — each becomes an observed element for highlighting
const SECTIONS: Array<{ lines: Array<{ type: string; text?: string }> }> = [
  {
    lines: [
      { type: 'title',    text: 'HELLA.RICH' },
      { type: 'subtitle', text: 'SMALL INTERNET THINGS' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'CREATED BY' },
      { type: 'name',     text: 'DICANOMI' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'CREATIVE DIRECTION' },
      { type: 'item',     text: 'CONCEPT DESIGN' },
      { type: 'item',     text: 'INTERACTION DESIGN' },
      { type: 'item',     text: 'VISUAL DESIGN' },
      { type: 'item',     text: 'SOUND DESIGN' },
      { type: 'item',     text: 'MOTION DESIGN' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'CREATED WITH' },
      { type: 'item',     text: 'MANUS' },
      { type: 'item',     text: 'CLAUDE' },
      { type: 'item',     text: 'CHATGPT' },
      { type: 'item',     text: 'CODEX' },
      { type: 'item',     text: 'HIGGSFIELD' },
      { type: 'item',     text: 'REACT' },
      { type: 'item',     text: 'GITHUB' },
      { type: 'item',     text: 'CLOUDFLARE' },
      { type: 'item',     text: 'PORKBUN' },
      { type: 'item',     text: 'FORMSPREE' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'PRODUCTS' },
      { type: 'product',  text: 'HELLA_RADIO' },
      { type: 'product',  text: 'HUMAN.EXE' },
      { type: 'product',  text: 'ORB' },
      { type: 'product',  text: 'DEAD AIR' },
      { type: 'product',  text: 'ÆTHER' },
      { type: 'product',  text: 'SPACE DRONE' },
      { type: 'product',  text: 'LOW BATTERY' },
      { type: 'product',  text: 'FOURCAST' },
      { type: 'product',  text: 'THE EYE' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'WORKFLOW' },
      { type: 'item',     text: 'IDEA' },
      { type: 'item',     text: 'PROMPT' },
      { type: 'item',     text: 'BUILD' },
      { type: 'item',     text: 'TEST' },
      { type: 'item',     text: 'REFINE' },
      { type: 'item',     text: 'DEPLOY' },
    ],
  },
  {
    lines: [
      { type: 'label',    text: 'EXPLORING' },
      { type: 'item',     text: 'HUMAN CREATIVITY' },
      { type: 'item',     text: 'AI COLLABORATION' },
      { type: 'item',     text: 'RAPID PRODUCT CREATION' },
    ],
  },
  {
    lines: [
      { type: 'copyright', text: `© ${new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date())} DICANOMI` },
    ],
  },
  {
    lines: [
      { type: 'fin' },
    ],
  },
];

export function CreditsModal({ onClose }: CreditsModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Auto-close: DURATION + 1s pause after animation ends
  useEffect(() => {
    closeTimerRef.current = setTimeout(() => {
      setClosing(true);
      setTimeout(onClose, 500);
    }, (DURATION + 1) * 1000);
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
    setTimeout(onClose, 400);
  }, [onClose]);

  // IntersectionObserver — root: null = viewport
  // rootMargin: middle third of viewport is the active zone
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = Number(entry.target.getAttribute('data-idx'));
          if (entry.isIntersecting) {
            setActiveIdx(idx);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0,
      }
    );
    sectionRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const renderLine = (line: { type: string; text?: string }, key: string) => {
    switch (line.type) {
      case 'title':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(13px, 1.4vw, 18px)',
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
            marginBottom: '10px',
          }}>{line.text}</div>
        );
      case 'subtitle':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px, 0.8vw, 10px)',
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            color: 'rgba(255,255,255,0.28)',
            textAlign: 'center',
          }}>{line.text}</div>
        );
      case 'label':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.72vw, 9px)',
            letterSpacing: '0.32em',
            paddingLeft: '0.32em',
            color: 'rgba(255,255,255,0.22)',
            textAlign: 'center',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
          }}>{line.text}</div>
        );
      case 'name':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(18px, 2.5vw, 32px)',
            letterSpacing: '0.28em',
            paddingLeft: '0.28em',
            color: 'rgba(255,255,255,0.88)',
            textAlign: 'center',
          }}>{line.text}</div>
        );
      case 'item':
        return (
          <div key={key} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(11px, 1.1vw, 14px)',
            fontWeight: 400,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 10px)',
            textTransform: 'uppercase',
          }}>{line.text}</div>
        );
      case 'product':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(9px, 0.9vw, 11px)',
            letterSpacing: '0.24em',
            paddingLeft: '0.24em',
            color: 'rgba(255,255,255,0.38)',
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
          }}>{line.text}</div>
        );
      case 'copyright':
        return (
          <div key={key} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.7vw, 8px)',
            letterSpacing: '0.2em',
            paddingLeft: '0.2em',
            color: 'rgba(255,255,255,0.14)',
            textAlign: 'center',
          }}>{line.text}</div>
        );
      case 'fin':
        return (
          <button
            key={key}
            onClick={handleClose}
            style={{
              display: 'block',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(28px, 4vw, 52px)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '0.18em',
              paddingLeft: '0.18em',
              color: 'rgba(255,255,255,0.55)',
              textAlign: 'center',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.88)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            FIN
          </button>
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
        @keyframes creditsRoll {
          0%   { transform: translateY(100vh); }
          100% { transform: translateY(-100%); }
        }
        .credits-roll {
          animation: creditsRoll ${DURATION}s linear forwards;
          will-change: transform;
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

      {/* Credits track — CSS keyframe, starts immediately */}
      <div
        className="credits-roll"
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
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(40px, 8vh, 72px)',
        }}>
          {SECTIONS.map((section, sIdx) => {
            const isActive = activeIdx === sIdx;
            return (
              <div
                key={sIdx}
                ref={el => { sectionRefs.current[sIdx] = el; }}
                data-idx={sIdx}
                style={{
                  opacity: isActive ? 1 : 0.32,
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)',
                  transformOrigin: 'center center',
                }}
              >
                {section.lines.map((line, lIdx) =>
                  renderLine(line, `${sIdx}-${lIdx}`)
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
