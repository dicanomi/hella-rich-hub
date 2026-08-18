import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export type KnobSize = 'hero' | 'large' | 'standard' | 'mini'

export interface KnobProps {
  /** Normalized value, 0–1 */
  value: number
  onChange: (v: number) => void
  /** Reset target for double-click (defaults to 0.5) */
  defaultValue?: number
  size?: KnobSize
  label?: string
  unit?: string
  /** Maps normalized 0–1 → display string */
  formatValue?: (v: number) => string
  /** Value-arc color (defaults to --accent-magenta) */
  accentColor?: string
  disabled?: boolean
  className?: string
}

const PX: Record<KnobSize, number> = { hero: 96, large: 64, standard: 44, mini: 32 }
const DRAG_RANGE = 150 // px of vertical travel for the full 0–1 range
const ARROW_STEP = 0.02
const WHEEL_STEP = 0.05

// 270° sweep: 135° → 405° (dead zone at the bottom), rendered on a 64×64 viewBox
const VB = 64
const CX = VB / 2
const CY = VB / 2
const R = 27 // arc radius
const ARC_FRACTION = 270 / 360
const ARC_LEN = 2 * Math.PI * R * ARC_FRACTION
const CIRC = 2 * Math.PI * R

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The shared bx_glue-style knob (design.md §7.1). Graphite body, 270° magenta
 * value arc with rounded cap, Fragment Mono readout. Dual-axis drag — vertical
 * (up = more) AND horizontal (right = more), 150px full range, shift = fine
 * ×0.1 — double-click reset, wheel step, full keyboard control, role="slider".
 */
export default function Knob({
  value,
  onChange,
  defaultValue = 0.5,
  size = 'standard',
  label,
  unit,
  formatValue,
  accentColor = 'var(--accent-magenta)',
  disabled = false,
  className = '',
}: KnobProps) {
  const px = PX[size]
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const drag = useRef({ startX: 0, startY: 0, startValue: 0, active: false })
  const rootRef = useRef<HTMLDivElement>(null)

  // Spring-smoothed display value (bx_glue "tactile" feel)
  const target = useMotionValue(clamp01(value))
  useEffect(() => {
    target.set(clamp01(value))
  }, [value, target])
  const v = useSpring(target, { stiffness: 500, damping: 35 })

  const dashArray = useTransform(v, (x) => `${x * ARC_LEN} ${CIRC}`)
  const indicatorRotate = useTransform(v, (x) => `rotate(${-135 + x * 270} ${CX} ${CY})`)

  const commit = useCallback(
    (next: number) => {
      const c = clamp01(next)
      if (c !== value) onChange(c)
    },
    [onChange, value],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    rootRef.current?.focus()
    drag.current = { startX: e.clientX, startY: e.clientY, startValue: value, active: true }
    setDragging(true)
    const onMove = (ev: PointerEvent) => {
      if (!drag.current.active) return
      const fine = ev.shiftKey ? 0.1 : 1
      // dual-axis: vertical up AND horizontal right both increase the value
      const dv = ((drag.current.startY - ev.clientY + (ev.clientX - drag.current.startX)) / DRAG_RANGE) * fine
      commit(drag.current.startValue + dv)
    }
    const onUp = () => {
      drag.current.active = false
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Non-passive wheel listener so we can preventDefault page scroll
  useEffect(() => {
    const el = rootRef.current
    if (!el || disabled) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      commit(value + (e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [commit, disabled, value])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = e.shiftKey ? ARROW_STEP * 0.1 : ARROW_STEP
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        e.preventDefault()
        commit(value + step)
        break
      case 'ArrowDown':
      case 'ArrowLeft':
        e.preventDefault()
        commit(value - step)
        break
      case 'PageUp':
        e.preventDefault()
        commit(value + 0.1)
        break
      case 'PageDown':
        e.preventDefault()
        commit(value - 0.1)
        break
      case 'Home':
        e.preventDefault()
        commit(0)
        break
      case 'End':
        e.preventDefault()
        commit(1)
        break
    }
  }

  const display =
    formatValue?.(clamp01(value)) ?? `${Math.round(clamp01(value) * 100)}${unit ? ` ${unit}` : ''}`

  const active = dragging
  const insideReadout = size === 'hero' || size === 'large'
  const arcGlow = active || hovered

  return (
    <div className={`flex select-none flex-col items-center gap-1.5 ${className}`}>
      {label && (
        <span
          className="micro-label"
          style={active ? { color: 'var(--ink-hi)' } : undefined}
        >
          {label}
        </span>
      )}

      <div
        ref={rootRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label ?? 'knob'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamp01(value) * 100)}
        aria-valuetext={display}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onDoubleClick={() => !disabled && commit(defaultValue)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative rounded-full outline-none transition-[filter] duration-150 focus-visible:ring-1 focus-visible:ring-magenta"
        style={{
          width: px,
          height: px,
          cursor: disabled ? 'default' : 'ns-resize',
          opacity: disabled ? 0.4 : 1,
          touchAction: 'none',
        }}
      >
        <svg width={px} height={px} viewBox={`0 0 ${VB} ${VB}`} className="block">
          <defs>
            <radialGradient id="knob-body" cx="50%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#26262E" />
              <stop offset="60%" stopColor="#1A1A20" />
              <stop offset="100%" stopColor="#121216" />
            </radialGradient>
          </defs>

          {/* arc track (270°, dead zone at bottom) */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--line-hair)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN} ${CIRC}`}
            transform={`rotate(135 ${CX} ${CY})`}
          />
          {/* value arc */}
          <motion.circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={accentColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            transform={`rotate(135 ${CX} ${CY})`}
            style={{
              filter: arcGlow ? `drop-shadow(0 0 5px ${accentColor})` : 'none',
              transition: 'filter 150ms ease',
            }}
          />

          {/* knob body */}
          <circle cx={CX} cy={CY} r={20} fill="url(#knob-body)" />
          {/* 1px top highlight */}
          <path
            d={`M ${CX - 13} ${CY - 13.5} A 18.5 18.5 0 0 1 ${CX + 13} ${CY - 13.5}`}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
          {/* indicator line */}
          <motion.g style={{ transform: indicatorRotate }}>
            <line
              x1={CX}
              y1={CY - 8}
              x2={CX}
              y2={CY - 17}
              stroke={active || hovered ? 'var(--ink-hi)' : 'var(--ink-mid)'}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </motion.g>
        </svg>

        {insideReadout && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[16%] text-center font-mono text-[10px] leading-none text-ink-mid">
            {display}
          </div>
        )}

        {/* drag tooltip */}
        {dragging && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-[2px] border border-line-bright bg-raised px-2 py-1 font-mono text-[11px] text-ink-hi shadow-knob">
            {display}
            {unit && formatValue ? ` ${unit}` : ''}
          </div>
        )}
      </div>

      {!insideReadout && (
        <span
          className="font-mono text-[12px] leading-none transition-colors duration-150"
          style={{ color: active ? 'var(--ink-hi)' : 'var(--ink-mid)' }}
        >
          {display}
        </span>
      )}
    </div>
  )
}
