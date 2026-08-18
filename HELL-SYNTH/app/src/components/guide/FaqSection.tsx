import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import SectionHead from './SectionHead'
import { FAQ } from './data'
import { EASE_OUT_EXPO } from './scroll'

/**
 * FAQ (guide.md §6): shadcn/Radix accordion restyled to the system —
 * hairline-separated items, magenta `+` rotating 45° when open. Items carry
 * `faq-N` ids so the troubleshooting strip (and footer privacy link) can
 * deep-link; a custom event opens the matching item.
 */
export default function FaqSection() {
  const location = useLocation()
  const [open, setOpen] = useState<string | undefined>(() => {
    const hash = window.location.hash.slice(1)
    return /^faq-\d+$/.test(hash) ? hash : undefined
  })

  // Trouble strip chips ask us to open an item (they handle the scrolling).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (/^faq-\d+$/.test(id)) setOpen(id)
    }
    window.addEventListener('voxform:faq-open', onOpen)
    return () => window.removeEventListener('voxform:faq-open', onOpen)
  }, [])

  // Keep the open item in sync when arriving with a #faq-N hash.
  useEffect(() => {
    const hash = location.hash.slice(1)
    if (/^faq-\d+$/.test(hash)) setOpen(hash)
  }, [location.hash])

  return (
    <section id="faq" className="scroll-mt-20 border-t border-line-hair">
      <div className="mx-auto w-full max-w-[720px] px-6 py-24">
        <SectionHead index="05" title="Fair questions." />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="mt-10"
        >
          <Accordion
            type="single"
            collapsible
            value={open}
            onValueChange={(v) => setOpen(v || undefined)}
          >
            {FAQ.map((item, i) => {
              const id = `faq-${i + 1}`
              return (
                <AccordionItem
                  key={id}
                  value={id}
                  id={id}
                  className="scroll-mt-24 border-b border-line-hair last:border-b"
                >
                  <AccordionTrigger className="group py-5 text-[15px] font-semibold text-ink-hi hover:no-underline [&>svg]:hidden">
                    <span className="pr-4">{item.q}</span>
                    <Plus
                      aria-hidden
                      className="size-4 shrink-0 translate-y-0.5 text-ink-mid transition-all duration-200 group-data-[state=open]:rotate-45 group-data-[state=open]:text-magenta"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[600px] text-[13px] leading-relaxed text-ink-mid">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
