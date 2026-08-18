import { memo } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import SectionHead from './SectionHead'
import { EASE_OUT_EXPO } from './scroll'

/* ------------------------------------------------------------------ */
/* Looping mini visuals — isolated + memoized so they never reset      */
/* ------------------------------------------------------------------ */

/** Spacebar keycap with a soft press pulse. */
const SpaceVisual = memo(function SpaceVisual() {
  return (
    <svg viewBox="0 0 96 48" className="h-12 w-full" aria-hidden>
      <motion.g
        animate={{ y: [0, 0, 2, 0, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect
          x="8"
          y="10"
          width="80"
          height="22"
          rx="4"
          fill="var(--bg-display)"
          stroke="var(--accent-cyan)"
          strokeWidth="1"
        />
        <text
          x="48"
          y="25"
          textAnchor="middle"
          fill="var(--accent-cyan)"
          fontSize="8"
          letterSpacing="3"
          fontFamily="'Fragment Mono', ui-monospace, monospace"
        >
          SPACE
        </text>
      </motion.g>
      <text
        x="48"
        y="44"
        textAnchor="middle"
        fill="var(--ink-low)"
        fontSize="7"
        letterSpacing="2"
        fontFamily="'Fragment Mono', ui-monospace, monospace"
      >
        PLAY / STOP
      </text>
    </svg>
  )
})

/** Level bar bouncing into a ghosted −24…−6 dB target band. */
const LevelVisual = memo(function LevelVisual() {
  return (
    <svg viewBox="0 0 96 48" className="h-12 w-full" aria-hidden>
      {/* track */}
      <rect x="0" y="20" width="96" height="8" fill="var(--bg-display)" stroke="var(--line-hair)" strokeWidth="1" />
      {/* ghosted sweet-spot band (roughly −24…−6 dB of a −60…0 range) */}
      <rect x="58" y="20" width="29" height="8" fill="var(--accent-cyan)" opacity="0.12" />
      <line x1="58" y1="18" x2="58" y2="30" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <line x1="87" y1="18" x2="87" y2="30" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      {/* live bar */}
      <motion.rect
        x="0"
        y="21"
        height="6"
        fill="var(--accent-magenta)"
        animate={{ width: [30, 76, 64, 82, 70, 30] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <text
        x="58"
        y="42"
        fill="var(--ink-low)"
        fontSize="7"
        letterSpacing="2"
        fontFamily="'Fragment Mono', ui-monospace, monospace"
      >
        −24…−6 DB
      </text>
    </svg>
  )
})

/** Clean output waveform morphing into the magenta synth waveform. */
const PlayVisual = memo(function PlayVisual() {
  const voice =
    'M0 24 Q6 18 12 24 T24 24 T36 24 T48 24 T60 24 T72 24 T84 24 T96 24'
  const synth =
    'M0 24 L8 10 L16 38 L24 8 L32 40 L40 12 L48 36 L56 9 L64 39 L72 11 L80 37 L88 14 L96 24'
  return (
    <svg viewBox="0 0 96 48" className="h-12 w-full" aria-hidden>
      <motion.path
        d={voice}
        stroke="var(--accent-cyan)"
        strokeWidth="1.5"
        fill="none"
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d={synth}
        stroke="var(--accent-magenta)"
        strokeWidth="1.5"
        fill="none"
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <text
        x="0"
        y="46"
        fill="var(--ink-low)"
        fontSize="7"
        letterSpacing="2"
        fontFamily="'Fragment Mono', ui-monospace, monospace"
      >
        OUT → WAV
      </text>
    </svg>
  )
})

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    index: 'STEP_01',
    title: 'OPEN',
    body: 'Open the instrument. No sign-up, no permission wall — you land on the panel. Hit SPACE to run the clock.',
    Visual: SpaceVisual,
  },
  {
    index: 'STEP_02',
    title: 'PLAY',
    body: 'QWERTY, the piano strip, or a USB MIDI keyboard plays notes. ← → flips through the 18 factory presets.',
    Visual: LevelVisual,
  },
  {
    index: 'STEP_03',
    title: 'RECORD',
    body: 'Press ● REC to capture the master output — exactly what you hear. Save a 48kHz / 32-bit float WAV.',
    Visual: PlayVisual,
  },
]

/**
 * Quick start (guide.md §2): three step cards + instrument CTAs.
 */
export default function QuickStart() {
  return (
    <section id="quickstart" className="mx-auto w-full max-w-[960px] scroll-mt-20 px-6 py-24">
      <SectionHead index="01" title="Sixty seconds to sound." />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.index}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: EASE_OUT_EXPO }}
            className="group rounded-[4px] border border-line-hair bg-panel p-6 transition-colors duration-200 hover:border-line-bright"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-low">
              {step.index}
            </p>
            <h3 className="mt-3 text-[13px] font-bold uppercase tracking-[0.18em] text-ink-hi">
              {step.title}
            </h3>
            <div className="mt-5 transition-transform duration-200 group-hover:scale-[1.02]">
              <step.Visual />
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-ink-mid">{step.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT_EXPO }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <Link
          to="/instrument"
          className="group flex items-center gap-2 rounded-[2px] bg-magenta px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-abyss transition-opacity duration-200 hover:opacity-90"
        >
          Open the instrument
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>

      </motion.div>
    </section>
  )
}
