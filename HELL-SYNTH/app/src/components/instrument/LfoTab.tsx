/** LFO tab (S7) — shape icons, running phase display, rate/sync/depth knobs. */
import { useRef } from 'react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import type { LfoParams, LfoShape, ModDestId, ModSourceId } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { SegControl, denorm, fmtMs, fmtPct, logDenorm, logNorm, norm } from './bits'
import { MOD_SOURCE_META, ModTarget } from './modMeta'

const SHAPES: LfoShape[] = ['sine', 'tri', 'saw', 'square', 'sh', 'custom']
const DIVISIONS = ['1/1', '1/2', '1/4', '1/8', '1/8T', '1/16', '1/32']

function shapeSample(shape: LfoShape, t: number): number {
  const p = t % 1
  switch (shape) {
    case 'sine': return Math.sin(p * Math.PI * 2)
    case 'tri': return p < 0.5 ? p * 4 - 1 : 3 - p * 4
    case 'saw': return p * 2 - 1
    case 'square': return p < 0.5 ? 1 : -1
    case 'sh': return Math.sin(Math.floor(p * 8) * 12.9898) * 0.9
    case 'custom': return Math.sin(p * Math.PI * 2) * 0.6 + Math.sin(p * Math.PI * 6) * 0.3
  }
}

function ShapeIcon({ shape, active, color }: { shape: LfoShape; active: boolean; color: string }) {
  const W = 30
  const Hh = 18
  let d = ''
  const N = 48
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W
    const y = Hh / 2 - shapeSample(shape, i / N) * (Hh / 2 - 2)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return (
    <svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`}>
      <path d={d} fill="none" stroke={active ? color : 'var(--ink-low)'} strokeWidth={1.2}
        style={active ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined} />
    </svg>
  )
}

function LfoDisplay({ group, color }: { group: 'lfo1' | 'lfo2' | 'lfo3'; color: string }) {
  const { state } = useEngine()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lfoRef = useRef(state[group])
  lfoRef.current = state[group]
  const phase = useRef(0)
  const lastT = useRef(performance.now())

  useTeleFrame(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w === 0) return
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const l = lfoRef.current
    const now = performance.now()
    const dt = (now - lastT.current) / 1000
    lastT.current = now
    const rate = l.syncOn ? 2 : l.rateHz // visual approximation for synced rate
    phase.current = (phase.current + dt * rate) % 1
    // waveform
    ctx.strokeStyle = color
    ctx.lineWidth = 1.2
    ctx.beginPath()
    const N = 96
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w
      const y = h / 2 - shapeSample(l.shape, i / N * 2 + l.phase) * (h / 2 - 4) * (0.3 + l.depth * 0.7)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // running phase dot
    const px = (phase.current % 0.5) * 2 * w
    const py = h / 2 - shapeSample(l.shape, phase.current * 2 + l.phase) * (h / 2 - 4) * (0.3 + l.depth * 0.7)
    ctx.fillStyle = '#F2F0EB'
    ctx.shadowColor = color
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(px, py, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  })

  return (
    <div className="h-[80px] w-[220px] shrink-0 rounded-[4px] bg-display shadow-recessed">
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

export default function LfoTab({ group, source }: { group: 'lfo1' | 'lfo2' | 'lfo3'; source: ModSourceId }) {
  const { state, setParams } = useEngine()
  const l = state[group]
  const color = MOD_SOURCE_META[source].color
  const rateDest: ModDestId = group === 'lfo1' ? 'lfo1Rate' : group === 'lfo2' ? 'lfo2Rate' : 'lfo3Rate'
  const set = (patch: Partial<LfoParams>) => setParams(group, patch)

  return (
    <div className="flex items-start gap-5">
      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex gap-1">
          {SHAPES.map((s) => (
            <button key={s} type="button" title={s.toUpperCase()} onClick={() => set({ shape: s })}
              className={`rounded-[2px] border p-0.5 transition-colors ${
                l.shape === s ? 'border-line-bright bg-raised' : 'border-line-hair hover:border-line-bright'
              }`}>
              <ShapeIcon shape={s} active={l.shape === s} color={color} />
            </button>
          ))}
        </div>
        <LfoDisplay group={group} color={color} />
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-1">
        <ModTarget dest={rateDest}>
          <Knob label="RATE" value={logNorm(l.rateHz, 0.01, 20)} defaultValue={logNorm(1.2, 0.01, 20)}
            onChange={(v) => set({ rateHz: logDenorm(v, 0.01, 20) })}
            formatValue={(v) => (l.syncOn ? l.syncDivision : `${logDenorm(v, 0.01, 20).toFixed(2)} Hz`)}
            accentColor={color} />
        </ModTarget>
        <Knob label="DEPTH" value={l.depth} defaultValue={0.3}
          onChange={(v) => set({ depth: v })} formatValue={fmtPct} accentColor={color} />
        <Knob label="PHASE" value={l.phase} defaultValue={0}
          onChange={(v) => set({ phase: v })} formatValue={fmtPct} accentColor={color} />
        <Knob label="DELAY" value={norm(l.delayMs, 0, 2000)} defaultValue={0}
          onChange={(v) => set({ delayMs: denorm(v, 0, 2000) })}
          formatValue={(v) => fmtMs(denorm(v, 0, 2000))} accentColor={color} />
        <Knob label="SMOOTH" value={l.smooth} defaultValue={group === 'lfo3' ? 0.3 : 0}
          onChange={(v) => set({ smooth: v })} formatValue={fmtPct} accentColor={color} />
        <div className="flex flex-col justify-start gap-1.5 pt-4">
          <LEDToggle on={l.syncOn} onChange={(on) => set({ syncOn: on })} label="SYNC" color={color} />
          {l.syncOn && (
            <SegControl
              options={DIVISIONS}
              value={DIVISIONS.includes(l.syncDivision) ? l.syncDivision : '1/4'}
              onChange={(d) => set({ syncDivision: d })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
