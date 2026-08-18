/** HUMAN tab — smooth random wander mod source. New random target each
 *  interval, glided toward with a one-pole; route it anywhere in the matrix
 *  for drift, strangeness, and human touch. */
import { useRef } from 'react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import type { HumanParams } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { SegControl, fmtPct, logDenorm, logNorm } from './bits'
import { MOD_SOURCE_META } from './modMeta'

const DIVISIONS = ['1/1', '1/2', '1/4', '1/8', '1/8T', '1/16', '1/32']
const COLOR = MOD_SOURCE_META.human.color

/** Live wander trace — history of the engine's human value. */
function HumanDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hist = useRef<number[]>([])
  const lastPush = useRef(0)

  useTeleFrame((t) => {
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
    const now = performance.now()
    if (now - lastPush.current > 33) {
      lastPush.current = now
      hist.current.push(t.mod.human ?? 0)
      if (hist.current.length > 120) hist.current.shift()
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // center line
    ctx.strokeStyle = 'rgba(142,142,150,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    // wander trace
    const data = hist.current
    if (data.length > 1) {
      ctx.strokeStyle = COLOR
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w
        const y = h / 2 - data[i] * (h / 2 - 5)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // head dot
      const last = data[data.length - 1]
      ctx.fillStyle = '#F2F0EB'
      ctx.shadowColor = COLOR
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(w - 2, h / 2 - last * (h / 2 - 5), 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  })

  return (
    <div className="h-[80px] w-[220px] shrink-0 rounded-[4px] bg-display shadow-recessed">
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

export default function HumanTab() {
  const { state, setParams } = useEngine()
  const hp = state.human
  const set = (patch: Partial<HumanParams>) => setParams('human', patch)

  return (
    <div className="flex items-start gap-5">
      <div className="flex shrink-0 flex-col gap-2">
        <div className="micro-label" style={{ color: COLOR }}>
          RANDOM WANDER — SMOOTH, UNPREDICTABLE, ALIVE
        </div>
        <HumanDisplay />
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-1">
        <Knob label="RATE" value={logNorm(hp.rateHz, 0.05, 8)} defaultValue={logNorm(0.5, 0.05, 8)}
          onChange={(v) => set({ rateHz: logDenorm(v, 0.05, 8) })}
          formatValue={(v) => (hp.syncOn ? hp.syncDivision : `${logDenorm(v, 0.05, 8).toFixed(2)} Hz`)}
          accentColor={COLOR} />
        <Knob label="DEPTH" value={hp.depth} defaultValue={0.5}
          onChange={(v) => set({ depth: v })} formatValue={fmtPct} accentColor={COLOR} />
        <div className="flex flex-col justify-start gap-1.5 pt-4">
          <LEDToggle on={hp.syncOn} onChange={(on) => set({ syncOn: on })} label="SYNC" color={COLOR} />
          {hp.syncOn && (
            <SegControl
              options={DIVISIONS}
              value={DIVISIONS.includes(hp.syncDivision) ? hp.syncDivision : '1/4'}
              onChange={(d) => set({ syncDivision: d })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
