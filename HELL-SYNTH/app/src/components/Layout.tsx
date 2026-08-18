import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { createLenis, destroyLenis } from '@/lib/lenis'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * Landing-pages layout. Renders <Outlet/> (nested-route pattern — App.tsx must
 * nest landing routes inside this route element). Owns the fixed-nav offset
 * (pt-14 = 56px nav height), Lenis smooth scroll and grain overlay.
 * NOT used by the instrument page.
 */
export default function Layout() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = createLenis()
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      destroyLenis()
    }
  }, [])

  return (
    <div className="min-h-[100dvh] bg-abyss text-ink-hi">
      <Navbar />
      {/* offset for the fixed 56px nav lives here, not in pages */}
      <main className="pt-14">
        <Outlet />
      </main>
      <Footer />
      {/* film grain — landing pages only, never over the instrument */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: 'url(/grain.svg)', backgroundSize: '512px 512px' }}
      />
    </div>
  )
}
