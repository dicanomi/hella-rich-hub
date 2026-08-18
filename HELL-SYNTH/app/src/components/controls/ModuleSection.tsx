import type { ReactNode } from 'react'

export interface ModuleSectionProps {
  /** 10px uppercase section label */
  title: string
  /** LED dot color (CSS color). Defaults to --led-green. Pass 'transparent'-ish token to hide glow. */
  ledColor?: string
  /** LED on/off (off renders --ink-low, no glow) */
  ledOn?: boolean
  /** Right-aligned Fragment Mono status text in the header */
  status?: string
  /** Extra header content (e.g. a LEDToggle), rendered before status */
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Instrument panel wrapper (design.md §7.3): --bg-panel, hairline border,
 * header row (LED dot + 10px uppercase label + optional right status in
 * Fragment Mono), 1px hairline under the header.
 */
export default function ModuleSection({
  title,
  ledColor = 'var(--led-green)',
  ledOn = true,
  status,
  headerRight,
  children,
  className = '',
  bodyClassName = '',
}: ModuleSectionProps) {
  return (
    <section
      className={`rounded-[4px] border border-line-hair bg-panel transition-colors duration-200 focus-within:border-line-bright hover:border-line-bright ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-line-hair px-4 py-2.5">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200"
          style={{
            backgroundColor: ledOn ? ledColor : 'var(--ink-low)',
            boxShadow: ledOn ? `0 0 8px ${ledColor}` : 'none',
          }}
        />
        <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mid">
          {title}
        </h2>
        <div className="ml-auto flex items-center gap-3">
          {headerRight}
          {status && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
              {status}
            </span>
          )}
        </div>
      </header>
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
