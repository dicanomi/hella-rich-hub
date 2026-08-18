import Lenis from 'lenis'

/**
 * Singleton Lenis instance for landing pages. Owned by Layout; GSAP-driven
 * sections subscribe via `getLenis()?.on('scroll', ScrollTrigger.update)`.
 */
let lenis: Lenis | null = null

export function createLenis(): Lenis {
  if (!lenis) lenis = new Lenis({ lerp: 0.12 })
  return lenis
}

export function getLenis(): Lenis | null {
  return lenis
}

export function destroyLenis() {
  lenis?.destroy()
  lenis = null
}
