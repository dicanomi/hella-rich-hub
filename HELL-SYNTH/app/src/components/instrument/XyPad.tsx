/** XY pad + macros (S9) — phosphor-trail performance surface, 4 renameable macros.
 *  DRIFT retargets the node to a random spot on a segment clock; the pad's own
 *  physics glides it there, so the FX breathes on its own. */
import { useEffect, useRef, useState } from 'react'
import LEDToggle from '@/components/controls/LEDToggle'
import Knob from '@/components/controls/Knob'
import ModuleSection from '@/components/controls/ModuleSection'
import type { ModDestId, XyDriftMode } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { DarkSelect, SegControl, fmtPct } from './bits'
import { MOD_DESTS, MOD_DEST_LABELS } from './modMeta'

/** Drift segment length in seconds. Free: slow 6s / med 3s / fast 1.2s.
 *  Synced: slow 2 bars / med 1 bar / fast 2 beats. */
function driftSegmentSec(mode: XyDriftMode, sync: boolean, bpm: number): number {
  if (sync) {
    const beat = 60 / bpm
    return mode === 'slow' ? beat * 8 : mode === 'med' ? beat * 4 : beat * 2
  }
  return mode === 'slow' ? 6 : mode === 'med' ? 3 : 1.2
}

function XyPadSurface() {
  const { state, setParams, engine, bpm } = useEngine()
  const padRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLCanvasElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const readX = useRef<HTMLSpanElement>(null)
  const readY = useRef<HTMLSpanElement>(null)
  const pos = useRef({ x: state.xy.x, y: state.xy.y })
  const target = useRef({ x: state.xy.x, y: state.xy.y })
  const dragging = useRef(false)
  const gateOpen = useRef(false)
  const driftClock = useRef(0)
  const lastFrameT = useRef(performance.now())
  const driftRef = useRef({ mode: state.xy.drift, sync: state.xy.driftSync, bpm })
  driftRef.current = { mode: state.xy.drift, sync: state.xy.driftSync, bpm }

  // external (preset) changes — but while DRIFT is running the pad owns the node
  useEffect(() => {
    if (!dragging.current && state.xy.drift === 'off') {
      pos.current = { x: state.xy.x, y: state.xy.y }
      target.current = { x: state.xy.x, y: state.xy.y }
    }
  }, [state.xy.x, state.xy.y, state.xy.drift])

  // spring return on release (no HOLD, no DRIFT — drift keeps wandering)
  const release = () => {
    dragging.current = false
    if (!state.xy.hold && state.xy.drift === 'off') target.current = { x: 0.5, y: 0.5 }
  }

  useTeleFrame((t) => {
    gateOpen.current = t.pitch.gateOpen
    // drift clock: pick a new random destination each segment
    const nowMs = performance.now()
    const dtSec = Math.min(0.1, (nowMs - lastFrameT.current) / 1000)
    lastFrameT.current = nowMs
    const d = driftRef.current
    if (d.mode !== 'off' && !dragging.current) {
      driftClock.current += dtSec
      if (driftClock.current >= driftSegmentSec(d.mode, d.sync, d.bpm)) {
        driftClock.current = 0
        target.current = { x: 0.08 + Math.random() * 0.84, y: 0.08 + Math.random() * 0.84 }
      }
    } else {
      driftClock.current = 0
    }
    // 120ms physics smoothing
    pos.current.x += (target.current.x - pos.current.x) * 0.18
    pos.current.y += (target.current.y - pos.current.y) * 0.18
    const pad = padRef.current
    if (!pad) return
    const w = pad.clientWidth
    const h = pad.clientHeight
    if (orbRef.current) {
      orbRef.current.style.transform = `translate(${pos.current.x * w - 8}px, ${(1 - pos.current.y) * h - 8}px)`
      orbRef.current.style.opacity = gateOpen.current ? '1' : '0.5'
    }
    if (readX.current) readX.current.textContent = `X ${pos.current.x.toFixed(2)}`
    if (readY.current) readY.current.textContent = `Y ${pos.current.y.toFixed(2)}`
    // push into the engine (xy feeds its assigned dests)
    pushToEngine()
    // phosphor trail (600ms decay)
    const canvas = trailRef.current
    if (canvas) {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,0.09)' // ~600ms fade at 60fps
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(255,46,136,0.5)'
        ctx.beginPath()
        ctx.arc(pos.current.x * w, (1 - pos.current.y) * h, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })

  // Engine writes every frame are cheap; React state syncs via 300ms debounce
  // so a pad drag doesn't re-render the whole panel tree at display rate.
  const syncTimer = useRef<number>(0)
  const lastPush = useRef({ x: -1, y: -1 })
  const pushToEngine = () => {
    const x = Math.round(pos.current.x * 100) / 100
    const y = Math.round(pos.current.y * 100) / 100
    if (x === lastPush.current.x && y === lastPush.current.y) return
    lastPush.current = { x, y }
    engine.setParams('xy', { x, y })
    window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(() => setParams('xy', { x, y }), 300)
  }

  const grab = (clientX: number, clientY: number) => {
    const r = padRef.current?.getBoundingClientRect()
    if (!r) return
    target.current = {
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height)),
    }
  }

  return (
    <div
      ref={padRef}
      className="relative aspect-square w-full cursor-crosshair touch-none overflow-hidden rounded-[4px] bg-display shadow-recessed"
      onPointerDown={(e) => {
        e.preventDefault()
        dragging.current = true
        grab(e.clientX, e.clientY)
        const mv = (ev: PointerEvent) => grab(ev.clientX, ev.clientY)
        const up = () => {
          window.removeEventListener('pointermove', mv)
          window.removeEventListener('pointerup', up)
          release()
        }
        window.addEventListener('pointermove', mv)
        window.addEventListener('pointerup', up)
      }}
    >
      {/* 3×3 crosshair grid */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {[1, 2].map((i) => (
          <g key={i} stroke="var(--line-hair)" strokeWidth={1}>
            <line x1={`${(i / 3) * 100}%`} y1="0" x2={`${(i / 3) * 100}%`} y2="100%" />
            <line x1="0" y1={`${(i / 3) * 100}%`} x2="100%" y2={`${(i / 3) * 100}%`} />
          </g>
        ))}
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--line-bright)" strokeWidth={1} opacity={0.5} />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--line-bright)" strokeWidth={1} opacity={0.5} />
      </svg>
      <canvas ref={trailRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      <div
        ref={orbRef}
        className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-full bg-magenta"
        style={{ boxShadow: '0 0 12px rgba(255,46,136,0.7), 0 0 4px rgba(255,46,136,0.9)' }}
      />
      <span ref={readX} className="absolute bottom-1 left-2 font-mono text-[9px] text-ink-low">X 0.50</span>
      <span ref={readY} className="absolute bottom-1 right-2 font-mono text-[9px] text-ink-low">Y 0.50</span>
    </div>
  )
}

function MacroKnob({ index }: { index: number }) {
  const { state, commit } = useEngine()
  const [editing, setEditing] = useState(false)
  const name = state.macroNames[index]
  const value = state.macros[index]
  const followerFed = index === 0 && state.matrix.some((r) => r.source === 'macro1' && r.enabled)

  return (
    <div className="flex flex-col items-center">
      <Knob
        label={editing ? undefined : name}
        value={value}
        defaultValue={0.5}
        onChange={(v) =>
          commit((d) => {
            d.macros[index] = Math.round(v * 100) / 100
          })
        }
        formatValue={fmtPct}
        accentColor="var(--accent-magenta)"
      />
      {editing ? (
        <input
          autoFocus
          defaultValue={name}
          maxLength={8}
          onBlur={(e) => {
            commit((d) => {
              d.macroNames[index] = e.target.value.toUpperCase() || `MACRO ${index + 1}`
            })
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="mt-1 w-16 rounded-[2px] border border-line-bright bg-display px-1 text-center font-mono text-[9px] uppercase text-ink-hi outline-none"
        />
      ) : (
        <button
          type="button"
          onDoubleClick={() => setEditing(true)}
          title="Double-click to rename"
          className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-low hover:text-ink-mid"
        >
          {followerFed ? 'FOLLOWER→' : `M${index + 1}`}
        </button>
      )}
    </div>
  )
}

export default function XyPad() {
  const { state, setParams } = useEngine()
  return (
    <ModuleSection
      title="XY PAD"
      ledOn
      ledColor="var(--accent-magenta)"
      headerRight={
        <LEDToggle on={state.xy.hold} onChange={(on) => setParams('xy', { hold: on })} label="HOLD"
          color="var(--accent-magenta)" />
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <DarkSelect<ModDestId> ariaLabel="x axis destination" value={state.xy.xDest} options={MOD_DESTS}
          labelFn={(d) => `X: ${MOD_DEST_LABELS[d]}`} onChange={(d) => setParams('xy', { xDest: d })} className="flex-1" />
        <DarkSelect<ModDestId> ariaLabel="y axis destination" value={state.xy.yDest} options={MOD_DESTS}
          labelFn={(d) => `Y: ${MOD_DEST_LABELS[d]}`} onChange={(d) => setParams('xy', { yDest: d })} className="flex-1" />
      </div>
      <XyPadSurface />
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-hair pt-3">
        <span className="micro-label shrink-0" title="Auto-glide the node to a random spot every segment — the FX breathes on its own">
          DRIFT
        </span>
        <SegControl<XyDriftMode>
          options={['off', 'slow', 'med', 'fast']}
          value={state.xy.drift}
          onChange={(m) => setParams('xy', { drift: m })}
          accent="magenta"
          className="flex-1"
        />
        <LEDToggle
          on={state.xy.driftSync}
          onChange={(on) => setParams('xy', { driftSync: on })}
          label="SYNC"
          color="var(--accent-magenta)"
        />
      </div>
      <div className="mt-4 border-t border-line-hair pt-3">
        <span className="micro-label mb-2 block">MACROS</span>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3].map((i) => (
            <MacroKnob key={i} index={i} />
          ))}
        </div>
      </div>
    </ModuleSection>
  )
}
