import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EASE_OUT_EXPO } from './scroll'

/**
 * Guide hero (guide.md §1): eyebrow, mask-revealed two-line title, sub, and
 * the 6-node signal-chain SVG with a gentle scroll parallax ("living feel").
 */
export default function GuideHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const svgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  return (
    <section
      ref={ref}
      className="mx-auto flex min-h-[60vh] w-full max-w-[960px] flex-col justify-center px-6 pb-16 pt-20"
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan"
      >
        HELLA.SYNTH_MANUAL.PDF — V2.0
      </motion.p>

      <h1
        className="mt-6 font-display font-extrabold leading-[0.95] tracking-[-0.03em] text-ink-hi"
        style={{ fontSize: 'clamp(44px, 7vw, 96px)' }}
      >
        <span className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          >
            Read this,
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            className="block text-ink-mid"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE_OUT_EXPO }}
          >
            then don't.
          </motion.span>
        </span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: EASE_OUT_EXPO }}
        className="mt-6 max-w-[480px] text-sm leading-relaxed text-ink-mid"
      >
        Everything is labeled on the panel and every knob shows its value. But
        if you want to know how the keys become voltage — start here.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.75, ease: EASE_OUT_EXPO }}
        className="mt-12 overflow-x-auto"
      >
        <motion.img
          src="./guide-signal.svg"
          alt="Signal chain: keys to sequencer to oscillators to ladder filter to mod matrix to FX to WAV"
          style={{ y: svgY }}
          className="w-full min-w-[640px]"
          width={1600}
          height={400}
        />
      </motion.div>
    </section>
  )
}
