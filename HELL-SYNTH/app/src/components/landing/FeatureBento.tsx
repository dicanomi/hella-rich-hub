import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import WaveformThumb from '@/components/controls/WaveformThumb'
import type { WaveformShape } from '@/components/controls/WaveformThumb'

const CYAN = '#00E5C7'
const MAGENTA = '#FF2E88'
const HAIR = '#26262C'

/* ── mini canvas demo hook ─────────────────────────────────────── */
function useDemoCanvas(
  draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void,
) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawRef.current(ctx, performance.now() / 1000, canvas.width, canvas.height)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return ref
}

/* ── Card 1: pitch line with quantize toggle ───────────────────── */
function PitchDemo() {
  const [quantize, setQuantize] = useState(false)
  const qRef = useRef(quantize)
  qRef.current = quantize
  const ref = useDemoCanvas((ctx, t, w, h) => {
    // note gridlines
    ctx.strokeStyle = HAIR
    ctx.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (i / 6) * h)
      ctx.lineTo(w, (i / 6) * h)
      ctx.stroke()
    }
    ctx.strokeStyle = MAGENTA
    ctx.lineWidth = 2
    ctx.shadowColor = MAGENTA
    ctx.shadowBlur = 6
    ctx.beginPath()
    for (let x = 0; x <= w; x += 3) {
      const f = x / w
      let y = h / 2 + Math.sin(f * 5 + t * 1.4) * h * 0.28 + Math.sin(f * 13 - t * 2.2) * h * 0.08
      if (qRef.current) {
        const step = h / 6
        y = Math.round(y / step) * step
      }
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  })
  return (
    <div>
      <div className="rounded-[4px] bg-display p-2 shadow-recessed">
        <canvas ref={ref} width={560} height={220} style={{ width: '100%', height: 220 }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {['NOTE C4', '+3¢', 'VELOCITY 0.97'].map((chip) => (
          <span
            key={chip}
            className="rounded-[2px] border border-line-hair px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
          >
            {chip}
          </span>
        ))}
        <button
          type="button"
          role="switch"
          aria-checked={quantize}
          onClick={() => setQuantize((q) => !q)}
          className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mid transition-colors hover:text-ink-hi"
        >
          Quantize
          <motion.span
            className="flex h-4 w-7 items-center rounded-full border border-line-hair bg-display px-[3px] shadow-recessed"
            animate={{ justifyContent: quantize ? 'flex-end' : 'flex-start' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <motion.span
              className="block h-2.5 w-2.5 rounded-full"
              animate={{
                backgroundColor: quantize ? MAGENTA : 'var(--ink-low)',
                boxShadow: quantize ? `0 0 8px ${MAGENTA}` : 'none',
              }}
              transition={{ duration: 0.08 }}
            />
          </motion.span>
        </button>
      </div>
    </div>
  )
}

/* ── Card 2: visualizer cycling modes ──────────────────────────── */
const MODES = ['SCOPE', 'SPECTRUM', 'RIBBON'] as const
function VisualizerDemo() {
  const [mode, setMode] = useState(0)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const ribbon = useRef<number[]>([])
  useEffect(() => {
    const id = setInterval(() => setMode((m) => (m + 1) % MODES.length), 4000)
    return () => clearInterval(id)
  }, [])
  const ref = useDemoCanvas((ctx, t, w, h) => {
    const m = MODES[modeRef.current]
    if (m === 'SCOPE') {
      for (const [color, ph, amp] of [
        [CYAN, 0, 0.32],
        [MAGENTA, 1.4, 0.24],
      ] as const) {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const f = x / w
          const y = h / 2 + Math.sin(f * 8 + t * 2.4 + ph) * h * amp * Math.sin(t + f * 3)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    } else if (m === 'SPECTRUM') {
      const bars = 32
      for (let i = 0; i < bars; i++) {
        const v =
          (Math.sin(i * 0.7 + t * 3) * 0.5 + 0.5) * 0.6 +
          (Math.sin(i * 2.3 - t * 5) * 0.5 + 0.5) * 0.4
        const bh = Math.max(2, v * h * (1 - i / bars) * 1.2)
        ctx.fillStyle = i % 5 === 0 ? MAGENTA : CYAN
        ctx.fillRect((i / bars) * w + 1, h - bh, w / bars - 3, bh)
      }
    } else {
      const rb = ribbon.current
      rb.push(Math.sin(t * 6) * 0.5 + Math.sin(t * 2.7) * 0.5)
      if (rb.length > 90) rb.shift()
      ctx.strokeStyle = CYAN
      ctx.lineWidth = 1.5
      ctx.beginPath()
      rb.forEach((v, i) => {
        const x = (i / 90) * w
        const y = h / 2 - v * h * 0.3
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  })
  return (
    <div>
      <div className="rounded-[4px] bg-display p-2 shadow-recessed">
        <canvas ref={ref} width={400} height={150} style={{ width: '100%', height: 150 }} />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
        {MODES[mode]}
      </p>
    </div>
  )
}

/* ── Card 4: record & export demo ──────────────────────────────── */
function RecordDemo() {
  const [state, setState] = useState<'idle' | 'rec' | 'done'>('idle')
  useEffect(() => {
    if (state !== 'rec') return
    const id = setTimeout(() => setState('done'), 3000)
    return () => clearTimeout(id)
  }, [state])
  return (
    <div>
      {state !== 'done' ? (
        <button
          type="button"
          onClick={() => setState('rec')}
          className="flex items-center gap-3 rounded-[2px] border border-line-bright px-5 py-3 transition-colors duration-200 hover:border-signal-red"
        >
          <span
            className={`h-3 w-3 rounded-full ${state === 'rec' ? 'bg-signal-red' : 'border border-signal-red'}`}
            style={state === 'rec' ? { animation: 'vox-led-pulse 1s ease-in-out infinite' } : undefined}
          />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-hi">
            {state === 'rec' ? 'Recording… 3s take' : 'Record a take'}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="rounded-[4px] bg-display px-2 py-1.5 shadow-recessed">
            <WaveformThumb shape="sine" width={90} height={28} cycles={6} color={CYAN} />
          </div>
          <Link
            to="/instrument"
            className="rounded-[2px] border border-magenta px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-magenta transition-colors duration-200 hover:bg-magenta hover:text-abyss"
          >
            Save .wav
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── Card 5: preset chips with waveform preview ────────────────── */
const PRESET_CHIPS: { name: string; shape: WaveformShape }[] = [
  { name: 'NEON CHOIR', shape: 'sine' },
  { name: 'ACID SQUEAK', shape: 'saw' },
  { name: 'RUMBLE ENGINE', shape: 'noise' },
  { name: 'GHOST BELL', shape: 'sine' },
  { name: 'SLOW BURN', shape: 'square' },
  { name: 'MEGA BASS', shape: 'triangle' },
]
function PresetChipsDemo() {
  const [sel, setSel] = useState(0)
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESET_CHIPS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onMouseEnter={() => setSel(i)}
            onFocus={() => setSel(i)}
            className={`rounded-[2px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ${
              sel === i ? 'border-magenta text-ink-hi' : 'border-line-hair text-ink-mid hover:text-ink-hi'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="mt-3 inline-block rounded-[4px] bg-display px-2 py-1.5 shadow-recessed">
        <WaveformThumb shape={PRESET_CHIPS[sel].shape} width={140} height={32} />
      </div>
    </div>
  )
}

/* ── Card 6: QWERTY keys with soft click ───────────────────────── */
const KEYS = ['W', 'E', 'T', 'Y', 'U', 'A', 'S', 'D', 'F', 'G']
function KeysDemo() {
  const audio = useRef<AudioContext | null>(null)
  const click = () => {
    try {
      audio.current ??= new AudioContext()
      const ctx = audio.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 2200
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      /* audio unavailable — visual feedback still works */
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onPointerDown={click}
          className="flex h-12 w-12 items-center justify-center rounded-[2px] border border-line-hair bg-raised font-mono text-[12px] text-ink-mid transition-all duration-150 hover:border-magenta hover:text-magenta hover:shadow-glow-magenta active:scale-95 active:bg-magenta active:text-abyss"
        >
          {k}
        </button>
      ))}
    </div>
  )
}

/* ── the grid ──────────────────────────────────────────────────── */
interface Card {
  title: string
  body: string
  span: string
  visual: React.ReactNode
}

const CARDS: Card[] = [
  {
    title: 'PITCH + QUANTIZE',
    body: 'Sequencer steps, QWERTY, USB MIDI — play sharp or flat, quantize snaps you to the grid.',
    span: 'md:col-span-7 md:row-span-2',
    visual: <PitchDemo />,
  },
  {
    title: 'THE VISUALIZER',
    body: 'Humans need to see sound. Everything you hear is drawn — scope, spectrum, ribbon.',
    span: 'md:col-span-5',
    visual: <VisualizerDemo />,
  },
  {
    title: 'MOD MATRIX',
    body: 'ENV ×2, LFO ×3, velocity, mod wheel and macros as sources. 12 slots.',
    span: 'md:col-span-5',
    visual: (
      <div className="space-y-2.5">
        {[
          ['ENV 1', 'CUTOFF', MAGENTA, true],
          ['LFO 1', 'WT POSITION', CYAN, false],
          ['MOD WHEEL', 'DRIVE', '#3D9BFF', false],
        ].map(([src, dst, c, pulse]) => (
          <div key={src as string} className="flex items-center gap-2">
            <span
              className="w-20 rounded-[2px] border px-2 py-0.5 text-center font-mono text-[9px] uppercase tracking-[0.12em]"
              style={{ borderColor: c as string, color: c as string }}
            >
              {src}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-display">
              <div
                className="h-full rounded-full"
                style={{
                  width: '55%',
                  backgroundColor: c as string,
                  animation: pulse ? 'vox-led-pulse 1.4s ease-in-out infinite' : undefined,
                }}
              />
            </div>
            <span className="w-20 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-ink-mid">
              {dst}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'RECORD & EXPORT',
    body: '48 kHz / 32-bit float. Drag it straight into your DAW.',
    span: 'md:col-span-4',
    visual: <RecordDemo />,
  },
  {
    title: 'PRESETS & MACROS',
    body: '18 factory presets, 8 performance macros, everything saved locally.',
    span: 'md:col-span-4',
    visual: <PresetChipsDemo />,
  },
  {
    title: 'QWERTY + MIDI',
    body: 'Laptop keys, touch, or a USB piano. It all plays.',
    span: 'md:col-span-4',
    visual: <KeysDemo />,
  },
]

/**
 * Feature bento grid (home.md §5). Framer Motion reveals; all mini-demos are
 * real lightweight canvas/DOM demos labeled DEMO.
 */
export default function FeatureBento() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-28">
      <p className="eyebrow text-cyan">FEATURES.INI</p>
      <h2 className="mt-4 font-display text-[48px] font-extrabold leading-none tracking-[-0.02em] text-ink-hi">
        An instrument, not a toy.
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(0,auto)]">
        {CARDS.map((card, i) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative rounded-[4px] border border-line-hair bg-panel p-6 transition-colors duration-200 hover:border-line-bright ${card.span}`}
          >
            <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-low">
              LIVE
            </span>
            <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-ink-hi">
              {card.title}
            </h3>
            <p className="mb-5 mt-1.5 max-w-[380px] font-sans text-[13px] leading-snug text-ink-mid">
              {card.body}
            </p>
            <div className="transition-[filter] duration-200 group-hover:brightness-110">
              {card.visual}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
