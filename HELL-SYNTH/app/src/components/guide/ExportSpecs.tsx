import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import SectionHead from './SectionHead'
import { SPEC_SHEET } from './data'
import { EASE_OUT_EXPO } from './scroll'

/** Counts 0 → 48000 once when scrolled into view (600ms, tabular figures). */
function SampleRateCount() {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, 48000, {
      duration: 0.6,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [inView])

  return (
    <span ref={ref} className="tabular-nums">
      {Math.round(value).toLocaleString('en-US')} HZ
    </span>
  )
}

/**
 * Recording & export (guide.md §5): text column + deliverable spec sheet.
 */
export default function ExportSpecs() {
  return (
    <section id="export" className="scroll-mt-20 border-t border-line-hair">
      <div className="mx-auto grid w-full max-w-[960px] gap-12 px-6 py-24 md:grid-cols-2">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        >
          <SectionHead index="04" title="Master-ready files, zero setup." />
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-mid">
            <p>
              Press ● REC, perform, press it again. The review modal shows your
              waveform — trim the ends, audition with SPACE, then save. No
              project file, no bounce dialog, no waiting.
            </p>
            <p>
              Every take renders offline to a 48 kHz / 32-bit float stereo WAV.
              32-bit float means headroom that cannot clip inside the file —
              drag it straight into Ableton, Logic, or FL and mix later.
            </p>
            <p>
              The recorder taps the master bus after the output fader, so the file
              is exactly what you heard — fades, FX, and all.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-low">
              Files land as TAKE_07.WAV
            </p>
          </div>
        </motion.div>

        {/* Right: spec sheet */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="h-fit rounded-[4px] border border-line-hair bg-panel p-6"
          aria-label="Export deliverable specification"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-low">
            DELIVERABLE_SPEC.TXT
          </p>
          <dl className="mt-4">
            {SPEC_SHEET.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: EASE_OUT_EXPO }}
                className="flex items-baseline justify-between gap-4 border-b border-line-hair py-3 last:border-b-0"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-mid">
                  {row.label}
                </dt>
                <dd className="text-right font-mono text-[12px] uppercase text-cyan">
                  {row.label === 'SAMPLE RATE' ? <SampleRateCount /> : row.value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.aside>
      </div>
    </section>
  )
}
