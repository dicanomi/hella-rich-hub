import { motion } from 'framer-motion'
import SectionHead from './SectionHead'
import { SHORTCUTS } from './data'
import { EASE_OUT_EXPO } from './scroll'

/** 24px raised keycap chip with hairline border; flips magenta on row hover. */
function Keycap({ label }: { label: string }) {
  const isWord = label.length > 1
  return (
    <kbd
      className={`inline-flex h-6 items-center justify-center rounded-[2px] border border-line-bright bg-raised px-1.5 font-mono text-[11px] leading-none text-ink-hi transition-colors duration-150 group-hover:border-magenta ${
        isWord ? 'min-w-0 tracking-[0.06em]' : 'min-w-6'
      }`}
    >
      {label}
    </kbd>
  )
}

/**
 * Keyboard shortcuts (guide.md §4): two-column key/command table with keycaps.
 */
export default function Shortcuts() {
  return (
    <section id="shortcuts" className="scroll-mt-20 border-t border-line-hair">
      <div className="mx-auto w-full max-w-[720px] px-6 py-24">
        <SectionHead index="03" title="Hands off the mouse." />

        <div className="mt-10">
          {SHORTCUTS.map((row, i) => (
            <motion.div
              key={row.action}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT_EXPO }}
              className="group flex items-center justify-between gap-6 border-b border-line-hair py-3.5"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                {row.keys.map((k, ki) => (
                  <Keycap key={ki} label={k} />
                ))}
              </span>
              <span className="text-right text-[13px] text-ink-mid transition-colors duration-150 group-hover:text-ink-hi">
                {row.action}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
