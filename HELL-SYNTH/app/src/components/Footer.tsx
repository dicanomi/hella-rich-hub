import { Link } from 'react-router'
import { motion } from 'framer-motion'

const COLUMNS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: 'APP',
    links: [
      { label: 'INSTRUMENT', to: '/instrument' },
      { label: 'PRESETS', to: '/instrument' },
      { label: 'GUIDE', to: '/guide' },
    ],
  },
  {
    title: 'LEARN',
    links: [
      { label: 'SIGNAL CHAIN', to: '/#signal-chain' },
      { label: 'SHORTCUTS', to: '/guide#shortcuts' },
      { label: 'FAQ', to: '/guide#faq' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'PRIVACY', to: '/guide#privacy' },
      { label: 'TERMS', to: '/guide#terms' },
    ],
  },
]

/**
 * Landing footer (design.md §7.8, home.md §8).
 * Ghost wordmark backdrop, three micro-link columns, privacy line.
 */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line-hair bg-abyss">
      {/* Ghost wordmark backdrop — drifts ±10px on a 12s sine */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center font-display font-extrabold uppercase leading-none text-ink-hi"
        style={{ fontSize: '15vw', opacity: 0.08 }}
        animate={{ x: [ -10, 10, -10 ] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        HELLA.SYNTH
      </motion.div>

      <div className="relative mx-auto max-w-[1280px] px-6 pb-10 pt-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-2.5">
              <img src="./logo.svg" alt="" width={20} height={20} />
              <span className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink-hi">
                HELLA.SYNTH
              </span>
            </div>
            <p className="mt-4 max-w-[220px] font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ink-low">
              Browser synthesizer · QWERTY + USB MIDI · Runs entirely in your tab
            </p>
          </motion.div>

          {COLUMNS.map((col, i) => (
            <motion.nav
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1), ease: [0.22, 1, 0.36, 1] }}
              aria-label={col.title}
            >
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-low">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mid transition-colors duration-200 hover:text-ink-hi"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line-hair pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-low">
            © 2026 HELLA.SYNTH — MADE IN SOMA SF
          </p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mid">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-magenta shadow-glow-magenta" />
            Built in the browser. Nothing leaves this tab.
          </p>
        </div>
      </div>
    </footer>
  )
}
