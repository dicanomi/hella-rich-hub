/** Serum-style AHDSR envelope editor with 5 draggable nodes + two-way knob binding. */
import { useEffect, useRef, useState } from 'react'
import Knob from '@/components/controls/Knob'
import type { EnvCurve, EnvParams } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { SegControl, denorm, fmtMs, fmtPct, norm } from './bits'

const MAXES = { attackMs: 4000, holdMs: 2000, decayMs: 4000, releaseMs: 8000 }
const CURVES: { id: EnvCurve; label: string }[] = [
  { id: 'lin', label: 'LIN' },
  { id: 'exp', label: 'EXP' },
  { id: 'log', label: 'LOG' },
]
const H = 140

type Stage = 'attackMs' | 'holdMs' | 'decayMs' | 'releaseMs'

/** per-stage progress easing by curve type */
function ease(curve: EnvCurve, t: number, falling: boolean): number {
  switch (curve) {
    case 'lin': return t
    case 'exp': return falling ? Math.pow(1 - t, 2.5) : Math.pow(t, 0.4)
    case 'log': return falling ? 1 - Math.pow(t, 2.5) : Math.pow(t, 2.5)
  }
}

export default function EnvEditor({ group, color }: { group: 'env1' | 'env2'; color: string }) {
  const { state, setParams } = useEngine()
  const env = state[group]
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(560)
  const playheadRef = useRef<SVGLineElement>(null)
  const noteStart = useRef<number | null>(null)
  const wasGate = useRef(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // geometry
  const pad = 12
  const totalW = Math.max(100, w - pad * 2)
  const fr = (t: number, max: number) => Math.sqrt(Math.max(0, t) / max)
  const parts = [
    fr(env.attackMs, MAXES.attackMs),
    fr(env.holdMs, MAXES.holdMs) * 0.7,
    fr(env.decayMs, MAXES.decayMs),
    0.35, // sustain plateau (fixed)
    fr(env.releaseMs, MAXES.releaseMs),
  ]
  const sum = parts.reduce((a, b) => a + b, 0) || 1
  const scale = totalW / sum
  const ws = parts.map((p) => Math.max(3, p * scale))
  const yOf = (level: number) => H - 10 - level * (H - 24)

  const x0 = pad
  const x1 = x0 + ws[0] // attack peak
  const x2 = x1 + ws[1] // hold end
  const x3 = x2 + ws[2] // decay end (sustain level)
  const x4 = x3 + ws[3] // release start
  const x5 = Math.min(w - pad, x4 + ws[4]) // release end

  // path with curve shapes
  const path = (() => {
    const pts: string[] = [`M ${x0} ${yOf(0)}`]
    const seg = (xa: number, ya: number, xb: number, yb: number, falling: boolean) => {
      const N = 14
      for (let i = 1; i <= N; i++) {
        const t = i / N
        const e = ease(env.curve, t, falling)
        const x = xa + (xb - xa) * t
        const y = falling ? ya + (yb - ya) * (1 - e) : ya + (yb - ya) * e
        pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`)
      }
    }
    seg(x0, yOf(0), x1, yOf(1), false) // attack
    pts.push(`L ${x2} ${yOf(1)}`) // hold
    seg(x2, yOf(1), x3, yOf(env.sustain), true) // decay
    pts.push(`L ${x4} ${yOf(env.sustain)}`) // sustain
    seg(x4, yOf(env.sustain), x5, yOf(0), true) // release
    return pts.join(' ')
  })()

  // note playhead
  useTeleFrame((t) => {
    const gate = t.pitch.gateOpen
    if (gate && !wasGate.current) noteStart.current = performance.now()
    if (!gate) noteStart.current = null
    wasGate.current = gate
    const el = playheadRef.current
    if (!el) return
    if (noteStart.current === null) {
      el.style.opacity = '0'
      return
    }
    const totalSec = (env.attackMs + env.holdMs + env.decayMs + env.releaseMs) / 1000 + 0.4
    const tSec = (performance.now() - noteStart.current) / 1000
    if (tSec > totalSec) {
      el.style.opacity = '0'
      return
    }
    // map time to x across stage boundaries
    const ms = tSec * 1000
    let x = x0
    if (ms < env.attackMs) x = x0 + (ms / Math.max(1, env.attackMs)) * ws[0]
    else if (ms < env.attackMs + env.holdMs) x = x1 + ((ms - env.attackMs) / Math.max(1, env.holdMs)) * ws[1]
    else if (ms < env.attackMs + env.holdMs + env.decayMs) x = x2 + ((ms - env.attackMs - env.holdMs) / Math.max(1, env.decayMs)) * ws[2]
    else if (ms < env.attackMs + env.holdMs + env.decayMs + 400) x = x3 + ((ms - env.attackMs - env.holdMs - env.decayMs) / 400) * ws[3]
    else x = x4 + ((ms - env.attackMs - env.holdMs - env.decayMs - 400) / Math.max(1, env.releaseMs)) * ws[4]
    el.style.opacity = '1'
    el.setAttribute('x1', String(x))
    el.setAttribute('x2', String(x))
  })

  const dragNode = (e: React.PointerEvent, stage: Stage | 'sustain') => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const orig = { ...env }
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (stage === 'sustain') {
        const newLevel = Math.min(1, Math.max(0, orig.sustain - dy / (H - 24)))
        setParams(group, { sustain: newLevel })
        return
      }
      const max = MAXES[stage]
      const origFrac = fr(orig[stage], max)
      const idx = stage === 'attackMs' ? 0 : stage === 'holdMs' ? 1 : stage === 'decayMs' ? 2 : 4
      const origW = Math.max(3, origFrac * (idx === 1 ? 0.7 : 1) * scale)
      const newW = Math.max(0, origW + dx)
      const newFrac = newW / (scale * (idx === 1 ? 0.7 : 1))
      const newMs = Math.min(max, Math.round(newFrac * newFrac * max))
      setParams(group, { [stage]: newMs } as Partial<EnvParams>)
    }
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  const renderNode = (x: number, y: number, stage: Stage | 'sustain', label: string) => (
    <g
      key={stage}
      onPointerDown={(e) => dragNode(e, stage)}
      className="cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <circle cx={x} cy={y} r={8} fill="transparent" />
      <circle cx={x} cy={y} r={3.5} fill="#F2F0EB" stroke={color} strokeWidth={1.5}>
        <title>{label}</title>
      </circle>
    </g>
  )

  return (
    <div>
      <div ref={wrapRef} className="rounded-[4px] bg-display shadow-recessed">
        <svg width={w} height={H} className="block">
          {/* grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={w} y1={H * g} y2={H * g} stroke="var(--line-hair)" strokeWidth={1} opacity={0.5} />
          ))}
          <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={`${path} L ${x5} ${yOf(0)} Z`} fill={color} opacity={0.06} stroke="none" />
          <line ref={playheadRef} x1={-10} x2={-10} y1={6} y2={H - 6} stroke="#FF2E88" strokeWidth={1} opacity={0} />
          {renderNode(x1, yOf(1), 'attackMs', 'attack')}
          {renderNode(x2, yOf(1), 'holdMs', 'hold')}
          {renderNode(x3, yOf(env.sustain), 'decayMs', 'decay')}
          {renderNode((x3 + x4) / 2, yOf(env.sustain), 'sustain', 'sustain (drag vertically)')}
          {renderNode(x5, yOf(0), 'releaseMs', 'release')}
        </svg>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <Knob size="mini" label="ATK" value={norm(env.attackMs, 0, MAXES.attackMs)}
            onChange={(v) => setParams(group, { attackMs: denorm(v, 0, MAXES.attackMs) })}
            formatValue={(v) => fmtMs(denorm(v, 0, MAXES.attackMs))} accentColor={color} />
          <Knob size="mini" label="HOLD" value={norm(env.holdMs, 0, MAXES.holdMs)}
            onChange={(v) => setParams(group, { holdMs: denorm(v, 0, MAXES.holdMs) })}
            formatValue={(v) => fmtMs(denorm(v, 0, MAXES.holdMs))} accentColor={color} />
          <Knob size="mini" label="DEC" value={norm(env.decayMs, 0, MAXES.decayMs)}
            onChange={(v) => setParams(group, { decayMs: denorm(v, 0, MAXES.decayMs) })}
            formatValue={(v) => fmtMs(denorm(v, 0, MAXES.decayMs))} accentColor={color} />
          <Knob size="mini" label="SUS" value={env.sustain}
            onChange={(v) => setParams(group, { sustain: v })}
            formatValue={fmtPct} accentColor={color} />
          <Knob size="mini" label="REL" value={norm(env.releaseMs, 0, MAXES.releaseMs)}
            onChange={(v) => setParams(group, { releaseMs: denorm(v, 0, MAXES.releaseMs) })}
            formatValue={(v) => fmtMs(denorm(v, 0, MAXES.releaseMs))} accentColor={color} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="micro-label">CURVE</span>
          <SegControl
            options={CURVES.map((c) => c.label)}
            value={CURVES.find((c) => c.id === env.curve)?.label ?? 'EXP'}
            onChange={(label) => {
              const c = CURVES.find((x) => x.label === label)
              if (c) setParams(group, { curve: c.id })
            }}
          />
        </div>
      </div>
    </div>
  )
}
