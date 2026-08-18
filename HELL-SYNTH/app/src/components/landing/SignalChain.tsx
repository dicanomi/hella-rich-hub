import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  MicScope,
  NoteReadout,
  WavetableMorph,
  FilterSweep,
  RoutingLines,
  WavExport,
} from '@/components/landing/StepVisuals'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Step {
  n: string
  title: string
  body: string
  focus: string
  image?: string
  visual: React.ReactNode
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'KEYS',
    body: 'QWERTY, the on-screen piano, or a USB MIDI keyboard. Every note lands instantly.',
    focus: 'seq',
    visual: <MicScope />,
  },
  {
    n: '02',
    title: 'STEP SEQUENCER',
    body: '16 steps of pitch and gate, locked to the master clock. Space runs it.',
    focus: 'seq',
    visual: <NoteReadout />,
  },
  {
    n: '03',
    title: 'OSCILLATORS',
    body: 'Dual wavetables + sub + noise. Serum-grade morphing.',
    focus: 'osc',
    visual: <WavetableMorph />,
  },
  {
    n: '04',
    title: 'LADDER FILTER',
    body: 'A Moog-style 4-pole with drive that snarls.',
    focus: 'filter',
    visual: <FilterSweep />,
  },
  {
    n: '05',
    title: 'MOD MATRIX',
    body: 'Envelopes, LFOs, velocity, mod wheel — patch anything to anything.',
    focus: 'mod',
    image: '/chain-machine.jpg',
    visual: <RoutingLines />,
  },
  {
    n: '06',
    title: 'WAV EXPORT',
    body: 'Record the performance. Master-ready resolution.',
    focus: 'rec',
    visual: <WavExport />,
  },
]

/**
 * The Signal Chain (home.md §4) — 400vh pinned scroll story. Scroll progress
 * cycles six step cards on the right stage; sticky text column + counter left.
 */
export default function SignalChain() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: '.chain-pin',
        scrub: 0.2,
        onUpdate: (self) => {
          const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
          setActive((prev) => (prev === idx ? prev : idx))
          gsap.set('.chain-signal-line', { scaleX: (idx + 1) / STEPS.length })
        },
      })
    },
    { scope: root },
  )

  return (
    <section id="signal-chain" ref={root} className="relative bg-abyss" style={{ height: '400vh' }}>
      <div className="chain-pin flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-6 md:grid-cols-[35%_65%]">
          {/* sticky text column */}
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-cyan">THE_SIGNAL_CHAIN.EXE</p>
            <h2
              className="mt-4 font-display font-extrabold tracking-[-0.02em] text-ink-hi"
              style={{ fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1 }}
            >
              From keys to WAV.
            </h2>
            <p className="mt-5 max-w-[320px] font-sans text-[14px] leading-relaxed text-ink-mid">
              Every stage is a module you can touch. Nothing is hidden, nothing
              leaves your machine.
            </p>
            <p className="mt-10 font-mono leading-none">
              <span key={active} className="inline-block text-[48px] text-magenta">
                {String(active + 1).padStart(2, '0')}
              </span>
              <span className="text-[20px] text-ink-low">/06</span>
            </p>
          </div>

          {/* stage */}
          <div className="relative hidden h-[420px] items-center justify-center md:flex">
            {/* signal line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-line-hair">
              <div
                className="chain-signal-line h-full origin-left bg-cyan"
                style={{ transform: 'scaleX(0.166)', transition: 'transform 300ms ease, filter 300ms ease', filter: 'drop-shadow(0 0 4px rgba(0,229,199,0.6))' }}
              />
            </div>

            {STEPS.map((step, i) => {
              const off = i - active
              const style: React.CSSProperties =
                off === 0
                  ? { transform: 'translateY(0) rotate(0deg)', opacity: 1, zIndex: 10 }
                  : off > 0
                    ? { transform: 'translateY(120px) rotate(1.5deg)', opacity: 0, zIndex: 0 }
                    : { transform: 'translateY(-120px) rotate(0deg)', opacity: 0, zIndex: 0 }
              return (
                <button
                  key={step.n}
                  type="button"
                  onClick={() => navigate(`/instrument?focus=${step.focus}`)}
                  className="absolute w-[480px] max-w-full cursor-pointer rounded-[4px] border border-line-hair bg-panel p-6 text-left transition-all duration-300 ease-out-expo hover:border-line-bright"
                  style={style}
                  tabIndex={off === 0 ? 0 : -1}
                  aria-hidden={off !== 0}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[11px] text-ink-low">{step.n}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-low">
                      OPEN ↗
                    </span>
                  </div>
                  {step.image && (
                    <div className="mt-4 h-[120px] overflow-hidden rounded-[2px]">
                      <img src={step.image} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <h3 className="mt-4 font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-ink-hi">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 font-sans text-[13px] leading-snug text-ink-mid">
                    {step.body}
                  </p>
                  <div className="mt-4">{step.visual}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
