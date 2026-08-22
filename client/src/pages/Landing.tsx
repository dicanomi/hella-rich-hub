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
import { ProductLineSculpture } from '../components/ProductLineSculpture';

// ── Existing Cloudfront card images (from deployed repos) ──────────────────
// ── New unified halftone/pulp sci-fi visual system (2026-06-22) ──────────────
const CARD_THE_EYE    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-the-eye-v4-UDPKDjTrGGFm9r9TmYrcDR.webp';
const CARD_HUMAN_EXE  = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-human-exe-v4-EoZjWPo3vnZDYCHUS4qFWN.webp';
const CARD_LOW_BATTERY = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-low-battery-v4-X3wys3YEYmwMhoMysNAcFn.webp';
const CARD_SPACE_DRONE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-space-drone-v4-6cSZZBhMGxaM4fiPtWGJ2K.webp';
const CARD_AETHER      = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-aether-v4-GKkH8RzMNuRVh2hT4bABGr.webp';
const CARD_DEAD_AIR    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-dead-air-v4-FfS9cpTUNtRWfRr6oyuxkb.webp';
const CARD_ORB         = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-orb-v4-FdVDyW5VeM5NLNJPJJRM6Z.webp';
const CARD_FOURCAST    = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-fourcast-v4-V6r3AdsUgH2RixiRDueELL.webp';
const RADIO_CARD       = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/cfmfimCWRsL5asbWNBo54F/card-radio-v4-76gepMJyY36Pz5dhQ6sZPg.webp';
const CARD_HELLA_FM    = `${import.meta.env.BASE_URL}card-hella-fm-v2.webp`;
const CARD_HELLA_DECK  = `${import.meta.env.BASE_URL}card-hella-deck-v1.png`;
const CARD_HELLA_SYNTH = `${import.meta.env.BASE_URL}card-hella-synth-v1.webp`;
const CARD_HELLA_CONVERT = `${import.meta.env.BASE_URL}card-hella-convert-v1.png`;
const CARD_MARKET_EXE  = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292290338/irIwNEoiIgpyRjrD.png';
const CARD_HAPPY_HUMAN = `${import.meta.env.BASE_URL}card-happy-human-v1.webp`;

const PRODUCT_SURFACES = [
  'HELLA•4',
  'HAPPY HUMAN',
  'HELLA.FM',
  'HELLA_RADIO',
  'HELLA.SYNTH',
  'HELLA CONVERT',
  'THE_MACHINE.EXE',
  'HUMAN.EXE',
  'ORB',
  'DEAD AIR',
  'ÆTHER',
  'SPACE DRONE',
  'LOW BATTERY',
  'FOURCAST',
  'THE EYE',
];

const TECH_STACK_SECTIONS = [
  {
    title: 'Languages + app code',
    items: [
      'TypeScript, JavaScript, TSX, HTML, CSS, JSON, Markdown',
      'Python for production support, asset inspection, conversion, QA, and automation passes',
      'Shell / CLI workflows for local builds, file operations, deploy checks, and verification',
      'React component architecture plus standalone static product bundles',
    ],
  },
  {
    title: 'Hub + product runtime',
    items: [
      'React 19 + TypeScript SPA',
      'Vite 7 production builds',
      'wouter route graph with lazy-loaded product pages',
      'Tailwind CSS v4 + custom CSS systems',
      'Radix UI primitives, lucide-react icons, Sonner, tooltips',
      'Standalone embedded apps for HELLA.FM, HELLA.SYNTH, HELLA•4, HAPPY HUMAN, and HELLA_RADIO',
    ],
  },
  {
    title: 'Interaction + visuals',
    items: [
      'Three.js / WebGL line sculptures and 3D GLB assets',
      'Canvas 2D renderers for games, scopes, visualizers, and motion fields',
      'Framer Motion, GSAP motion thinking, requestAnimationFrame animation loops, and CSS clamp() sizing',
      'Cursor, pointer, keyboard, touch, and reduced-motion handling',
      'localStorage / sessionStorage for state, onboarding, and audio settings',
      'SVG, PNG, WebP, GLB, custom fonts, image optimization, and static asset manifests',
    ],
  },
  {
    title: 'Sound + DSP',
    items: [
      'Tone.js procedural synths, drones, sequences, and effects',
      'Browser DSP: oscillators, filters, envelopes, LFO modulation, FFT/waveform analysers, compression, limiting, waveshaping, delay, reverb, chorus, distortion, and bitcrushing',
      'Raw Web Audio API engines for audio toys, scanners, beeps, and atmospheres',
      '8-bit computer sound, arcade tones, warning beeps, drone beds, pirate radio static, and generated music direction',
      'MIDI-style sequencer logic, probabilistic rhythms, generated noise colors, convolution-style delay networks, and audio unlock handling',
      'Static MP3 station libraries, generated music folders, and manifest JSON',
      'HELLA.FM shareable station URLs and copied station links',
    ],
  },
  {
    title: 'Production tooling',
    items: [
      'pnpm, Node.js, Vite, esbuild, TypeScript, Prettier, and Vitest tooling',
      'Python-assisted media/asset handling where the browser stack was not the right tool',
      'GitHub for versioning, Git, GitHub Actions, Cloudflare/Wrangler checks, and local preview servers',
      'Figma for design direction, layout reference, visual QA, and handoff thinking',
      'Manual visual QA, responsive checks, route checks, build verification, and rollback-safe commits',
    ],
  },
  {
    title: 'Platform + deploy',
    items: [
      'Cloudflare Pages static hosting',
      'Cloudflare Pages Functions for product handoffs and redirects',
      'GitHub main branch auto-deploy workflow',
      'GitHub Pages staging workflow',
      'Formspree contact endpoint',
      'SEO files, sitemap, robots.txt, llms.txt, Open Graph assets, and cache-busted live verification',
    ],
  },
  {
    title: 'AI + creative stack',
    items: [
      'Directed by Jeffrey Willis / Dicanomi',
      'Built with OpenAI GPT / Codex, Manus, Kimi, Claude, Gemini, Higgsfield, Midjourney, GPT Image, Claude Code, Claude Cowork, Nano Banana, and Suno',
      'AI-assisted product writing, interaction design, code generation, debugging, QA, visual direction, image generation, audio/music direction, and launch iteration',
      'Human taste, approvals, rollback calls, and final shipping decisions stayed with the founder',
    ],
  },
];

// ── H1 Message Loop ────────────────────────────────────────────────────────

const HELLA_RICH_MESSAGES = [
  'FOUNDER JEFFREY WILLIS RAISES 700 MILLION FOR HELLA.RICH.',
  'HELLA.RICH CLOTHING LINE LAUNCHES IN SHIBUYA, JAPAN.',
  'THE ORB PASSED ITS BACKGROUND CHECK.',
  'HELLA.FM IS BROADCASTING FROM A LEGALLY UNCLEAR MOON.',
  'LOW BATTERY HAS ENTERED LEADERSHIP.',
  'THE EYE BLINKED FIRST. DOCUMENTATION DISPUTES THIS.',
  'SPACE DRONE FOUND A PURPOSE AND IMMEDIATELY MISPLACED IT.',
  'HELLA•4 IS REWINDING A FUTURE THAT STILL WORKS.',
  'DEAD AIR LEFT A KIND VOICEMAIL FROM THE VOID.',
  'FOURCAST PREDICTS LIGHT DOOM WITH A CHANCE OF GOOD IDEAS.',
  'THE_MACHINE.EXE APPROVED ONE HUMAN FEELING.',
  'HUMAN.EXE FOUND A BUG AND NAMED IT CONFIDENCE.',
  'AETHER IS MAKING THE APOCALYPSE SOUND EXPENSIVE.',
  'HELLA.SYNTH TURNED PANIC INTO A PRESET.',
  'PLEASE REMAIN CALM. THE WEBSITE IS BECOMING A PLACE.',
  'A SMALL INTERNET THING HAS SURVIVED ANOTHER REFRESH.',
  'GOOD NEWS: THE VOID HAS EXCELLENT TASTE.',
];

const HELLA_RICH_WORDMARK = 'hella.rich';

/**
 * HellaRichH1 — the ONLY homepage H1 component
 *
 * One brand mark, with a small rotating system message below it.
 */
function HellaRichH1() {
  const [sysText, setSysText] = useState('');
  const [sysVisible, setSysVisible] = useState(false);
  const [wordmarkPulse, setWordmarkPulse] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastIndex = Math.floor(Math.random() * HELLA_RICH_MESSAGES.length);

    setSysText(HELLA_RICH_MESSAGES[lastIndex]);
    setSysVisible(true);

    if (reduced) return;

    const pickNextMessage = () => {
      let nextIndex = Math.floor(Math.random() * HELLA_RICH_MESSAGES.length);
      if (nextIndex === lastIndex) {
        nextIndex = (nextIndex + 1) % HELLA_RICH_MESSAGES.length;
      }
      lastIndex = nextIndex;
      return HELLA_RICH_MESSAGES[nextIndex];
    };

    let fadeTimer: number | undefined;

    const interval = window.setInterval(() => {
      setSysVisible(false);
      fadeTimer = window.setTimeout(() => {
        setSysText(pickNextMessage());
        setSysVisible(true);
      }, 650);
    }, 4800);

    return () => {
      if (fadeTimer) window.clearTimeout(fadeTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const trigger = () => setWordmarkPulse((pulse) => pulse + 1);
    let timer: number | undefined;

    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        trigger();
        schedule(12000 + Math.random() * 8000);
      }, delay);
    };

    schedule(180);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <span style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.08em',
      position: 'relative',
    }}>
      <span
        aria-label={HELLA_RICH_WORDMARK}
        style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}
      >
        {HELLA_RICH_WORDMARK.split('').map((letter, index) => (
          <span
            key={`${wordmarkPulse}-${index}`}
            aria-hidden="true"
            className="h1-letter"
            style={{
              animationDelay: `${index * 22}ms`,
              minWidth: letter === '.' ? '0.26em' : undefined,
            }}
          >
            {letter}
          </span>
        ))}
      </span>

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
          opacity: sysVisible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'normal',
          textWrap: 'balance',
          minHeight: '1.2em',
        }}
      >
        {sysText}
      </span>
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
              { title: 'HELLA•4', tagline: 'A reel recorder for field takes, cue loops, and tape-touching trouble.', href: '/deck' },
              { title: 'HAPPY HUMAN', tagline: 'A labor archive for jobs that were already politely deleted.', href: '/happy-human' },
              { title: 'HELLA.FM', tagline: 'Preprogrammed local frequencies for the end of normal radio.',    href: '/hella.fm' },
              { title: 'HELLA_RADIO', tagline: 'A late-night signal you tune into.',                           href: '/radio' },
              { title: 'HELLA.SYNTH', tagline: 'A browser-native instrument with a hand-written audio engine.', href: '/synth' },
              { title: 'THE_MACHINE.EXE', tagline: 'The market is the setting. Human psychology is the subject.',  href: '/machine-exe' },
              { title: 'HUMAN.EXE',   tagline: 'A biological diagnostic machine that discovers more than it was designed to find.', href: '/human-exe' },
              { title: 'ORB',         tagline: 'A living object.',                                            href: '/orb' },
              { title: 'DEAD AIR',    tagline: 'Late night radio scanner.',                                   href: '/dead-air' },
              { title: 'ÆTHER',       tagline: 'Impossible to sound bad.',                                    href: '/aether' },
              { title: 'SPACE DRONE', tagline: 'A drifting machine for doing absolutely nothing.',            href: '/space-drone' },
              { title: 'LOW BATTERY', tagline: 'The sound you ignore until it becomes your personality.',     href: '/low-battery' },
              { title: 'FOURCAST',    tagline: 'A weather app predicting the end of the world. Politely.',    href: '/fourcast' },
              { title: 'THE EYE',     tagline: 'A strange object that notices you.',                          href: '/the-eye' },
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
                <span style={{
                  fontFamily: p.href === '/happy-human' ? "'TAY Hells', 'Georgia', serif" : p.href === '/deck' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : "'DM Mono', monospace",
                  fontSize: p.href === '/happy-human' ? 'clamp(14px,1.6vw,19px)' : p.href === '/deck' ? 'clamp(13px,1.5vw,18px)' : 'clamp(9px,0.9vw,11px)',
                  fontWeight: p.href === '/deck' ? 200 : undefined,
                  letterSpacing: p.href === '/happy-human' ? '0.04em' : p.href === '/deck' ? '0.16em' : '0.16em',
                  color: 'rgba(255,255,255,0.75)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>{p.title}</span>
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

// ── Build Info Modal ───────────────────────────────────────────────────────
function BuildInfoModal({ onClose }: { onClose: () => void }) {
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
          maxWidth: '640px',
          cursor: 'default',
          padding: 'clamp(48px, 8vh, 80px) clamp(28px, 6vw, 72px)',
        }}
        onClick={e => e.stopPropagation()}
      >
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

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '28px' }}>system receipt</div>

        <section style={{ marginBottom: '44px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '14px' }}>What it took</div>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(21px,2.8vw,34px)',
            color: 'rgba(255,255,255,0.88)',
            fontWeight: 300,
            lineHeight: 1.2,
            margin: 0,
            maxWidth: '520px',
          }}>
            A small product lab made of web apps, audio machines, strange interfaces, static media, and AI-assisted shipping loops.
          </p>
        </section>

        <section style={{ marginBottom: '42px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '16px' }}>Product surface</div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              maxWidth: '520px',
            }}
          >
            {PRODUCT_SURFACES.map((item) => (
              <span
                key={item}
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '999px',
                  padding: '7px 10px',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'clamp(8px,0.85vw,10px)',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.54)',
                  textTransform: 'uppercase',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {TECH_STACK_SECTIONS.map((section) => (
          <section key={section.title} style={{ marginBottom: '38px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: '14px' }}>{section.title}</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {section.items.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ color: 'rgba(255,84,73,0.82)', fontFamily: "'DM Mono', monospace", fontSize: '10px' }}>+</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(10px,1vw,12px)', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.68)', textTransform: 'uppercase', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ── HELLA.FM listeners tag ─────────────────────────────────────────────────
function getHellaFmAudienceTarget() {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const dayProgress = hour + minute / 60;

  const peak = (center: number, width: number, strength: number) => {
    const distance = Math.abs(dayProgress - center);
    return Math.max(0, 1 - distance / width) * strength;
  };

  const peakSignal =
    peak(9, 2.3, 0.82) +
    peak(12, 2.2, 1) +
    peak(17, 2.8, 0.92);
  const graveyardDrop = peak(4, 2.4, 1);

  if (graveyardDrop > 0.72) return 1000 + Math.floor(Math.random() * 4200);

  const normalized = Math.min(1, peakSignal);
  const floor = 42000 + Math.floor(Math.random() * 38000);
  const ceiling = 1850000 + Math.floor(Math.random() * 720000);
  const audience = floor + Math.pow(normalized, 1.7) * (ceiling - floor);

  return Math.max(1000, Math.round(audience));
}

function formatListeners(value: number) {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
}

function HellaFmListenersTag({ compact = false }: { compact?: boolean }) {
  const [listeners, setListeners] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const target = getHellaFmAudienceTarget();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setListeners(target);
      return;
    }

    let current = 0;
    let timer: number | undefined;
    let pulseTimer: number | undefined;

    const tick = () => {
      const booting = current < target * 0.94;
      const hold = !booting && Math.random() < 0.2;
      const driftLimit = Math.max(12, target * 0.015);
      const shouldRise = booting || current <= target - driftLimit || Math.random() < 0.54;
      const jump = booting
        ? Math.max(1, Math.ceil((target - current) * (0.2 + Math.random() * 0.28)))
        : Math.ceil(target * (0.004 + Math.random() * 0.01));
      const drop = Math.ceil(target * (0.002 + Math.random() * 0.004));
      const next = hold
        ? current
        : Math.max(0, Math.min(target + driftLimit, current + (shouldRise ? jump : -drop)));
      current = next;
      setListeners(Math.round(next));
      if (!hold) {
        if (pulseTimer) window.clearTimeout(pulseTimer);
        setPulse(true);
        pulseTimer = window.setTimeout(() => setPulse(false), 260);
      }
      const delay = hold
        ? 1000 + Math.random() * 1100
        : booting
          ? 80 + Math.random() * 110
          : shouldRise
            ? 180 + Math.random() * 360
          : 620 + Math.random() * 700;
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 80);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, []);

  const listenerLabel = formatListeners(listeners);

  return (
    <span
      aria-label={`${listenerLabel} listeners`}
      className={pulse ? 'listeners-tag listeners-tag--pulse' : 'listeners-tag'}
      style={{
        position: 'absolute',
        top: compact ? 3 : 'clamp(14px,2vw,22px)',
        right: 0,
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: compact ? 2 : 5,
        padding: compact ? '1px 3px 1px 4px' : '4px 8px 4px 10px',
        width: compact ? 38 : 'clamp(128px,10.2vw,148px)',
        boxSizing: 'border-box',
        background: '#a51d1d',
        border: '1px solid rgba(255,140,105,0.12)',
        borderRadius: 0,
        boxShadow: '0 0 18px rgba(165,29,29,0.22)',
        pointerEvents: 'none',
        userSelect: 'none',
        transformOrigin: '100% 0',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: compact ? 8 : 'clamp(16px,1.8vw,22px)',
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: 0,
        color: '#e5a16f',
        fontVariantNumeric: 'tabular-nums',
        minWidth: compact ? 30 : '58px',
      }}>
        {listenerLabel}
      </span>
      {!compact && (
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(6px,0.7vw,8px)',
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(229,161,111,0.58)',
          textTransform: 'uppercase',
        }}>
          listeners
        </span>
      )}
    </span>
  );
}

function HappyHumanHiringTag({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-label="Hiring now"
      style={{
        position: 'absolute',
        top: compact ? 3 : 'clamp(14px,2vw,22px)',
        right: 0,
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '2px 4px' : '5px 10px',
        width: compact ? 38 : 'clamp(112px,8.5vw,124px)',
        boxSizing: 'border-box',
        background: '#d8cfbc',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 0,
        boxShadow: '0 0 18px rgba(216,207,188,0.12)',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: compact ? 6 : 'clamp(8px,0.75vw,10px)',
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: compact ? '0.05em' : '0.16em',
        color: '#16110d',
        textTransform: 'uppercase',
      }}>
        {compact ? 'HIRING' : 'HIRING NOW'}
      </span>
    </span>
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
  mediaMode?: 'image' | 'line';
}

function ProjectCard({ slug, title, tagline, image, index, live = true, cta, featured = false, enterDelay = 0, externalHref, mediaMode = 'image' }: ProjectCardProps) {
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
    slug === 'hella.fm'    ? "'DM Mono', 'Space Mono', monospace" :
    slug === 'deck'        ? "'Helvetica Neue', Helvetica, Arial, sans-serif" :
    slug === 'radio'       ? "'TAY Birdie', 'Space Mono', monospace" :
    slug === 'happy-human' ? "'TAY Hells', 'Georgia', serif" :
    slug === 'tools/convert' ? "'Abismo Sangriento', 'DM Mono', monospace" :
    slug === 'human-exe'   ? "'Courier New', 'Lucida Console', monospace" :
    slug === 'machine-exe' ? "'Share Tech Mono', 'DM Mono', 'Courier New', monospace" :
    "'Space Grotesk', sans-serif";

  const titleSize =
    slug === 'space-drone' ? 'clamp(22px, 3.5vw, 48px)' :
    slug === 'aether'      ? 'clamp(24px, 4vw, 56px)' :
    slug === 'dead-air'    ? 'clamp(22px, 3.5vw, 48px)' :
    slug === 'orb'         ? 'clamp(28px, 5vw, 72px)' :
    slug === 'fourcast'    ? 'clamp(14px, 2.4vw, 32px)' :
    slug === 'the-eye'     ? 'clamp(24px, 4.5vw, 64px)' :
    slug === 'low-battery'  ? 'clamp(28px, 4.5vw, 64px)' :
    slug === 'happy-human' ? 'clamp(30px, 4.8vw, 68px)' :
    slug === 'tools/convert' ? 'clamp(44px, 7.5vw, 116px)' :
    slug === 'deck'        ? 'clamp(30px, 4.6vw, 66px)' :
    'clamp(22px, 3.5vw, 48px)';

  const titleWeight =
    slug === 'space-drone' ? 700 :
    slug === 'aether'      ? 500 :
    slug === 'dead-air'    ? 300 :
    slug === 'orb'         ? 300 :
    slug === 'the-eye'     ? 300 :
    slug === 'happy-human' ? 400 :
    slug === 'tools/convert' ? 400 :
    slug === 'deck'        ? 200 :
    400;

  const titleTracking =
    slug === 'space-drone' ? '0.18em' :
    slug === 'aether'      ? '0.15em' :
    slug === 'dead-air'    ? '0.45em' :
    slug === 'orb'         ? '0.55em' :
    slug === 'fourcast'    ? '0.04em' :
    slug === 'the-eye'     ? '0.45em' :
    slug === 'happy-human' ? '0.06em' :
    slug === 'tools/convert' ? '0' :
    slug === 'deck'        ? '0.16em' :
    '0.12em';

  const cardHeight = featured
    ? 'clamp(360px, 52vw, 720px)'
    : 'clamp(260px, 34vw, 480px)';

  const content = (
    <div
      style={{
        position: 'relative',
        height: cardHeight,
        borderRadius: '0',
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
          ? `0 8px 48px rgba(0,0,0,0.7)`
          : `0 2px 16px rgba(0,0,0,0.5)`,
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
        transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.32s ease',
        willChange: 'transform',
        opacity: mediaMode === 'image' ? 1 : 0,
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

      {/* 3D line sculpture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(0,0,0,0.1) 34%, rgba(0,0,0,0.64) 100%)',
        opacity: mediaMode === 'line' ? 1 : 0,
        transition: 'opacity 0.32s ease',
        pointerEvents: 'none',
      }}>
        <ProductLineSculpture slug={slug} active={mediaMode === 'line'} hovered={hovered} />
      </div>

      {slug === 'hella.fm' && <HellaFmListenersTag />}
      {slug === 'happy-human' && <HappyHumanHiringTag />}

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
      {slug !== 'hella.fm' && (
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
      )}

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
  'happy-human': ['HUMAN.EXE FILED AN APPEAL.', 'THE_MACHINE.EXE APPROVED THE LAYOFF.', 'FOURCAST PREDICTED THIS.'],
  'hella.fm':    ['HELLA_RADIO DETECTED A LOCAL SIGNAL.', 'DEAD AIR IS KEEPING TIME.', 'THE STATION REMEMBERS THE ROOM.'],
  'deck':        ['HELLA.FM SENT A FIELD TAKE.', 'THE TAPE IS STILL WARM.', 'A CUE IS WAITING ON THE REEL.'],
  'synth':       ['AETHER HEARD A NEW OSCILLATOR.', 'THE SIGNAL CHAIN IS ARMED.', 'HUMAN MODULATION DETECTED.'],
  'tools/convert': ['THE IMAGE CHANGED ITS NAME.', 'THE FORMAT MACHINE IS READY.', 'NO PAYMENT STEP DETECTED.'],
};

const PRODUCT_SLUGS = ['deck', 'hella.fm', 'synth', 'tools/convert', 'happy-human', 'orb', 'the-eye', 'low-battery', 'space-drone', 'aether', 'dead-air', 'fourcast', 'machine-exe'];

// ── Main Landing ───────────────────────────────────────────────────────────
// ── FeaturedCard — large showcase card (premium curated browsing) ─────────────
function FeaturedCard({ slug, title, desc, img, mediaMode = 'image' }: { slug: string; title: string; desc: string; img: string; mediaMode?: 'image' | 'line' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={'/' + slug}
      aria-label={title + ' — ' + desc}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        textDecoration: 'none',
        border: '1px solid rgba(255,255,255,0.08)',
        borderColor: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
        borderRadius: '3px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.015)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.23,1,0.32,1), border-color 0.25s ease',
        cursor: 'pointer',
      }}
    >
      {/* image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#0d0c0b' }}>
        <img
          src={img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            opacity: mediaMode === 'image' ? (hovered ? 1 : 0.92) : 0,
            transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.3s ease',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: mediaMode === 'line' ? 1 : 0,
          transition: 'opacity 0.32s ease',
          background: 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.075), rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.72) 100%)',
          pointerEvents: 'none',
        }}>
          <ProductLineSculpture slug={slug} active={mediaMode === 'line'} hovered={hovered} />
        </div>
        {slug === 'hella.fm' && <HellaFmListenersTag />}
        {slug === 'happy-human' && <HappyHumanHiringTag />}
      </div>

      {/* content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: 'clamp(18px,1.8vw,26px)' }}>
        <span style={{
          fontFamily: slug === 'happy-human' ? "'TAY Hells', 'Georgia', serif" : slug === 'deck' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : "'DM Mono', monospace",
          fontSize: 'clamp(15px,1.5vw,20px)',
          fontWeight: slug === 'deck' ? 200 : undefined,
          letterSpacing: slug === 'happy-human' ? '0.04em' : slug === 'deck' ? '0.16em' : '0.12em',
          textTransform: 'uppercase',
          color: hovered ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)',
          transition: 'color 0.2s ease',
        }}>{title}</span>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(13px,1.05vw,15px)',
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.45)',
          minHeight: '2.8em',
        }}>{desc}</span>
        <span style={{
          marginTop: '6px',
          alignSelf: 'flex-start',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px,0.85vw,11px)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          borderBottom: '1px solid',
          borderColor: hovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
          paddingBottom: '3px',
          transition: 'color 0.2s ease, border-color 0.2s ease',
        }}>Launch →</span>
      </div>
    </Link>
  );
}

// ── FeaturedPlaceholder — blank black card to fill the featured grid's last row ──
function FeaturedPlaceholder() {
  return (
    <div className="hr-featured-placeholder" aria-hidden="true">
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(9px,0.85vw,11px)',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.30)',
      }}>◫ &nbsp;MORE SOON</span>
    </div>
  );
}

// ── ArchiveRow — catalog list item (digital archive / OS index feel) ──────────
function ArchiveRow({ slug, n, title, desc, img, mediaMode = 'image' }: { slug: string; n: string; title: string; desc: string; img: string; mediaMode?: 'image' | 'line' }) {
  const [hovered, setHovered] = useState(false);
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
      <span style={{
        position: 'relative',
        width: 'clamp(56px,8vw,84px)',
        height: 'clamp(40px,5.5vw,56px)',
        borderRadius: '2px',
        border: '1px solid rgba(255,255,255,0.1)',
        alignSelf: 'center',
        overflow: 'hidden',
        display: 'block',
        background: '#0d0c0b',
      }}>
        <img
          src={img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: mediaMode === 'image' ? (hovered ? 1 : 0.82) : 0,
            transition: 'opacity 0.22s ease',
            display: 'block',
          }}
        />
        <span style={{
          position: 'absolute',
          inset: 0,
          opacity: mediaMode === 'line' ? 1 : 0,
          transition: 'opacity 0.22s ease',
          background: 'rgba(0,0,0,0.58)',
        }}>
          <ProductLineSculpture slug={slug} active={mediaMode === 'line'} hovered={hovered} />
        </span>
        {slug === 'hella.fm' && <HellaFmListenersTag compact />}
        {slug === 'happy-human' && <HappyHumanHiringTag compact />}
      </span>

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
          fontFamily: slug === 'happy-human' ? "'TAY Hells', 'Georgia', serif" : slug === 'deck' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : "'DM Mono', monospace",
          fontSize: 'clamp(13px,1.5vw,18px)',
          fontWeight: slug === 'deck' ? 200 : undefined,
          letterSpacing: slug === 'happy-human' ? '0.04em' : slug === 'deck' ? '0.16em' : '0.14em',
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
  const [buildInfoOpen, setBuildInfoOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [awarenessMsg, setAwarenessMsg] = useState<{slug: string; text: string} | null>(null);

  // ── View mode: 'featured' (grid) | 'gallery' (stacked cards) | 'archive' (list) ──
  const [view, setView] = useState<'gallery' | 'featured' | 'archive'>('featured');
  const [mediaMode, setMediaMode] = useState<'image' | 'line'>('line');
  const [viewSwapping, setViewSwapping] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hella_view_v2');
      if (saved === 'archive' || saved === 'gallery' || saved === 'featured') setView(saved);
      const savedMedia = localStorage.getItem('hella_card_media_v1');
      if (savedMedia === 'image' || savedMedia === 'line') setMediaMode(savedMedia);
    } catch (e) { /* ignore */ }
  }, []);
  const switchView = (next: 'gallery' | 'featured' | 'archive') => {
    if (next === view) return;
    try { localStorage.setItem('hella_view_v2', next); } catch (e) {}
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setView(next); return; }
    setViewSwapping(true);
    setTimeout(() => { setView(next); setViewSwapping(false); }, 160);
  };
  const switchMediaMode = () => {
    const next = mediaMode === 'line' ? 'image' : 'line';
    setMediaMode(next);
    try { localStorage.setItem('hella_card_media_v1', next); } catch (e) {}
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
        @font-face {
          font-family: 'TAY Hells';
          src: url('${import.meta.env.BASE_URL}happy-human-app/TAYHellsAngles.woff2') format('woff2');
          font-display: swap;
        }
        @font-face {
          font-family: 'Abismo Sangriento';
          src: url('${import.meta.env.BASE_URL}fonts/AbismoSangriento-Regular.otf') format('opentype');
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
        @keyframes h1LetterWake {
          0% {
            opacity: 0.54;
            transform: translateY(0.08em);
            filter: brightness(0.7);
          }
          58% {
            opacity: 1;
            transform: translateY(-0.015em);
            filter: brightness(1.16);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: brightness(1);
          }
        }
        .h1-letter {
          display: inline-block;
          will-change: transform, opacity, filter;
          animation: h1LetterWake 0.46s cubic-bezier(0.23,1,0.32,1) both;
        }
        .h1-cursor {
          font-weight: 300;
          color: rgba(255,255,255,0.55);
          animation: h1CursorBlink 0.55s steps(1) infinite;
          margin-left: 0.04em;
        }
        .listeners-tag {
          transition: transform 0.28s cubic-bezier(0.23,1,0.32,1), filter 0.28s ease, box-shadow 0.28s ease;
        }
        .listeners-tag--pulse {
          transform: scale(1.035);
          filter: brightness(1.16);
          box-shadow: 0 0 24px rgba(165,29,29,0.38);
        }
      `}</style>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} onOpenCredits={() => setCreditsOpen(true)} />}
      {buildInfoOpen && <BuildInfoModal onClose={() => setBuildInfoOpen(false)} />}
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

        {/* ── Media + View toggles ── */}
        <div style={{
          padding: '0 clamp(24px,5vw,72px)',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: 'clamp(14px,1.6vw,22px)',
        }}>
          <button
            type="button"
            onClick={switchMediaMode}
            aria-label={mediaMode === 'line' ? 'Show product images' : 'Show 3D line sculptures'}
            aria-pressed={mediaMode === 'line'}
            title={mediaMode === 'line' ? 'Show product images' : 'Show 3D line sculptures'}
            style={{
              width: 42,
              height: 22,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.24)',
              background: mediaMode === 'line' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.015)',
              padding: 2,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: mediaMode === 'line' ? 'flex-end' : 'flex-start',
              transition: 'background 0.24s ease, border-color 0.24s ease',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: mediaMode === 'line' ? '#f4f0e8' : 'rgba(255,255,255,0.42)',
                boxShadow: mediaMode === 'line'
                  ? '0 0 12px rgba(45,253,255,0.45), -3px 0 7px rgba(255,48,79,0.42)'
                  : 'none',
                transition: 'background 0.24s ease, box-shadow 0.24s ease',
              }}
            />
          </button>
          <div role="tablist" aria-label="Catalog view" style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '2px',
            padding: '2px', background: 'rgba(255,255,255,0.02)',
          }}>
            {([['featured','▦','GRID'],['gallery','◫','STACKED'],['archive','☰','LIST']] as const).map(([mode, glyph, label]) => {
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
                    color: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                    background: 'transparent',
                    boxShadow: 'none',
                    transition: 'background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease',
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

        {/* ── Products: GRID, STACKED cards, or LIST ── */}
        <main style={{
          padding: '0 clamp(24px,5vw,72px) clamp(64px,10vh,100px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          opacity: viewSwapping ? 0 : 1,
          transition: 'opacity 0.16s ease',
        }}>
          {view === 'gallery' ? (
          <>
          <ProjectCard slug="deck" title="HELLA•4" tagline="A reel recorder for field takes, cue loops, and tape-touching trouble." cta="Record" image={CARD_HELLA_DECK} index={1} enterDelay={80} mediaMode={mediaMode} />
          <ProjectCard slug="hella.fm"   title="HELLA.FM"    tagline="Preprogrammed local frequencies for the end of normal radio." cta="Tune In" image={CARD_HELLA_FM}    index={2} enterDelay={140} mediaMode={mediaMode} />
          <ProjectCard slug="synth" title="HELLA.SYNTH" tagline="A browser-native instrument with a hand-written audio engine." cta="Play" image={CARD_HELLA_SYNTH} index={3} enterDelay={200} mediaMode={mediaMode} />
          <ProjectCard slug="tools/convert" title="HELLA CONVERT" tagline="Convert image files in your browser. No account, no payment step." cta="Convert" image={CARD_HELLA_CONVERT} index={4} enterDelay={260} mediaMode={mediaMode} />
          <ProjectCard slug="happy-human" title="HAPPY HUMAN" tagline="A labor archive for jobs that were already politely deleted." cta="Apply" image={CARD_HAPPY_HUMAN} index={5} enterDelay={320} mediaMode={mediaMode} />
          <ProjectCard slug="radio"      title="HELLA_RADIO" tagline="A late-night signal you tune into." cta="Tune In" image={RADIO_CARD}       index={6} enterDelay={380} mediaMode={mediaMode} />
          <ProjectCard slug="machine-exe" title="THE_MACHINE.EXE"  tagline="The market is the setting. Human psychology is the subject." cta="Trade" image={CARD_MARKET_EXE} index={7} enterDelay={440} mediaMode={mediaMode} />
          <ProjectCard slug="human-exe"  title="HUMAN.EXE"   tagline="Human Diagnostic Machine" cta="ENTER" image={CARD_HUMAN_EXE}  index={8} enterDelay={500} mediaMode={mediaMode} />
          <ProjectCard slug="orb"        title="ORB"         tagline="A living object." cta="Touch It" image={CARD_ORB}          index={9} enterDelay={560} mediaMode={mediaMode} />
          <ProjectCard slug="dead-air"   title="DEAD AIR"    tagline="Late night radio scanner." cta="Tune In" image={CARD_DEAD_AIR}   index={10} enterDelay={620} mediaMode={mediaMode} />
          <ProjectCard slug="aether"     title="ÆTHER"       tagline="Impossible to sound bad." image={CARD_AETHER}      index={11} enterDelay={680} mediaMode={mediaMode} />
          <ProjectCard slug="space-drone" title="SPACE DRONE" tagline="A drifting machine for doing absolutely nothing." image={CARD_SPACE_DRONE} index={12} enterDelay={740} mediaMode={mediaMode} />
          <ProjectCard slug="low-battery" title="LOW BATTERY" tagline="The sound you ignore until it becomes your personality." cta="Begin Ignoring" image={CARD_LOW_BATTERY} index={13} enterDelay={800} mediaMode={mediaMode} />
          <ProjectCard slug="fourcast"   title="FOURCAST"    tagline="A weather app predicting the end of the world. Politely." cta="Check My Day" image={CARD_FOURCAST}   index={14} enterDelay={860} mediaMode={mediaMode} />
          <ProjectCard slug="the-eye"    title="THE EYE"     tagline="A strange object that notices you." cta="Look" image={CARD_THE_EYE}    index={15} enterDelay={920} mediaMode={mediaMode} />
          </>
          ) : view === 'featured' ? (
          <div className="hr-featured-grid">
            {[
              { slug: 'deck', title: 'HELLA•4', desc: 'A reel recorder for field takes, cue loops, and tape-touching trouble.', img: CARD_HELLA_DECK },
              { slug: 'hella.fm',    title: 'HELLA.FM', desc: 'Preprogrammed local frequencies for the end of normal radio.', img: CARD_HELLA_FM },
              { slug: 'synth', title: 'HELLA.SYNTH', desc: 'A browser-native instrument with a hand-written audio engine.', img: CARD_HELLA_SYNTH },
              { slug: 'tools/convert', title: 'HELLA CONVERT', desc: 'Convert image files in your browser. No account, no payment step.', img: CARD_HELLA_CONVERT },
              { slug: 'happy-human', title: 'HAPPY HUMAN', desc: 'A labor archive for jobs that were already politely deleted.', img: CARD_HAPPY_HUMAN },
              { slug: 'radio',       title: 'HELLA_RADIO', desc: 'A late-night signal you tune into.', img: RADIO_CARD },
              { slug: 'machine-exe',  title: 'THE_MACHINE.EXE',  desc: 'The market is the setting. Human psychology is the subject.', img: CARD_MARKET_EXE },
              { slug: 'human-exe',   title: 'HUMAN.EXE',   desc: 'Human Diagnostic Machine. The machine discovers more than it was designed to find.', img: CARD_HUMAN_EXE },
              { slug: 'orb',         title: 'ORB',         desc: 'A living object. Seven moods rendered as sound and color.', img: CARD_ORB },
              { slug: 'dead-air',    title: 'DEAD AIR',    desc: 'Lost transmissions and impossible frequencies.', img: CARD_DEAD_AIR },
              { slug: 'aether',      title: 'ÆTHER',       desc: 'Impossible to sound bad.', img: CARD_AETHER },
              { slug: 'space-drone', title: 'SPACE DRONE', desc: 'A drifting machine for doing absolutely nothing.', img: CARD_SPACE_DRONE },
              { slug: 'low-battery', title: 'LOW BATTERY', desc: 'The sound you ignore until it becomes your personality.', img: CARD_LOW_BATTERY },
              { slug: 'fourcast',    title: 'FOURCAST',    desc: 'A weather app predicting the end of the world. Politely.', img: CARD_FOURCAST },
              { slug: 'the-eye',     title: 'THE EYE',     desc: 'A strange object that notices you.', img: CARD_THE_EYE },
            ].map(p => (
              <FeaturedCard key={p.slug} slug={p.slug} title={p.title} desc={p.desc} img={p.img} mediaMode={mediaMode} />
            ))}
            {/* Blank cards fill the last row so the featured view doesn't look empty at the bottom */}
            <FeaturedPlaceholder />
          </div>
          ) : (
          <div role="list" style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { slug: 'deck',        n: '01', title: 'HELLA•4',  desc: 'A reel recorder for field takes, cue loops, and tape-touching trouble.', img: CARD_HELLA_DECK },
              { slug: 'hella.fm',    n: '02', title: 'HELLA.FM',    desc: 'Preprogrammed local frequencies for the end of normal radio.', img: CARD_HELLA_FM },
              { slug: 'synth', n: '03', title: 'HELLA.SYNTH', desc: 'A browser-native instrument with a hand-written audio engine.', img: CARD_HELLA_SYNTH },
              { slug: 'tools/convert', n: '04', title: 'HELLA CONVERT', desc: 'Convert image files in your browser. No account, no payment step.', img: CARD_HELLA_CONVERT },
              { slug: 'happy-human', n: '05', title: 'HAPPY HUMAN', desc: 'A labor archive for jobs that were already politely deleted.', img: CARD_HAPPY_HUMAN },
              { slug: 'radio',       n: '06', title: 'HELLA_RADIO', desc: 'A late-night signal you tune into.', img: RADIO_CARD },
              { slug: 'machine-exe',  n: '07', title: 'THE_MACHINE.EXE',  desc: 'The market is the setting. Human psychology is the subject.', img: CARD_MARKET_EXE },
              { slug: 'human-exe',   n: '08', title: 'HUMAN.EXE',   desc: 'Human Diagnostic Machine. The machine discovers more than it was designed to find.', img: CARD_HUMAN_EXE },
              { slug: 'orb',         n: '09', title: 'ORB',         desc: 'A living object. Seven moods rendered as sound and color.', img: CARD_ORB },
              { slug: 'dead-air',    n: '10', title: 'DEAD AIR',    desc: 'Lost transmissions and impossible frequencies.', img: CARD_DEAD_AIR },
              { slug: 'aether',      n: '11', title: 'ÆTHER',       desc: 'Impossible to sound bad.', img: CARD_AETHER },
              { slug: 'space-drone', n: '12', title: 'SPACE DRONE', desc: 'A drifting machine for doing absolutely nothing.', img: CARD_SPACE_DRONE },
              { slug: 'low-battery', n: '13', title: 'LOW BATTERY', desc: 'The sound you ignore until it becomes your personality.', img: CARD_LOW_BATTERY },
              { slug: 'fourcast',    n: '14', title: 'FOURCAST',    desc: 'A weather app predicting the end of the world. Politely.', img: CARD_FOURCAST },
              { slug: 'the-eye',     n: '15', title: 'THE EYE',     desc: 'A strange object that notices you.', img: CARD_THE_EYE },
            ].map(p => (
              <ArchiveRow key={p.slug} slug={p.slug} n={p.n} title={p.title} desc={p.desc} img={p.img} mediaMode={mediaMode} />
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
              onClick={() => setBuildInfoOpen(true)}
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
              Stack
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
