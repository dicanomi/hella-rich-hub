/**
 * hella.rich — Landing Page (Hub)
 * Design: Cinematic Product Lab — A24 × Braun × late-night test pattern
 * All images: existing Cloudfront assets from deployed repos
 * All links: internal Manus routes only — no external hella.rich URLs
 * Featured: THE EYE — flagship product, first position, 1.4× taller
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ParticleField } from '../components/ParticleField';
import { HeaderTicker } from '../components/HeaderTicker';
import { ContactModal } from '../components/ContactModal';
import { CreditsModal } from '../components/CreditsModal';

// ── Existing Cloudfront card images (from deployed repos) ──────────────────
const CARD_THE_EYE    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/4dGTww6dwDMqWYygdCjBiT/the-eye-card-m8kJtzMhgXq8bTQ7kEpxk6.webp';
const CARD_LOW_BATTERY = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/c8PJjjHRHohroqXKsYYz7X/card-low-battery-b2i2kASdULLNdxF4XMjptc.webp';
const CARD_SPACE_DRONE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/c8PJjjHRHohroqXKsYYz7X/card-space-drone-ZSPMYcoBfZnyXPZaTunNjX.webp';
const CARD_AETHER      = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/jbzZmqNRVq8gZbr6uL7crh/card-aether-dCswxwbBYi2VWJHwFeF2rN.webp';
const CARD_DEAD_AIR    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/9ZxPKGjDMY2C56HR5iUGn8/card-dead-air-Wgkrd7hVm3xLcWTrTUd5hL.webp';
const CARD_ORB         = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/KQMLixAcwLTktWD55tWJwK/card-orb-v2-GA954d4iJrPLDQTUdJE9eS.webp';
const CARD_FOURCAST    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/Y2GqaD9tuJ99Jnnw3Suzuk/fourcast-card-v2-FTNVUNxhCmBWxuJ5wiNteQ.webp';
const RADIO_CARD       = `${import.meta.env.BASE_URL}radio-card.webp`;

// ── H1 Typewriter ──────────────────────────────────────────────────────────

/**
 * HellaRichH1 — the ONLY homepage H1 component
 *
 * Looping sequence (repeats forever):
 * 1. HELLA RICH. / MEGA POOR.   (2.5s hold)
 * 2. BUILDING FUTURE...         (0.9s)
 * 3. CALCULATING OUTCOME...     (0.9s)
 * 4. MIDDLE CLASS NOT FOUND     (1.0s)
 * 5. Fade out, return to step 1
 *
 * No handoff to old typewriter. No old phrases.
 */
function HellaRichH1() {
  const [sysText, setSysText] = useState('');
  const [sysVisible, setSysVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // One full cycle: 2500 + 900 + 900 + 1000 + 600 fade = ~5900ms
    const CYCLE = 5900;

    const runCycle = (offset: number) => [
      setTimeout(() => { setSysText('BUILDING FUTURE...');     setSysVisible(true);  }, offset + 2500),
      setTimeout(() => { setSysText('CALCULATING OUTCOME...'); setSysVisible(true);  }, offset + 3400),
      setTimeout(() => { setSysText('MIDDLE CLASS NOT FOUND'); setSysVisible(true);  }, offset + 4300),
      setTimeout(() => {                                        setSysVisible(false); }, offset + 5300),
      setTimeout(() => { setSysText('');                                              }, offset + 5900),
    ];

    // Start first cycle immediately, then loop
    let timers = runCycle(0);
    const interval = setInterval(() => {
      timers = runCycle(0);
    }, CYCLE);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <span style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minHeight: '2.15em',
      position: 'relative',
    }}>
      <span style={{ display: 'block' }}>Hella Rich.</span>

      {/* System sequence — between the lines, loops */}
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px, 0.9vw, 12px)',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.38)',
          fontWeight: 400,
          lineHeight: 1.2,
          margin: '0.1em 0',
          opacity: sysVisible ? 1 : 0,
          transition: sysVisible ? 'opacity 0.1s ease' : 'opacity 0.5s ease',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          minHeight: '1.2em',
        }}
      >
        {sysText}
      </span>

      <span style={{ display: 'block' }}>Mega Poor.</span>
    </span>
  );
}

// ── About Modal ────────────────────────────────────────────────────────────
function AboutModal({ onClose, onOpenCredits }: { onClose: () => void; onOpenCredits: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
        overflowY: 'auto',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          background: '#0a0908',
          minHeight: '100vh',
          width: '100%',
          maxWidth: '720px',
          cursor: 'default',
          padding: 'clamp(48px, 8vh, 80px) clamp(28px, 6vw, 72px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close — inside modal, top-right corner */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="modal-close-btn"
          style={{
            position: 'absolute', top: 'clamp(16px,2.5vh,24px)', right: 'clamp(16px,2.5vw,28px)',
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', zIndex: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" strokeWidth="1.6" strokeLinecap="round" stroke="currentColor">
            <line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/>
          </svg>
        </button>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '32px' }}>hella.rich</div>

        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(14px,1.5vw,18px)',
          color: 'rgba(255,255,255,0.72)',
          fontWeight: 300,
          lineHeight: 1.8,
          margin: '0 0 48px',
          maxWidth: '480px',
        }}>
          Small internet things.<br />
          <br />
          Built with AI.<br />
          Directed by a human.<br />
          <br />
          Experiments in interaction,<br />
          sound,<br />
          motion,<br />
          and questionable decisions.<br />
          <br />
          Made by{' '}
          <button
            onClick={() => { onClose(); setTimeout(onOpenCredits, 50); }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
              color: 'rgba(255,255,255,0.72)',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.2)',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s ease, text-decoration-color 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.95)';
              (e.currentTarget as HTMLElement).style.textDecorationColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)';
              (e.currentTarget as HTMLElement).style.textDecorationColor = 'rgba(255,255,255,0.2)';
            }}
          >
            Dicanomi
          </button>.
        </p>

        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '16px' }}>The products</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { title: 'THE EYE',     tagline: 'A strange object that notices you.',                          href: '/the-eye' },
              { title: 'LOW BATTERY', tagline: 'The sound you ignore until it becomes your personality.',     href: '/low-battery' },
              { title: 'SPACE DRONE', tagline: 'A drifting machine for doing absolutely nothing.',            href: '/space-drone' },
              { title: 'ÆTHER',       tagline: 'Impossible to sound bad.',                                    href: '/aether' },
              { title: 'DEAD AIR',    tagline: 'Late night radio scanner.',                                   href: '/dead-air' },
              { title: 'ORB',         tagline: 'A living object.',                                            href: '/orb' },
              { title: 'FOURCAST',    tagline: 'A weather app predicting the end of the world. Politely.',    href: '/fourcast' },
            ].map(p => (
              <Link
                key={p.title}
                href={p.href}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: '12px',
                  textDecoration: 'none', padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  transition: 'opacity 0.2s ease',
                }}
                onClick={onClose}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(12px,1.2vw,14px)', color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{p.tagline}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
          HELLA.RICH // NODE_1956
        </div>
        <div style={{ marginTop: '24px', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
          © {new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date())} hella.rich
        </div>
      </div>
    </div>
  );
}

// ── ProjectCard ────────────────────────────────────────────────────────────
interface ProjectCardProps {
  slug: string;
  title: string;
  tagline: string;
  image: string;
  index: number;
  live?: boolean;
  cta?: string;
  featured?: boolean;
  enterDelay?: number;
  externalHref?: string;
}

function ProjectCard({ slug, title, tagline, image, index, live = true, cta, featured = false, enterDelay = 0, externalHref }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), enterDelay);
    return () => clearTimeout(t);
  }, [enterDelay]);

  const titleFont =
    slug === 'space-drone' ? "'Space Mono', 'Courier New', monospace" :
    slug === 'aether'      ? "'IBM Plex Mono', 'DM Mono', monospace" :
    slug === 'dead-air'    ? "'Space Grotesk', sans-serif" :
    slug === 'orb'         ? "'Cormorant Garamond', 'Georgia', serif" :
    slug === 'fourcast'    ? "'Press Start 2P', monospace" :
    slug === 'the-eye'     ? "'Cormorant Garamond', 'Georgia', serif" :
    slug === 'low-battery' ? "'ArenaGraffiti', 'GraffitiCity', 'Permanent Marker', cursive" :
    slug === 'radio'       ? "'TAY Birdie', 'Space Mono', monospace" :
    "'Space Grotesk', sans-serif";

  const titleSize =
    slug === 'space-drone' ? 'clamp(22px, 3.5vw, 48px)' :
    slug === 'aether'      ? 'clamp(24px, 4vw, 56px)' :
    slug === 'dead-air'    ? 'clamp(22px, 3.5vw, 48px)' :
    slug === 'orb'         ? 'clamp(28px, 5vw, 72px)' :
    slug === 'fourcast'    ? 'clamp(14px, 2.4vw, 32px)' :
    slug === 'the-eye'     ? 'clamp(24px, 4.5vw, 64px)' :
    slug === 'low-battery'  ? 'clamp(28px, 4.5vw, 64px)' :
    'clamp(22px, 3.5vw, 48px)';

  const titleWeight =
    slug === 'space-drone' ? 700 :
    slug === 'aether'      ? 500 :
    slug === 'dead-air'    ? 300 :
    slug === 'orb'         ? 300 :
    slug === 'the-eye'     ? 300 :
    400;

  const titleTracking =
    slug === 'space-drone' ? '0.18em' :
    slug === 'aether'      ? '0.15em' :
    slug === 'dead-air'    ? '0.45em' :
    slug === 'orb'         ? '0.55em' :
    slug === 'fourcast'    ? '0.04em' :
    slug === 'the-eye'     ? '0.45em' :
    '0.12em';

  const cardHeight = featured
    ? 'clamp(360px, 52vw, 720px)'
    : 'clamp(260px, 34vw, 480px)';

  const content = (
    <div
      style={{
        position: 'relative',
        height: cardHeight,
        borderRadius: '2px',
        overflow: 'hidden',
        cursor: live ? 'pointer' : 'default',
        opacity: visible ? (live ? 1 : 0.4) : 0,
        transform: visible
          ? `translateY(0) scale(${pressed ? 0.99 : hovered ? 1.012 : 1})`
          : 'translateY(18px)',
        transition: visible
          ? `opacity 0.55s cubic-bezier(0.23,1,0.32,1), transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease`
          : 'none',
        boxShadow: hovered
          ? `0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,${featured ? '0.12' : '0.07'})`
          : `0 2px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
        willChange: 'transform',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {/* Image */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
        willChange: 'transform',
      }}>
        <img
          src={image}
          alt={title}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: hovered ? 'brightness(0.78) contrast(1.04)' : 'brightness(0.58) contrast(1.02)',
            transition: 'filter 0.5s ease',
          }}
        />
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Featured glow */}
      {featured && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(80,140,220,${hovered ? '0.10' : '0.04'}) 0%, transparent 70%)`,
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }} />
      )}

      {/* Featured badge */}
      {featured && (
        <div style={{
          position: 'absolute',
          top: 'clamp(16px,2.5vw,28px)',
          left: 'clamp(20px,3vw,36px)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(7px,0.75vw,9px)',
          letterSpacing: '0.22em',
          color: 'rgba(80,160,255,0.75)',
          textTransform: 'uppercase',
          background: 'rgba(80,140,220,0.12)',
          border: '1px solid rgba(80,140,220,0.25)',
          padding: '4px 8px',
          borderRadius: '2px',
        }}>
          Featured
        </div>
      )}

      {/* Index */}
      <div style={{
        position: 'absolute',
        top: 'clamp(16px,2.5vw,28px)',
        right: 'clamp(16px,2.5vw,28px)',
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(9px,0.9vw,11px)',
        color: 'rgba(255,255,255,0.22)',
        letterSpacing: '0.15em',
      }}>
        {String(index).padStart(2, '0')}
      </div>

      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(20px,3.5vw,40px)',
        left: 'clamp(20px,3.5vw,40px)',
        right: 'clamp(20px,3.5vw,40px)',
      }}>
        <h2 style={{
          fontFamily: titleFont,
          fontSize: titleSize,
          fontWeight: titleWeight,
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: titleTracking,
          lineHeight: 1,
          margin: '0 0 clamp(6px,1vw,12px)',
          textTransform: 'uppercase',
        }}>
          {title}
        </h2>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(11px,1.2vw,15px)',
          color: 'rgba(255,255,255,0.52)',
          fontWeight: 300,
          lineHeight: 1.4,
          margin: '0 0 clamp(14px,2vw,24px)',
          maxWidth: '440px',
          letterSpacing: '0.01em',
        }}>
          {tagline}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          opacity: hovered ? 1 : 0.55,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.9vw,10px)',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.75)',
            textTransform: 'uppercase',
          }}>
            {cta || 'Enter Experience'}
          </span>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M12 1L17 6L12 11M1 6H17" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );

  if (!live) return <div style={{ opacity: 0.35 }}>{content}</div>;
  // All routes are internal — use Link for all
if (externalHref) return <a href={externalHref} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{content}</a>;
  return <Link href={`/${slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{content}</Link>;}

// ── Cross-awareness messages ──────────────────────────────────────────────
const CROSS_AWARENESS: Record<string, string[]> = {
  'the-eye':     ['THE DRONE IS STILL RUNNING.', 'THE ORB NOTICED YOU.', 'SIGNAL DETECTED FROM SPACE.'],
  'low-battery': ['THE EYE SAW YOU IGNORE THIS.', 'THE ORB IS WATCHING.', 'FOURCAST PREDICTED THIS.'],
  'space-drone': ['SIGNAL DETECTED.', 'THE EYE IS TRACKING.', 'TRANSMISSION RECEIVED.'],
  'aether':      ['THE DRONE HARMONICS ALIGNED.', 'DEAD AIR IS LISTENING.', 'SIGNAL LOCKED.'],
  'dead-air':    ['THE EYE HEARD SOMETHING.', 'DRONE FREQUENCY DETECTED.', 'STATIC INCOMING.'],
  'orb':         ['THE EYE IS WATCHING THE ORB.', 'SIGNAL FROM THE DRONE.', 'AETHER RESONATING.'],
  'fourcast':    ['THE EYE PREDICTED THIS.', 'LOW BATTERY IGNORED THE WARNING.', 'OUTCOME CALCULATED.'],
};

const PRODUCT_SLUGS = ['orb', 'the-eye', 'low-battery', 'space-drone', 'aether', 'dead-air', 'fourcast'];

// ── Main Landing ───────────────────────────────────────────────────────────
// ── ArchiveRow — catalog list item (digital archive / OS index feel) ──────────
function ArchiveRow({ slug, n, title, desc, img }: { slug: string; n: string; title: string; desc: string; img: string }) {
  const [hovered, setHovered] = useState(false);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return (
    <Link
      href={'/' + slug}
      role="listitem"
      aria-label={title + ' — ' + desc}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(56px,8vw,84px) clamp(34px,4vw,52px) 1fr auto',
        alignItems: 'baseline',
        columnGap: 'clamp(12px,2vw,28px)',
        textDecoration: 'none',
        padding: 'clamp(16px,2vw,22px) clamp(4px,1vw,10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.18s ease',
        cursor: 'pointer',
      }}
    >
      {/* thumbnail */}
      <img
        src={img}
        alt=""
        aria-hidden="true"
        loading="lazy"
        style={{
          width: 'clamp(56px,8vw,84px)',
          height: 'clamp(40px,5.5vw,56px)',
          objectFit: 'cover',
          borderRadius: '2px',
          border: '1px solid rgba(255,255,255,0.1)',
          alignSelf: 'center',
          opacity: hovered ? 1 : 0.82,
          transition: 'opacity 0.18s ease',
          display: 'block',
        }}
      />

      {/* index number */}
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(10px,1vw,12px)',
        letterSpacing: '0.1em',
        color: hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
        transition: 'color 0.18s ease',
        fontVariantNumeric: 'tabular-nums',
      }}>{n}</span>

      {/* name + description */}
      <span style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(13px,1.5vw,18px)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: hovered ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)',
          transition: 'color 0.18s ease',
        }}>{title}</span>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(12px,1.15vw,14px)',
          fontWeight: 300,
          lineHeight: 1.4,
          color: 'rgba(255,255,255,0.42)',
        }}>{desc}</span>
      </span>

      {/* hover arrow */}
      <span aria-hidden="true" style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(13px,1.4vw,17px)',
        color: 'rgba(255,255,255,0.7)',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        alignSelf: 'center',
      }}>→</span>
    </Link>
  );
}

export default function Landing() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [awarenessMsg, setAwarenessMsg] = useState<{slug: string; text: string} | null>(null);

  // ── View mode: 'gallery' (cards) | 'archive' (catalog list) ──
  const [view, setView] = useState<'gallery' | 'archive'>('gallery');
  const [viewSwapping, setViewSwapping] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hella_view');
      if (saved === 'archive' || saved === 'gallery') setView(saved);
    } catch (e) { /* ignore */ }
  }, []);
  const switchView = (next: 'gallery' | 'archive') => {
    if (next === view) return;
    try { localStorage.setItem('hella_view', next); } catch (e) {}
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setView(next); return; }
    setViewSwapping(true);
    setTimeout(() => { setView(next); setViewSwapping(false); }, 160);
  };


  // Cross-awareness: rare random message on a card after 8s on page
  useEffect(() => {
    const slugs = Object.keys(CROSS_AWARENESS);
    const trigger = () => {
      if (Math.random() > 0.25) return; // 25% chance per interval
      const slug = slugs[Math.floor(Math.random() * slugs.length)];
      const msgs = CROSS_AWARENESS[slug];
      const text = msgs[Math.floor(Math.random() * msgs.length)];
      setAwarenessMsg({ slug, text });
      setTimeout(() => setAwarenessMsg(null), 3200);
    };
    const initial = setTimeout(trigger, 8000);
    const interval = setInterval(trigger, 22000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'TAY Birdie';
          src: url('${import.meta.env.BASE_URL}TAYBirdie.otf') format('opentype');
          font-display: swap;
        }
        .modal-close-btn {
          transition: color 0.2s ease, transform 0.2s cubic-bezier(0.23,1,0.32,1), background 0.2s ease;
          border-radius: 50%;
        }
        .modal-close-btn:hover {
          color: rgba(255,255,255,0.85) !important;
          transform: rotate(90deg) scale(1.1);
          background: rgba(255,255,255,0.06);
        }
        .modal-close-btn:active {
          transform: rotate(90deg) scale(0.95);
        }
        @keyframes awarenessIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes h1CursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .h1-cursor {
          font-weight: 300;
          color: rgba(255,255,255,0.55);
          animation: h1CursorBlink 0.55s steps(1) infinite;
          margin-left: 0.04em;
        }
        .h1-wrap {
          min-height: 2.15em;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
      `}</style>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} onOpenCredits={() => setCreditsOpen(true)} />}
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
      <ParticleField />

      <div style={{
        minHeight: '100vh',
        background: '#0a0908',
        color: 'rgba(255,255,255,0.88)',
        fontFamily: "'Space Grotesk', sans-serif",
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* ── Header ── */}
        <header style={{
          padding: 'clamp(28px,5vh,52px) clamp(24px,5vw,72px)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'start',
          gap: '0 clamp(16px,2vw,32px)',
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(10px,1.1vw,12px)',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.38)',
            textTransform: 'uppercase',
            paddingTop: '2px',
            whiteSpace: 'nowrap',
          }}>
            hella.rich
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden', paddingTop: '2px' }}>
            <HeaderTicker />
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(9px,0.9vw,11px)',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            paddingTop: '4px',
            whiteSpace: 'nowrap',
          }}>
            1956
          </div>
        </header>

        {/* ── Hero ── */}
        <div style={{ padding: '0 clamp(24px,5vw,72px) clamp(48px,7vh,80px)' }}>
          <h1 style={{
            fontSize: 'clamp(32px,6vw,88px)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            margin: 0,
            maxWidth: '900px',
          }}>
            <HellaRichH1 />
          </h1>

        </div>

        {/* ── View toggle: GALLERY / ARCHIVE ── */}
        <div style={{
          padding: '0 clamp(24px,5vw,72px)',
          display: 'flex', justifyContent: 'flex-end', marginBottom: 'clamp(14px,1.6vw,22px)',
        }}>
          <div role="tablist" aria-label="Catalog view" style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '2px',
            padding: '2px', background: 'rgba(255,255,255,0.02)',
          }}>
            {([['gallery','▦','GALLERY'],['archive','☰','ARCHIVE']] as const).map(([mode, glyph, label]) => {
              const active = view === mode;
              return (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={active}
                  aria-label={label + ' view'}
                  tabIndex={0}
                  onClick={() => switchView(mode)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.85vw,11px)',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    padding: '7px 13px', borderRadius: '1px', border: 'none', cursor: 'pointer',
                    color: active ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.5)',
                    background: active ? 'rgba(255,255,255,0.88)' : 'transparent',
                    transition: 'background 0.22s ease, color 0.22s ease',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1.05em', lineHeight: 1 }}>{glyph}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Products: GALLERY (cards) or ARCHIVE (catalog) ── */}
        <main style={{
          padding: '0 clamp(24px,5vw,72px) clamp(64px,10vh,100px)',
          display: 'flex',
          flexDirection: 'column',
          gap: view === 'archive' ? '0' : 'clamp(3px,0.4vw,6px)',
          opacity: viewSwapping ? 0 : 1,
          transition: 'opacity 0.16s ease',
        }}>
          {view === 'gallery' ? (
          <>
          <ProjectCard slug="radio" title="HELLA_RADIO" tagline="A late-night signal you tune into." cta="Tune In" image={RADIO_CARD} index={1} featured={true} enterDelay={80} />
          <ProjectCard slug="orb" title="ORB" tagline="A living object." cta="Touch It" image={CARD_ORB} index={2} enterDelay={140} />
          <ProjectCard slug="the-eye" title="THE EYE" tagline="A strange object that notices you." cta="Look" image={CARD_THE_EYE} index={3} enterDelay={200} />
          <ProjectCard slug="low-battery" title="LOW BATTERY" tagline="The sound you ignore until it becomes your personality." cta="Begin Ignoring" image={CARD_LOW_BATTERY} index={4} enterDelay={260} />
          <ProjectCard slug="space-drone" title="SPACE DRONE" tagline="A drifting machine for doing absolutely nothing." image={CARD_SPACE_DRONE} index={5} enterDelay={320} />
          <ProjectCard slug="aether" title="ÆTHER" tagline="Impossible to sound bad." image={CARD_AETHER} index={6} enterDelay={380} />
          <ProjectCard slug="dead-air" title="DEAD AIR" tagline="Late night radio scanner." cta="Tune In" image={CARD_DEAD_AIR} index={7} enterDelay={440} />
          <ProjectCard slug="fourcast" title="FOURCAST" tagline="A weather app predicting the end of the world. Politely." cta="Check My Day" image={CARD_FOURCAST} index={8} enterDelay={500} />
          </>
          ) : (
          <div role="list" style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { slug: 'radio',       n: '01', title: 'HELLA_RADIO', desc: 'A late-night signal you tune into.', img: RADIO_CARD },
              { slug: 'orb',         n: '02', title: 'ORB',         desc: 'A living object. Seven moods rendered as sound and color.', img: CARD_ORB },
              { slug: 'the-eye',     n: '03', title: 'THE EYE',     desc: 'A strange object that notices you.', img: CARD_THE_EYE },
              { slug: 'low-battery', n: '04', title: 'LOW BATTERY', desc: 'The sound you ignore until it becomes your personality.', img: CARD_LOW_BATTERY },
              { slug: 'space-drone', n: '05', title: 'SPACE DRONE', desc: 'A drifting machine for doing absolutely nothing.', img: CARD_SPACE_DRONE },
              { slug: 'aether',      n: '06', title: 'ÆTHER',       desc: 'Impossible to sound bad.', img: CARD_AETHER },
              { slug: 'dead-air',    n: '07', title: 'DEAD AIR',    desc: 'Lost transmissions and impossible frequencies.', img: CARD_DEAD_AIR },
              { slug: 'fourcast',    n: '08', title: 'FOURCAST',    desc: 'A weather app predicting the end of the world. Politely.', img: CARD_FOURCAST },
            ].map(p => (
              <ArchiveRow key={p.slug} slug={p.slug} n={p.n} title={p.title} desc={p.desc} img={p.img} />
            ))}
          </div>
          )}

          {/* Cross-awareness overlay — rare terminal message on a card */}
          {awarenessMsg && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 20,
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(8px, 0.8vw, 10px)',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                background: 'rgba(0,0,0,0.55)',
                padding: '6px 12px',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
                animation: 'awarenessIn 0.2s ease forwards',
              }}
            >
              {awarenessMsg.text}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer style={{
          padding: 'clamp(24px,4vh,40px) clamp(24px,5vw,72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => setContactOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(8px,0.85vw,10px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                padding: 0,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
            >
              Contact
            </button>
            <button
              onClick={() => setAboutOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(8px,0.85vw,10px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                padding: 0,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
            >
              About
            </button>
            <button
              onClick={() => setCreditsOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(8px,0.85vw,10px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                padding: 0,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
            >
              Credits
            </button>
            <a
              href="https://github.com/dicanomi"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(8px,0.85vw,10px)',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
            >
              GitHub
            </a>
            {/* Discovery button — random product */}
            <button
              onClick={() => {
                const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
                window.location.href = `/${slug}`;
              }}
              title="Random product"
              aria-label="Discover a random product"
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50%', width: 24, height: 24,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.28)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                transition: 'color 0.2s ease, border-color 0.2s ease',
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              ?
            </button>
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.85vw,10px)',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.12em',
          }}>
            © {new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date())} hella.rich
          </div>
        </footer>
      </div>
    </>
  );
}
