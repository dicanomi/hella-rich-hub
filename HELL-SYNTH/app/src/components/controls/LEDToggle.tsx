import { motion } from 'framer-motion'

export interface LEDToggleProps {
  on: boolean
  onChange: (on: boolean) => void
  /** Optional micro-label next to the toggle */
  label?: string
  /** LED color when on (defaults to --led-green) */
  color?: string
  disabled?: boolean
  className?: string
}

/**
 * Power toggle with glowing LED (design.md §7.4) — led-green on / ink-low off,
 * 80ms glow bloom on ignite (snappy spring 500/35).
 */
export default function LEDToggle({
  on,
  onChange,
  label,
  color = 'var(--led-green)',
  disabled = false,
  className = '',
}: LEDToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? 'power'}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`group flex items-center gap-2 outline-none ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <motion.span
        aria-hidden
        className="relative flex h-4 w-7 items-center rounded-full border border-line-hair bg-display px-[3px] shadow-recessed"
        animate={{ justifyContent: on ? 'flex-end' : 'flex-start' }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      >
        <motion.span
          className="block h-2.5 w-2.5 rounded-full"
          animate={{
            backgroundColor: on ? color : 'var(--ink-low)',
            boxShadow: on ? `0 0 8px ${color}, 0 0 2px ${color}` : '0 0 0 rgba(0,0,0,0)',
          }}
          transition={{ duration: 0.08 }}
        />
      </motion.span>
      {label && (
        <span className="micro-label transition-colors duration-200 group-hover:text-ink-hi">
          {label}
        </span>
      )}
    </button>
  )
}
