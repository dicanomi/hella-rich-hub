import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { motion } from 'framer-motion'

/**
 * Landing nav (design.md §7.7, home.md §1).
 * Fixed top, 56px (shrinks to 48px after 40px scroll), backdrop blur over abyss/80.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-line-hair backdrop-blur-md"
      style={{
        backgroundColor: scrolled ? 'rgba(10,10,12,0.95)' : 'rgba(10,10,12,0.8)',
        transition: 'background-color 250ms ease',
      }}
    >
      <nav
        className="mx-auto flex max-w-[1440px] items-center justify-between px-6"
        style={{
          height: scrolled ? 48 : 56,
          transition: 'height 250ms ease',
        }}
      >
        {/* Left: wordmark */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="HELLA.SYNTH home">
          <img src="./logo.svg" alt="" width={20} height={20} />
          <span className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink-hi">
            HELLA.SYNTH
          </span>
        </Link>

        {/* Center: micro-label links */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-8">
          {[
            { to: '/instrument', label: 'INSTRUMENT' },
            { to: '/guide', label: 'GUIDE' },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `group relative font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-200 ${
                  isActive ? 'text-ink-hi' : 'text-ink-mid hover:text-ink-hi'
                }`
              }
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-magenta transition-all duration-200 group-hover:w-full" />
            </NavLink>
          ))}
        </div>

        {/* Right: CTA */}
        <Link
          to="/instrument"
          className="group flex items-center gap-1.5 rounded-[2px] border border-magenta bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-magenta transition-colors duration-200 hover:bg-magenta hover:text-abyss"
        >
          Open App
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </nav>
    </motion.header>
  )
}
