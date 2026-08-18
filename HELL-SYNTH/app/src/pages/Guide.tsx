import { useEffect } from 'react'
import { useLocation } from 'react-router'
import GuideHero from '@/components/guide/GuideHero'
import QuickStart from '@/components/guide/QuickStart'
import ControlReference from '@/components/guide/ControlReference'
import Shortcuts from '@/components/guide/Shortcuts'
import ExportSpecs from '@/components/guide/ExportSpecs'
import FaqSection from '@/components/guide/FaqSection'
import TroubleStrip from '@/components/guide/TroubleStrip'
import { scrollToId } from '@/components/guide/scroll'

/** Footer deep-links that don't map 1:1 to a guide section id. */
const HASH_ALIASES: Record<string, string> = {
  privacy: 'faq-1', // "Does my audio get uploaded?"
  terms: 'faq',
}

/**
 * HELL.SYNTH manual (guide.md). Rendered inside the shared Layout (Nav + Footer +
 * Lenis + grain + cursor). Sections deep-link: #quickstart #controls
 * #shortcuts #export #faq.
 */
export default function Guide() {
  const location = useLocation()

  // Deep-link support: scroll to the anchor after sections mount.
  useEffect(() => {
    if (!location.hash) return
    const raw = location.hash.slice(1)
    const target = document.getElementById(raw) ? raw : HASH_ALIASES[raw]
    if (!target) return
    const t = window.setTimeout(() => scrollToId(target), 120)
    return () => window.clearTimeout(t)
  }, [location.hash])

  return (
    <>
      <GuideHero />
      <QuickStart />
      <ControlReference />
      <Shortcuts />
      <ExportSpecs />
      <FaqSection />
      <TroubleStrip />
    </>
  )
}
