import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { EASE_OUT_EXPO, scrollToId } from './scroll'

const CHIPS: { label: string; target?: string; to?: string }[] = [
  { label: 'MIDI NOT SHOWING', target: 'faq-4' },
  { label: 'LATENCY', target: 'faq-6' },
  { label: 'NO SOUND → HIT SPACE', to: '/instrument' },
]

/**
 * Troubleshooting strip + quiet CTA (guide.md §7). Chips deep-link into the
 * FAQ anchors; the CTA returns to the instrument.
 */
export default function TroubleStrip() {
  return (
    <section className="border-y border-line-hair bg-panel">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="mx-auto w-full max-w-[960px] px-6 py-10"
      >
        <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink-hi">
          Something's wrong?
        </h2>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {CHIPS.map((chip) =>
            chip.to ? (
              <Link
                key={chip.label}
                to={chip.to}
                className="rounded-[2px] border border-line-bright px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mid transition-colors duration-150 hover:border-magenta hover:text-ink-hi"
              >
                {chip.label}
              </Link>
            ) : (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  scrollToId(chip.target!)
                  window.dispatchEvent(
                    new CustomEvent('voxform:faq-open', { detail: chip.target })
                  )
                }}
                className="rounded-[2px] border border-line-bright px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mid transition-colors duration-150 hover:border-magenta hover:text-ink-hi"
              >
                {chip.label} →
              </button>
            )
          )}
        </div>

        <div className="mt-8 border-t border-line-hair pt-8">
          <Link
            to="/instrument"
            className="group inline-flex items-center gap-2 rounded-[2px] border border-magenta px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-magenta transition-colors duration-200 hover:bg-magenta hover:text-abyss"
          >
            Open the instrument
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
