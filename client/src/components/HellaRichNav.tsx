/**
 * HellaRichNav — Global Navigation
 *
 * Design: Cinematic Product Lab
 * Dark glass pill, fixed top-left, back link + product switcher
 * Hidden on landing page (/)
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

interface NavProject {
  title: string;
  slug: string;
  external?: boolean;
  current?: boolean;
}

const PROJECTS: NavProject[] = [
  { title: 'THE EYE', slug: '/the-eye' },
  { title: 'LOW BATTERY', slug: '/low-battery' },
  { title: 'SPACE DRONE', slug: '/space-drone' },
  { title: 'ÆTHER', slug: '/aether' },
  { title: 'DEAD AIR', slug: '/dead-air' },
  { title: 'ORB', slug: '/orb' },
  { title: 'FOURCAST', slug: '/fourcast' },
  { title: 'RADIO', slug: '/radio' },
];

export function HellaRichNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // ALL hooks must be called before any early return (Rules of Hooks)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onOutside = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, []);

  // Early return AFTER all hooks
  const isLanding = location === '/';
  const isRadio = location === '/radio' || location.startsWith('/radio/');
  if (isLanding || isRadio) return null;

  const currentProject = PROJECTS.find(p => location.startsWith(p.slug));

  return (
    <>
      <style>{`
        @keyframes hrNavFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hr-nav {
          position: fixed;
          top: clamp(14px, 2.2vh, 22px);
          left: clamp(16px, 2.5vw, 28px);
          z-index: 9000;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
        }
        .hr-back {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 clamp(10px, 1.5vw, 14px);
          height: clamp(30px, 4vh, 36px);
          background: rgba(8,8,6,0.72);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 3px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          text-decoration: none;
          transition: background 0.18s ease, border-color 0.18s ease;
          outline: none;
          color: rgba(255,255,255,0.55);
        }
        .hr-back:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.75);
        }
        .hr-back-label {
          font-size: clamp(8px, 0.85vw, 10px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1;
          user-select: none;
        }
        .hr-switcher {
          width: clamp(28px, 3.5vw, 32px);
          height: clamp(28px, 3.5vw, 32px);
          border-radius: 3px;
          background: rgba(8,8,6,0.72);
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.18s ease, border-color 0.18s ease;
          padding: 0;
          outline: none;
          color: rgba(255,255,255,0.6);
          position: relative;
        }
        .hr-switcher:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
        }
        .hr-switcher[aria-expanded="true"] {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
        }
        .hr-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 170px;
          background: rgba(8,8,6,0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 3px;
          padding: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: hrNavFadeIn 0.15s ease;
        }
        .hr-dropdown-label {
          padding: 5px 8px 4px;
          font-size: clamp(7px, 0.75vw, 8px);
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.22);
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 3px;
        }
        .hr-project-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px;
          border-radius: 2px;
          text-decoration: none;
          transition: background 0.12s ease;
          cursor: pointer;
        }
        .hr-project-item:hover { background: rgba(255,255,255,0.07); }
        .hr-project-item.current { background: rgba(255,255,255,0.06); }
        .hr-project-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(255,255,255,0.25);
          flex-shrink: 0;
        }
        .hr-project-dot.live { background: rgba(80,200,120,0.7); }
        .hr-project-title {
          font-size: clamp(8px, 0.9vw, 10px);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          line-height: 1;
        }
        .hr-project-item.current .hr-project-title { color: rgba(255,255,255,0.88); }
      `}</style>
      <nav className="hr-nav" aria-label="hella.rich navigation">
        <a href="/" className="hr-back" aria-label="Back to hella.rich">
          <svg className="hr-back-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M6 1L1 4L6 7M1 4H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hr-back-label">hella.rich</span>
        </a>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            className="hr-switcher"
            aria-label="Switch product"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 2H13M1 5H13M1 8H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          {open && (
            <div className="hr-dropdown" role="menu">
              <div className="hr-dropdown-label">Products</div>
              {PROJECTS.map(p => (
                <a
                  key={p.slug}
                  href={p.slug}
                  className={`hr-project-item${currentProject?.slug === p.slug ? ' current' : ''}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className="hr-project-dot live" />
                  <span className="hr-project-title">{p.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
