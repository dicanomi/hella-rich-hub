import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from './SectionHead'
import { MODULES } from './data'
import { EASE_OUT_EXPO, scrollToId } from './scroll'

/**
 * Control reference (guide.md §3): sticky left sub-nav with scroll-spy +
 * module spec tables. Rows: [control 180px | range 140px | description flex],
 * hairline-separated.
 */
export default function ControlReference() {
  const [active, setActive] = useState(MODULES[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-25% 0px -65% 0px' }
    )
    for (const m of MODULES) {
      const el = document.getElementById(m.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <section id="controls" className="scroll-mt-20 border-t border-line-hair">
      <div className="mx-auto w-full max-w-[1080px] px-6 py-24">
        <SectionHead index="02" title="Every control, accounted for." />

        <div className="mt-12 flex gap-10">
          {/* Sticky sub-nav */}
          <nav aria-label="Control reference modules" className="hidden w-[200px] shrink-0 lg:block">
            <ul className="sticky top-24 space-y-1">
              {MODULES.map((m) => {
                const isActive = active === m.id
                return (
                  <li key={m.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-cyan transition-opacity duration-200"
                      style={{ opacity: isActive ? 1 : 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => scrollToId(m.id)}
                      className={`w-full py-1.5 pl-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-200 ${
                        isActive ? 'text-cyan' : 'text-ink-mid hover:text-ink-hi'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {m.nav}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Module blocks */}
          <div className="min-w-0 flex-1 space-y-16">
            {MODULES.map((m) => (
              <motion.article
                key={m.id}
                id={m.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="scroll-mt-24"
              >
                <header className="flex items-baseline gap-3 border-b border-line-hair pb-4">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full"
                    style={{ backgroundColor: m.led, boxShadow: `0 0 8px ${m.led}` }}
                  />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink-hi">
                    {m.title}
                  </h3>
                  <p className="hidden text-[13px] text-ink-mid sm:block">{m.purpose}</p>
                </header>
                <p className="mt-3 text-[13px] text-ink-mid sm:hidden">{m.purpose}</p>

                {m.groups.map((g, gi) => (
                  <div key={gi} className={gi > 0 ? 'mt-8' : 'mt-2'}>
                    {g.label && (
                      <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">
                        {g.label}
                      </p>
                    )}
                    <dl>
                      {g.rows.map((row, ri) => (
                        <motion.div
                          key={row.control + ri}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{
                            duration: 0.35,
                            delay: Math.min(ri * 0.03, 0.3),
                            ease: EASE_OUT_EXPO,
                          }}
                          className="grid grid-cols-1 gap-1 border-b border-line-hair py-3 sm:grid-cols-[180px_140px_1fr] sm:gap-4"
                        >
                          <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-hi">
                            {row.control}
                          </dt>
                          <dd className="font-mono text-[11px] uppercase leading-relaxed text-cyan">
                            {row.range}
                          </dd>
                          <dd className="text-[13px] leading-relaxed text-ink-mid">
                            {row.description}
                          </dd>
                        </motion.div>
                      ))}
                    </dl>
                  </div>
                ))}
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
