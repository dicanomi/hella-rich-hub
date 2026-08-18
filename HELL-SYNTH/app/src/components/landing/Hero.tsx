import { lazy, Suspense, useRef, useState } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getLenis } from '@/lib/lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const WireformCanvas = lazy(() => import('@/components/landing/WireformCanvas'))

/**
 * Landing hero (home.md §2). GSAP load timeline + pinned scroll scrub;
 * Three.js wireform lives in an isolated lazy component.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const [excited, setExcited] = useState(false)

  useGSAP(
    () => {
      const lenis = getLenis()
      if (lenis) lenis.on('scroll', ScrollTrigger.update)

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // ── Load timeline (≤1.6s) ──
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(
        '.hero-eyebrow',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 },
        0.3,
      )
        .fromTo(
          '.hero-line > span',
          { yPercent: 100 },
          { yPercent: 0, duration: 0.7, stagger: 0.12 },
          0.4,
        )
        .fromTo(
          ['.hero-sub', '.hero-ctas'],
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
          1.0,
        )
        .fromTo('.hero-corner', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.3)

      // ── Pinned scroll: headline scales/fades on scrub ──
      if (!reduced) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: '+=100%',
              pin: true,
              scrub: 0.6,
            },
          })
          .to('.hero-type', { scale: 0.94, opacity: 0.2, ease: 'none' }, 0)
      }

      return () => {
        if (lenis) lenis.off('scroll', ScrollTrigger.update)
      }
    },
    { scope: root },
  )

  const scrollToChain = () => {
    const el = document.getElementById('signal-chain')
    const lenis = getLenis()
    if (el && lenis) lenis.scrollTo(el, { offset: -56 })
    else el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={root}
      className="relative flex min-h-[calc(100dvh-56px)] items-center overflow-hidden"
      onMouseEnter={() => setExcited(true)}
      onMouseLeave={() => setExcited(false)}
    >
      {/* wireform canvas (isolated Three.js subtree) */}
      <Suspense fallback={null}>
        <WireformCanvas
          className="absolute inset-0 z-0"
          idleAmp={12}
          exciteAmp={40}
          heightFrac={0.55}
          excited={excited}
        />
      </Suspense>

      {/* type stack */}
      <div className="hero-type relative z-10 w-full px-6 md:w-[60%] md:pl-12 lg:pl-16">
        <p className="hero-eyebrow eyebrow flex items-center gap-2.5 opacity-0">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-magenta shadow-glow-magenta"
            style={{ animation: 'vox-led-pulse 1.2s ease-in-out infinite' }}
          />
          KEYS_IN → SYNTH_OUT
        </p>

        <h1
          className="mt-6 font-display font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-ink-hi"
          style={{ fontSize: 'clamp(56px, 9.5vw, 148px)' }}
        >
          <span className="hero-line block overflow-hidden">
            <span className="block">Twist knobs.</span>
          </span>
          <span className="hero-line block overflow-hidden">
            <span className="block">Make</span>
          </span>
          <span className="hero-line block overflow-hidden">
            <span className="block text-magenta">
              noise<span className="text-cyan">.</span>
            </span>
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-[420px] font-sans text-[15px] leading-relaxed text-ink-mid opacity-0">
          A wavetable synthesizer that lives in your browser. Dual oscillators, a
          Moog-style ladder filter, a 16-step sequencer, USB MIDI. Hit space, play
          your keyboard. Record it. Export a 48 kHz / 32-bit WAV.
        </p>

        <div className="hero-ctas mt-8 flex flex-wrap items-center gap-4 opacity-0">
          <Link
            to="/instrument"
            className="group flex items-center gap-2 rounded-[2px] bg-magenta px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-abyss transition-[filter] duration-150 hover:brightness-110"
          >
            Open the instrument
            <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </Link>
          <button
            type="button"
            onClick={scrollToChain}
            className="rounded-[2px] border border-line-bright px-6 py-4 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-mid transition-colors duration-200 hover:border-ink-mid hover:text-ink-hi"
          >
            How it works
          </button>
        </div>
      </div>

      {/* bottom-left corner */}
      <p className="hero-corner absolute bottom-6 left-6 z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-low opacity-0 md:left-12 lg:left-16">
        No account · 48kHz/32-bit float · MADE IN SOMA SF
      </p>

      {/* bottom-right scroll hint */}
      <div className="hero-corner absolute bottom-6 right-6 z-10 hidden flex-col items-center gap-2 opacity-0 md:flex">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-low"
          style={{ writingMode: 'vertical-rl' }}
        >
          Scroll
        </span>
        <div className="relative h-12 w-px bg-cyan/40">
          <span
            className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan"
            style={{ animation: 'vox-scroll-dot 1.6s ease-in-out infinite' }}
          />
        </div>
      </div>
    </section>
  )
}
