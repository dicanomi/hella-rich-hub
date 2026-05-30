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

// ── Existing Cloudfront card images (from deployed repos) ──────────────────
const CARD_THE_EYE    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/4dGTww6dwDMqWYygdCjBiT/the-eye-card-m8kJtzMhgXq8bTQ7kEpxk6.webp';
const CARD_LOW_BATTERY = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/c8PJjjHRHohroqXKsYYz7X/card-low-battery-b2i2kASdULLNdxF4XMjptc.webp';
const CARD_SPACE_DRONE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/c8PJjjHRHohroqXKsYYz7X/card-space-drone-ZSPMYcoBfZnyXPZaTunNjX.webp';
const CARD_AETHER      = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/jbzZmqNRVq8gZbr6uL7crh/card-aether-dCswxwbBYi2VWJHwFeF2rN.webp';
const CARD_DEAD_AIR    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/9ZxPKGjDMY2C56HR5iUGn8/card-dead-air-Wgkrd7hVm3xLcWTrTUd5hL.webp';
const CARD_ORB         = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/KQMLixAcwLTktWD55tWJwK/card-orb-v2-GA954d4iJrPLDQTUdJE9eS.webp';
const CARD_FOURCAST    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/Y2GqaD9tuJ99Jnnw3Suzuk/fourcast-card-v2-FTNVUNxhCmBWxuJ5wiNteQ.webp';

// ── H1 Typewriter ──────────────────────────────────────────────────────────
const H1_PHRASES = [
  'Hella Rich.\nMega Poor.',
  'Check_Tomorrow',
  'Begin_Transmission',
  'Press_The_Button',
  'My_Finger_Is_On_The_Button',
  'Check_My_Day',
  'Start_The_Beep',
  'Enter_The_Orb',
  'Drone_Forever',
  'Ruin_My_Day',
  'Everything_Is_Fine',
  'Node_1956_Active',
  'We_Expected_You',
];
const TYPE_MS = 52;
const DEL_MS  = 28;
const HOLD_MS = 1800;
const PAUSE_MS = 220;
type TW_Phase = 'typing' | 'holding' | 'deleting' | 'pausing';

function H1TypeWriter() {
  const reduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState(reduced.current ? H1_PHRASES[0] : '');
  const [phase, setPhase] = useState<TW_Phase>(reduced.current ? 'holding' : 'typing');
  const charIdx = useRef(0);
  const full = H1_PHRASES[phraseIdx];

  useEffect(() => {
    if (reduced.current) return;
    if (phase === 'typing') {
      if (charIdx.current < full.length) {
        const t = setTimeout(() => {
          charIdx.current++;
          setDisplayed(full.slice(0, charIdx.current));
        }, TYPE_MS + (Math.random() * 14 - 7));
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('holding'), 80);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'holding') {
      const t = setTimeout(() => setPhase('deleting'), HOLD_MS + Math.random() * 700);
      return () => clearTimeout(t);
    }
    if (phase === 'deleting') {
      if (charIdx.current > 0) {
        const t = setTimeout(() => {
          charIdx.current--;
          setDisplayed(full.slice(0, charIdx.current));
        }, DEL_MS + (Math.random() * 8 - 4));
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('pausing'), PAUSE_MS);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'pausing') {
      const t = setTimeout(() => {
        setPhraseIdx(i => (i + 1) % H1_PHRASES.length);
        setPhase('typing');
      }, PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [phase, displayed, phraseIdx, full]);

  const lines = displayed.split('\n');
  const showCursor = phase === 'typing' || phase === 'holding' || phase === 'deleting';
  return (
    <span className="h1-wrap">
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i === lines.length - 1 && showCursor && (
            <span className="h1-cursor" aria-hidden="true">_</span>
          )}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

// ── About Modal ────────────────────────────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
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
          Made by Dicanomi.
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
          © {new Date().getFullYear()} hella.rich
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
}

function ProjectCard({ slug, title, tagline, image, index, live = true, cta, featured = false, enterDelay = 0 }: ProjectCardProps) {
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
  return <Link href={`/${slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{content}</Link>;
}

// ── Main Landing ───────────────────────────────────────────────────────────
export default function Landing() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <style>{`
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

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
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
            <H1TypeWriter />
          </h1>

        </div>

        {/* ── Cards — all internal routes ── */}
        <main style={{
          padding: '0 clamp(24px,5vw,72px) clamp(64px,10vh,100px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(3px,0.4vw,6px)',
        }}>
          <ProjectCard slug="orb"         title="ORB"         tagline="A living object."                                           cta="Touch It"        image={CARD_ORB}         index={1} featured={true}  enterDelay={80}  />
          <ProjectCard slug="the-eye"     title="THE EYE"     tagline="A strange object that notices you."                         cta="Look"            image={CARD_THE_EYE}     index={2}               enterDelay={140} />
          <ProjectCard slug="low-battery" title="LOW BATTERY" tagline="The sound you ignore until it becomes your personality."    cta="Begin Ignoring"  image={CARD_LOW_BATTERY} index={3}               enterDelay={200} />
          <ProjectCard slug="space-drone" title="SPACE DRONE" tagline="A drifting machine for doing absolutely nothing."                                 image={CARD_SPACE_DRONE} index={4}               enterDelay={260} />
          <ProjectCard slug="aether"      title="ÆTHER"       tagline="Impossible to sound bad."                                                         image={CARD_AETHER}      index={5}               enterDelay={320} />
          <ProjectCard slug="dead-air"    title="DEAD AIR"    tagline="Late night radio scanner."                                  cta="Tune In"         image={CARD_DEAD_AIR}    index={6}               enterDelay={380} />
          <ProjectCard slug="fourcast"    title="FOURCAST"    tagline="A weather app predicting the end of the world. Politely."   cta="Check My Day"    image={CARD_FOURCAST}    index={7}               enterDelay={440} />
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
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.85vw,10px)',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.12em',
          }}>
            © {new Date().getFullYear()} hella.rich
          </div>
        </footer>
      </div>
    </>
  );
}
