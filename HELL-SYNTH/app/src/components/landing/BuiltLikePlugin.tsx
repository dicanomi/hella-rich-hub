import { Link } from 'react-router'
import { motion } from 'framer-motion'

const SPECS: [string, string][] = [
  ['ENGINE', 'WEB AUDIO API · AUDIOWORKLET'],
  ['SEQUENCER', '16 STEPS · LOOKAHEAD MASTER CLOCK'],
  ['FILTER', '4-POLE LADDER · SELF-OSCILLATING'],
  ['WAVETABLES', 'SERUM-STYLE MORPH · UNISON ×7'],
  ['EXPORT', 'WAV · 48 kHz · 32-BIT FLOAT'],
  ['PRIVACY', '100% LOCAL · NO SERVER · NO ACCOUNT'],
]

/** Built Like a Plugin (home.md §6) — sticky text + spec sheet + signal diagram. */
export default function BuiltLikePlugin() {
  return (
    <section className="border-t border-line-hair bg-abyss">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-16 px-6 py-28 md:grid-cols-2">
        {/* left: sticky text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30%' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="md:sticky md:top-32 md:self-start"
        >
          <p className="eyebrow text-cyan">ARCHITECTURE.TXT</p>
          <h2 className="mt-4 font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink-hi">
            Born in the browser. Built to become a plug-in.
          </h2>
          <p className="mt-6 max-w-[420px] font-sans text-[14px] leading-relaxed text-ink-mid">
            The DSP core is pure TypeScript — no framework, no DOM. The
            interface is just a view. When HELLA.SYNTH ships as a DAW plug-in, the
            engine won't change a line.
          </p>
          <Link
            to="/guide"
            className="group mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan transition-colors hover:text-ink-hi"
          >
            Read the guide
            <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>

        {/* right: spec sheet + diagram */}
        <div>
          <div className="rounded-[4px] border border-line-hair bg-panel">
            {SPECS.map(([label, value], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex items-center justify-between gap-4 px-5 py-4"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left bg-line-hair"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-20%' }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  style={i === 0 ? { display: 'none' } : undefined}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mid">
                  {label}
                </span>
                <span className="text-right font-mono text-[11px] tracking-[0.06em] text-ink-hi">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 overflow-hidden rounded-[4px] border border-line-hair bg-panel p-6"
          >
            <img
              src="./guide-signal.svg"
              alt="Signal chain: KEYS → SEQUENCER → OSCILLATORS → LADDER FILTER → MOD MATRIX → FX → WAV"
              className="w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
