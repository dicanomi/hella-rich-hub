import { getLenis } from '@/lib/lenis'

/** Shared out-expo easing (design.md §5) typed for Framer Motion. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * Smooth-scroll to an in-page anchor. Uses the Layout-owned Lenis instance
 * when available so the motion matches the page's scroll feel; falls back to
 * a native scrollIntoView (reduced-motion / no-Lenis contexts).
 */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(el, { offset: -72, duration: 0.8 })
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top })
  }
}
