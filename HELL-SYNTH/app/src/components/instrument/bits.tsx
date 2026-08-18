/** Small shared UI atoms + value mapping helpers for the instrument surface. */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useEngine } from './engine'

// --- value mapping (normalized 0..1 <-> real units) -------------------------
export const norm = (v: number, min: number, max: number) => Math.min(1, Math.max(0, (v - min) / (max - min)))
export const denorm = (n: number, min: number, max: number) => min + n * (max - min)
export const logNorm = (v: number, min: number, max: number) =>
  Math.min(1, Math.max(0, Math.log(v / min) / Math.log(max / min)))
export const logDenorm = (n: number, min: number, max: number) => min * Math.pow(max / min, n)

export const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`)
export const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`)
export const fmtPct = (v: number) => `${Math.round(v * 100)}%`
export const fmtDb = (db: number) => (db <= -59.5 ? '-60 dB' : `${db > 0 ? '+' : ''}${db.toFixed(0)} dB`)
export const fmtBipolar = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`
export const fmtSec = (s: number) => {
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${String(m).padStart(2, '0')}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// --- segmented control (SMOOTH/FAST, LP24/LP12/BP/HP, LIN/EXP/LOG...) --------
export function SegControl<T extends string>({
  options, value, onChange, accent = 'cyan', className = '',
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  accent?: 'cyan' | 'magenta'
  className?: string
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} role="tablist">
      {options.map((o) => {
        const active = o === value
        return (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o)}
            className={`rounded-[2px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-150 ${
              active
                ? accent === 'cyan'
                  ? 'border-line-bright text-cyan'
                  : 'border-line-bright text-magenta'
                : 'border-transparent text-ink-low hover:text-ink-mid'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

// --- styled <select> used across panels --------------------------------------
export function DarkSelect<T extends string>({
  value, options, onChange, labelFn, className = '', ariaLabel,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  labelFn?: (v: T) => string
  className?: string
  ariaLabel?: string
}) {
  return (
    <select
      aria-label={ariaLabel ?? 'select'}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`cursor-pointer appearance-none rounded-[2px] border border-line-hair bg-display px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-hi shadow-recessed outline-none transition-colors hover:border-line-bright focus:border-line-bright ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-raised">
          {labelFn ? labelFn(o) : o}
        </option>
      ))}
    </select>
  )
}

// --- stepper (OCT −/+ etc.) ---------------------------------------------------
export function Stepper({
  value, display, onDec, onInc, decDisabled, incDisabled, label,
}: {
  value?: string
  display?: string
  onDec: () => void
  onInc: () => void
  decDisabled?: boolean
  incDisabled?: boolean
  label?: string
}) {
  const btn =
    'rounded-[2px] border border-line-hair bg-display px-1.5 py-0.5 font-mono text-[10px] text-ink-mid transition-colors hover:border-line-bright hover:text-ink-hi disabled:opacity-30'
  return (
    <div className="flex items-center gap-1">
      {label && <span className="micro-label mr-1">{label}</span>}
      <button type="button" aria-label="decrease" className={btn} onClick={onDec} disabled={decDisabled}>
        −
      </button>
      <span className="min-w-[2.5ch] text-center font-mono text-[11px] text-ink-hi">{display ?? value}</span>
      <button type="button" aria-label="increase" className={btn} onClick={onInc} disabled={incDisabled}>
        +
      </button>
    </div>
  )
}

// --- module pulse wrapper: ?focus= magenta pulse + crumb-hover cyan pulse ----
export function ModulePulse({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  const { focusModule, crumbHover, registerModule } = useEngine()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    registerModule(id, ref.current)
    return () => registerModule(id, null)
  }, [id, registerModule])
  const focused = focusModule === id
  const hovered = crumbHover === id
  return (
    <motion.div
      ref={ref}
      data-module={id}
      className={`min-h-0 ${className}`}
      animate={
        focused
          ? {
              boxShadow: [
                '0 0 0 1px rgba(255,46,136,0)',
                '0 0 0 1px rgba(255,46,136,0.9), 0 0 18px rgba(255,46,136,0.25)',
                '0 0 0 1px rgba(255,46,136,0)',
                '0 0 0 1px rgba(255,46,136,0.9), 0 0 18px rgba(255,46,136,0.25)',
                '0 0 0 1px rgba(255,46,136,0)',
                '0 0 0 1px rgba(255,46,136,0.9), 0 0 18px rgba(255,46,136,0.25)',
                '0 0 0 1px rgba(255,46,136,0)',
              ],
            }
          : hovered
            ? { boxShadow: '0 0 0 1px rgba(0,229,199,0.7), 0 0 14px rgba(0,229,199,0.18)' }
            : { boxShadow: '0 0 0 1px rgba(255,46,136,0)' }
      }
      transition={focused ? { duration: 3, times: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1] } : { duration: 0.2 }}
      style={{ borderRadius: 4 }}
    >
      {children}
    </motion.div>
  )
}

// --- 2s-breathe engine LED (the only always-on motion besides visualizer) -----
export function EngineLed({ on, color = 'var(--led-green)' }: { on: boolean; color?: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        backgroundColor: on ? color : 'var(--ink-low)',
        boxShadow: on ? `0 0 8px ${color}` : 'none',
        animation: on ? 'vox-led-pulse 1.2s ease-in-out infinite' : 'none',
      }}
    />
  )
}

// --- bipolar mini slider (matrix AMOUNT) --------------------------------------
export function BipolarSlider({
  value, onChange, color = 'var(--accent-magenta)',
}: {
  value: number // -1..1
  onChange: (v: number) => void
  color?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const set = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return
    onChange(Math.min(1, Math.max(-1, ((clientX - r.left) / r.width) * 2 - 1)))
  }
  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="amount"
      aria-valuemin={-100}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(Math.max(-1, value - 0.05))
        if (e.key === 'ArrowRight') onChange(Math.min(1, value + 0.05))
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        set(e.clientX)
        const mv = (ev: PointerEvent) => set(ev.clientX)
        const up = () => {
          window.removeEventListener('pointermove', mv)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', mv)
        window.addEventListener('pointerup', up)
      }}
      className="relative h-3 w-full cursor-ew-resize outline-none"
    >
      <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-line-hair" />
      <div className="absolute left-1/2 top-1/2 h-2 w-px -translate-y-1/2 bg-line-bright" />
      <div
        className="absolute top-1/2 h-[2px] -translate-y-1/2"
        style={{
          backgroundColor: color,
          left: value < 0 ? `${50 + value * 50}%` : '50%',
          width: `${Math.abs(value) * 50}%`,
        }}
      />
      <div
        className="absolute top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-[1px]"
        style={{ backgroundColor: 'var(--ink-hi)', left: `calc(${50 + value * 50}% - 1.5px)` }}
      />
    </div>
  )
}
