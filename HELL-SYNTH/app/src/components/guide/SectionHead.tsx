import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from './scroll'

/**
 * Shared section header: Fragment Mono eyebrow index + Bricolage 800 title.
 * Reveals y+24px → 0 on 25% viewport.
 */
export default function SectionHead({
  index,
  title,
}: {
  index: string
  title: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
        {index}
      </p>
      <h2 className="mt-3 font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink-hi sm:text-[40px]">
        {title}
      </h2>
    </motion.div>
  )
}
