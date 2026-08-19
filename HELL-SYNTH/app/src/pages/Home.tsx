import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import SignalChain from '@/components/landing/SignalChain'
import FeatureBento from '@/components/landing/FeatureBento'
import BuiltLikePlugin from '@/components/landing/BuiltLikePlugin'
import PresetShowcase from '@/components/landing/PresetShowcase'
import FinalCTA from '@/components/landing/FinalCTA'

/**
 * HELLA.SYNTH landing page (home.md). Motion stack: Lenis (Layout) · GSAP
 * ScrollTrigger pinned sections (Hero, SignalChain) · Framer Motion reveals ·
 * custom cursor + grain (Layout).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <SignalChain />
      <FeatureBento />
      <BuiltLikePlugin />
      <PresetShowcase />
      <FinalCTA />
    </>
  )
}
