import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'

const WireformCanvas = lazy(() => import('@/components/landing/WireformCanvas'))

/** Final CTA (home.md §8) — wireform returns, breathing; HELLA.SYNTH. hover excites it. */
export default function FinalCTA() {
  const [excited, setExcited] = useState(false)

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-abyss">
      <Suspense fallback={null}>
        <WireformCanvas
          className="absolute inset-0 z-0"
          idleAmp={24}
          exciteAmp={64}
          heightFrac={0.5}
          excited={excited}
          breathe
        />
      </Suspense>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-30%' }}
          transition={{ duration: 0.5 }}
          className="eyebrow"
        >
          READY WHEN YOU ARE
        </motion.p>

        <h2
          className="mt-6 font-display font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(64px, 11vw, 180px)' }}
        >
          <span className="block overflow-hidden">
            <motion.span
              className="block text-ink-hi"
              initial={{ y: '100%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, margin: '-30%' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              Open
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block cursor-pointer text-magenta"
              initial={{ y: '100%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, margin: '-30%' }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setExcited(true)}
              onMouseLeave={() => setExcited(false)}
            >
              HELLA.SYNTH.
            </motion.span>
          </span>
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30%' }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <Link
            to="/instrument"
            className="group inline-flex items-center gap-2 rounded-[2px] bg-magenta px-10 py-5 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-abyss transition-[filter] duration-150 hover:brightness-110"
          >
            Launch the instrument
            <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-30%' }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-low"
        >
          Chrome · Edge · Safari 17+ · USB MIDI ready
        </motion.p>
      </div>
    </section>
  )
}
