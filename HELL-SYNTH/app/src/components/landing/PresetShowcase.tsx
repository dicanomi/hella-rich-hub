import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, useScroll, useTransform } from 'framer-motion'

const PRESETS = [
  { n: '01', slug: 'neon-choir', name: 'NEON CHOIR', desc: 'Stacked unison pad with slow wavetable drift', tag: 'PAD' },
  { n: '02', slug: 'soma-pad', name: 'SOMA PAD', desc: 'Warm analog-grit pad, dark until you open it up', tag: 'PAD' },
  { n: '03', slug: 'dusk-keys', name: 'DUSK KEYS', desc: 'Soft harmonic keys — velocity opens the filter', tag: 'KEYS' },
  { n: '04', slug: 'rumble-engine', name: 'RUMBLE ENGINE', desc: 'Sub-octave bass machine with grit on top', tag: 'BASS' },
  { n: '05', slug: 'ghost-bell', name: 'GHOST BELL', desc: 'Glassy bell with a wandering pan ghost', tag: 'KEYS' },
  { n: '06', slug: 'slow-burn', name: 'SLOW BURN', desc: 'Smoldering lead — the mod wheel makes it snarl', tag: 'LEAD' },
]

/** Preset showcase (home.md §7) over preset-wall.jpg with slow parallax. */
export default function PresetShowcase() {
  const ref = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line-hair">
      {/* parallax backdrop */}
      <motion.div className="absolute inset-[-60px]" style={{ y: bgY }}>
        <img
          src="./preset-wall.jpg"
          alt=""
          className="h-full w-full object-cover brightness-[0.3]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-abyss/70" />

      <div className="relative mx-auto max-w-[960px] px-6 py-28">
        <p className="eyebrow text-cyan">FACTORY_PRESETS.DIR</p>
        <h2 className="mt-4 font-display text-[40px] font-extrabold leading-none tracking-[-0.02em] text-ink-hi">
          Eighteen starting points. Zero blank pages.
        </h2>

        <div className="mt-12">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.slug}
              type="button"
              onClick={() => navigate(`/instrument?preset=${p.slug}`)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-25%' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-6 overflow-hidden border-b border-line-hair py-5 text-left"
            >
              {/* hover wipe */}
              <span
                aria-hidden
                className="absolute inset-0 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-[250ms] ease-out-expo group-hover:scale-x-100"
              />
              <span className="relative font-mono text-[11px] text-ink-low">{p.n}</span>
              <span className="relative">
                <span className="block font-display text-[28px] font-semibold leading-tight text-ink-hi transition-transform duration-[250ms] group-hover:translate-x-2">
                  {p.name}
                </span>
                <span className="mt-0.5 block font-sans text-[13px] text-ink-mid">{p.desc}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  className="mt-2 h-3 w-[200px] max-w-full"
                  fill="none"
                >
                  <path
                    d="M0 6 Q 12 0, 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6"
                    stroke="var(--accent-cyan)"
                    strokeWidth="1"
                    strokeDasharray="220"
                    strokeDashoffset="220"
                    className="transition-[stroke-dashoffset] duration-[400ms] group-hover:[stroke-dashoffset:0]"
                  />
                </svg>
              </span>
              <span className="relative rounded-[2px] border border-line-bright px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mid transition-colors duration-200 group-hover:border-magenta group-hover:text-ink-hi">
                {p.tag}
              </span>
            </motion.button>
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-low">
          + 12 more in the app · Everything saved locally
        </p>
      </div>
    </section>
  )
}
