import type { ReactNode } from 'react'

export interface DisplayStripProps {
  /** Optional micro-label above the recessed window */
  label?: string
  /** Optional right-aligned Fragment Mono status text next to the label */
  status?: string
  children: ReactNode
  className?: string
}

/**
 * Recessed dark display window (design.md §7.2) — inset shadow, Fragment Mono
 * telemetry inside. Used for pitch note / cents / Hz readouts, visualizer
 * wells and recorder readouts.
 */
export default function DisplayStrip({ label, status, children, className = '' }: DisplayStripProps) {
  return (
    <div className={className}>
      {(label || status) && (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label && <span className="micro-label">{label}</span>}
          {status && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
              {status}
            </span>
          )}
        </div>
      )}
      <div className="rounded-[4px] bg-display px-3 py-2 shadow-recessed">{children}</div>
    </div>
  )
}
