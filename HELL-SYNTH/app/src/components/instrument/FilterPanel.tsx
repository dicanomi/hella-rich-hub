/** Ladder Filter panel (S6) — 96px hero CUTOFF + live response-curve XY surface. */
import { useRef } from 'react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import ModuleSection from '@/components/controls/ModuleSection'
import type { FilterMode } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { SegControl, denorm, fmtBipolar, fmtPct, logDenorm, logNorm, norm } from './bits'
import { ModTarget } from './modMeta'

const FMIN = 20
const FMAX = 20000
const MODES: { id: FilterMode; label: string }[] = [
  { id: 'lp24', label: 'LP24' },
  { id: 'lp12', label: 'LP12' },
  { id: 'bp', label: 'BP' },
  { id: 'hp', label: 'HP' },
]

/** Live filter response curve; doubles as XY surface (x=cutoff, y=resonance). */
function FilterCurve() {
  const { state, setParams } = useEngine()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const filterRef = useRef(state.filter)
  filterRef.current = state.filter

  useTeleFrame(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w === 0 || h === 0) return
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const f = filterRef.current
    const fc = f.cutoffHz
    const res = f.resonance
    const logMin = Math.log(FMIN)
    const logMax = Math.log(FMAX)
    const gain = (hz: number) => {
      const x = hz / fc
      switch (f.mode) {
        case 'lp24': return 1 / Math.sqrt(1 + Math.pow(x, 8))
        case 'lp12': return 1 / Math.sqrt(1 + Math.pow(x, 4))
        case 'hp': return 1 / Math.sqrt(1 + Math.pow(1 / x, 8))
        case 'bp': return 1 / Math.sqrt(1 + Math.pow((x - 1 / x) * 3, 2))
      }
    }
    // grid
    ctx.strokeStyle = 'rgba(38,38,44,0.8)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (h / 4) * i)
      ctx.lineTo(w, (h / 4) * i)
      ctx.stroke()
    }
    // curve
    ctx.strokeStyle = '#00E5C7'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const N = 96
    for (let i = 0; i <= N; i++) {
      const hz = Math.exp(logMin + (i / N) * (logMax - logMin))
      let g = gain(hz)
      // resonance bump near cutoff
      const bump = res * 0.9 * Math.exp(-Math.pow((Math.log(hz / fc) / 0.35), 2))
      g = Math.min(1.4, g + bump * gain(Math.max(hz, fc)))
      const x = (i / N) * w
      const y = h - (g / 1.4) * (h - 8) - 4
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // cutoff dot
    const dx = (Math.log(fc) - logMin) / (logMax - logMin)
    const dotG = Math.min(1.4, gain(fc) + res * 0.9)
    const dy = h - (dotG / 1.4) * (h - 8) - 4
    ctx.fillStyle = '#FF2E88'
    ctx.shadowColor = '#FF2E88'
    ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.arc(dx * w, dy, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  })

  const drag = (clientX: number, clientY: number) => {
    const r = canvasRef.current?.getBoundingClientRect()
    if (!r) return
    const nx = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const ny = Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height))
    setParams('filter', { cutoffHz: logDenorm(nx, FMIN, FMAX), resonance: ny })
  }

  return (
    <div
      className="relative min-h-[96px] flex-1 self-stretch cursor-move overflow-hidden rounded-[4px] bg-display shadow-recessed"
      title="Drag: X = cutoff, Y = resonance"
      onPointerDown={(e) => {
        e.preventDefault()
        drag(e.clientX, e.clientY)
        const mv = (ev: PointerEvent) => drag(ev.clientX, ev.clientY)
        const up = () => {
          window.removeEventListener('pointermove', mv)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', mv)
        window.addEventListener('pointerup', up)
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  )
}

export default function FilterPanel() {
  const { state, setParams } = useEngine()
  const f = state.filter
  const selfOsc = f.resonance > 0.85

  return (
    <ModuleSection
      title="LADDER FILTER"
      ledOn={f.enabled}
      headerRight={
        <>
          <SegControl
            options={MODES.map((m) => m.label) as unknown as readonly string[]}
            value={MODES.find((m) => m.id === f.mode)?.label ?? 'LP24'}
            onChange={(label) => {
              const m = MODES.find((x) => x.label === label)
              if (m) setParams('filter', { mode: m.id })
            }}
          />
          <LEDToggle on={f.enabled} onChange={(on) => setParams('filter', { enabled: on })} />
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center">
          <ModTarget dest="cutoff" knobPx={96}>
            <Knob
              size="hero"
              label="CUTOFF"
              value={logNorm(f.cutoffHz, FMIN, FMAX)}
              defaultValue={logNorm(1200, FMIN, FMAX)}
              onChange={(v) => setParams('filter', { cutoffHz: logDenorm(v, FMIN, FMAX) })}
              formatValue={(v) => {
                const hz = logDenorm(v, FMIN, FMAX)
                return hz >= 1000 ? `${(hz / 1000).toFixed(2)}k` : `${Math.round(hz)}`
              }}
              unit="Hz"
            />
          </ModTarget>
        </div>
        <FilterCurve />
        <div className="grid shrink-0 grid-cols-1 gap-2">
          <ModTarget dest="resonance">
            <div className="relative">
              <Knob label="RESONANCE" value={f.resonance} defaultValue={0.25}
                onChange={(v) => setParams('filter', { resonance: v })}
                formatValue={(v) => (v > 0.85 ? 'SELF-OSC' : fmtPct(v))}
                accentColor={selfOsc ? 'var(--signal-red)' : 'var(--accent-magenta)'} />
              {selfOsc && (
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 animate-pulse font-mono text-[8px] uppercase text-signal-red">
                  SELF-OSC
                </span>
              )}
            </div>
          </ModTarget>
          <ModTarget dest="filterDrive">
            <Knob label="DRIVE" value={f.drive} defaultValue={0.2}
              onChange={(v) => setParams('filter', { drive: v })} formatValue={fmtPct} />
          </ModTarget>
          <Knob label="KEY TRACK" value={f.keyTrack} defaultValue={0.3}
            onChange={(v) => setParams('filter', { keyTrack: v })} formatValue={fmtPct} />
          <Knob label="ENV AMT" value={norm(f.envAmt, -1, 1)} defaultValue={norm(0.3, -1, 1)}
            onChange={(v) => setParams('filter', { envAmt: denorm(v, -1, 1) })}
            formatValue={(v) => fmtBipolar(denorm(v, -1, 1))}
            accentColor={f.envAmt < 0 ? 'var(--env-2)' : 'var(--accent-magenta)'} />
        </div>
      </div>
    </ModuleSection>
  )
}
