/** Modulation source/destination metadata — labels, colors, drag-and-drop. */
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ModDestId, ModSourceId } from '@/audio'
import { useEngine, useTeleFrame } from './engine'

export const MOD_SOURCE_META: Record<ModSourceId, { label: string; color: string }> = {
  env1: { label: 'ENV 1', color: 'var(--env-1)' },
  env2: { label: 'ENV 2', color: 'var(--env-2)' },
  lfo1: { label: 'LFO 1', color: 'var(--lfo-1)' },
  lfo2: { label: 'LFO 2', color: 'var(--lfo-2)' },
  lfo3: { label: 'LFO 3', color: 'var(--lfo-3)' },
  follower: { label: 'FOLLOWER', color: '#7CFF6B' },
  velocity: { label: 'VELO', color: '#F2F0EB' },
  pitch: { label: 'PITCH', color: '#FFB02E' },
  macro1: { label: 'MACRO 1', color: '#FF2E88' },
  macro2: { label: 'MACRO 2', color: '#FF7A3D' },
  macro3: { label: 'MACRO 3', color: '#00E5C7' },
  macro4: { label: 'MACRO 4', color: '#3D9BFF' },
  xyX: { label: 'XY-X', color: '#FF2E88' },
  xyY: { label: 'XY-Y', color: '#B98CFF' },
  modWheel: { label: 'MODWH', color: '#8E8E96' },
  human: { label: 'HUMAN', color: '#FFD166' },
}

export const MOD_DEST_LABELS: Record<ModDestId, string> = {
  cutoff: 'CUTOFF',
  resonance: 'RESONANCE',
  filterDrive: 'FILTER DRIVE',
  wtPosA: 'WT POS A',
  wtPosB: 'WT POS B',
  pitch: 'PITCH',
  level: 'LEVEL',
  pan: 'PAN',
  oscALevel: 'OSC A LEVEL',
  oscBLevel: 'OSC B LEVEL',
  subLevel: 'SUB LEVEL',
  noiseLevel: 'NOISE LEVEL',
  lfo1Rate: 'LFO 1 RATE',
  lfo2Rate: 'LFO 2 RATE',
  lfo3Rate: 'LFO 3 RATE',
  fxSaturatorDrive: 'SAT DRIVE',
  fxChorusDepth: 'CHORUS DEPTH',
  fxDelayTime: 'DELAY TIME',
  fxDelayFeedback: 'DELAY FDBK',
  fxReverbSize: 'REVERB SIZE',
  fxReverbMix: 'REVERB MIX',
  fxWidth: 'WIDTH',
}

export const MOD_SOURCES = Object.keys(MOD_SOURCE_META) as ModSourceId[]
export const MOD_DESTS = Object.keys(MOD_DEST_LABELS) as ModDestId[]

export const MOD_DRAG_TYPE = 'application/x-voxform-mod-source'

/** Draggable source chip (matrix rows + mod panel tabs). */
export function SourceChip({
  source, small = false, className = '',
}: {
  source: ModSourceId
  small?: boolean
  className?: string
}) {
  const meta = MOD_SOURCE_META[source]
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(MOD_DRAG_TYPE, source)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      title="Drag onto any knob to route"
      className={`inline-flex cursor-grab select-none items-center gap-1.5 rounded-[2px] border border-line-hair bg-display px-1.5 font-mono uppercase tracking-[0.1em] text-ink-hi active:cursor-grabbing ${
        small ? 'py-px text-[8px]' : 'py-0.5 text-[9px]'
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 4px ${meta.color}` }} />
      {meta.label}
    </span>
  )
}

/**
 * Wraps a knob: drop target for drag-onto-knob routing + Serum-style live
 * modulation ring segments (one per active route, arc length ∝ source value).
 * `knobPx` must match the wrapped Knob's pixel size (96/64/44/32) so rings
 * align with its value-arc geometry.
 */
export function ModTarget({
  dest, knobPx = 44, children, className = '',
}: {
  dest: ModDestId
  knobPx?: number
  children: ReactNode
  className?: string
}) {
  const { state, addRoute, destFlash } = useEngine()
  const [over, setOver] = useState(false)
  const ringsRef = useRef<Array<SVGCircleElement | null>>([])
  const routes = state.matrix.filter((r) => r.dest === dest && r.enabled)
  const flash = destFlash[dest] !== undefined

  // 30fps-throttled ring animation straight from the telemetry loop
  const lastDraw = useRef(0)
  useTeleFrame((t) => {
    const now = performance.now()
    if (now - lastDraw.current < 33) return
    lastDraw.current = now
    routes.slice(0, 3).forEach((r, i) => {
      const el = ringsRef.current[i]
      if (!el) return
      const src = t.mod[r.source] ?? 0
      const mag = Math.min(1, Math.abs(src * r.amount))
      const R = 32 + i * 2.5 // viewBox 72: sits just outside the knob's r=27 arc
      const C = 2 * Math.PI * R
      const frac = (270 / 360) * Math.max(0.02, mag)
      el.setAttribute('stroke-dasharray', `${C * frac} ${C}`)
    })
  })

  const svgPx = knobPx + 8

  return (
    <div
      className={`relative inline-flex ${className}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(MOD_DRAG_TYPE)) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setOver(true)
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const src = e.dataTransfer.getData(MOD_DRAG_TYPE) as ModSourceId | ''
        setOver(false)
        if (src) {
          e.preventDefault()
          addRoute(src, dest, 0.25)
        }
      }}
    >
      {children}
      {/* modulation rings overlay — centered over the knob body */}
      {routes.length > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg width={svgPx} height={svgPx} viewBox="0 0 72 72">
            {routes.slice(0, 3).map((r, i) => {
              const R = 32 + i * 2.5
              return (
                <circle
                  key={r.id}
                  ref={(el) => {
                    ringsRef.current[i] = el
                  }}
                  cx="36"
                  cy="36"
                  r={R}
                  fill="none"
                  stroke={MOD_SOURCE_META[r.source].color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="0 999"
                  transform="rotate(135 36 36)"
                  opacity={0.85}
                />
              )
            })}
          </svg>
        </div>
      )}
      {(over || flash) && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-[4px] transition-opacity duration-200"
          style={{
            boxShadow: `0 0 0 1px ${over ? 'var(--accent-cyan)' : 'var(--accent-magenta)'}, 0 0 14px ${
              over ? 'rgba(0,229,199,0.35)' : 'rgba(255,46,136,0.35)'
            }`,
          }}
        />
      )}
    </div>
  )
}
