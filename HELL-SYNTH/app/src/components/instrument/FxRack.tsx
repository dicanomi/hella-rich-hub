/** FX rack (S8) — 6 reorderable modules, FRQ Shift style. */
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Reorder, motion, useDragControls } from 'framer-motion'
import { GripVertical, Info } from 'lucide-react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import ModuleSection from '@/components/controls/ModuleSection'
import type { FxId } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { denorm, fmtMs, fmtPct, logDenorm, logNorm, norm } from './bits'
import { ModTarget } from './modMeta'
import type { ModDestId } from '@/audio'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const FX_META: Record<FxId, { name: string; blurb: string }> = {
  saturator: { name: 'SATURATOR', blurb: 'Tape-style saturation before the delay for dub throws.' },
  chorus: { name: 'CHORUS', blurb: 'Doubled voice ensemble — instant choir width.' },
  delay: { name: 'DELAY', blurb: 'Tempo echoes; tap twice to set the time.' },
  reverb: { name: 'REVERB', blurb: 'Dense hall tail after the echoes.' },
  width: { name: 'WIDTH', blurb: 'Mid/side spread; keep the bass mono.' },
  compressor: { name: 'COMPRESSOR', blurb: 'Glues the master bus, bx style.' },
}

/** thin cyan vector icon per module */
function FxIcon({ id, on }: { id: FxId; on: boolean }) {
  const c = on ? 'var(--accent-cyan)' : 'var(--ink-low)'
  const paths: Record<FxId, string> = {
    saturator: 'M2 16 Q8 16 10 10 T18 4',
    chorus: 'M2 10 Q5 4 8 10 T14 10 M6 14 Q9 8 12 14 T18 14',
    delay: 'M2 8 L6 8 M8 10 L12 10 M14 12 L18 12 M2 14 L4 14',
    reverb: 'M2 6 L18 6 M4 9 L16 9 M6 12 L13 12 M8 15 L10 15',
    width: 'M8 10 L2 5 M8 10 L2 15 M12 10 L18 5 M12 10 L18 15',
    compressor: 'M2 16 L10 10 L18 10 M14 6 L18 10 L14 14',
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d={paths[id]} stroke={c} strokeWidth={1.2} strokeLinecap="round"
        style={{ transition: 'stroke 200ms' }} />
    </svg>
  )
}

function GrMeter({ on }: { on: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useTeleFrame((t) => {
    if (!ref.current) return
    const db = t.info.outputPeakDb
    const v = db === -Infinity ? 0 : Math.min(1, Math.max(0, (db + 40) / 40))
    const kids = ref.current.children
    for (let i = 0; i < 3; i++) {
      const el = kids[i] as HTMLElement
      const lit = on && v > (i + 1) / 4
      el.style.backgroundColor = lit ? 'var(--warn-amber)' : 'var(--line-hair)'
      el.style.boxShadow = lit ? '0 0 4px var(--warn-amber)' : 'none'
    }
  })
  return (
    <div ref={ref} className="flex gap-[2px]" title="gain reduction">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-1.5 w-1.5 rounded-full bg-line-hair" />
      ))}
    </div>
  )
}

function FxModule({ id, onGripDown }: { id: FxId; onGripDown: (e: ReactPointerEvent) => void }) {
  const { state, setParams, commit } = useEngine()
  const fx = state.fx[id]
  const on = fx.enabled
  const tapTimes = useRef<number[]>([])
  const [, tapFlash] = useState(0)

  const setParam = (key: string, value: number | boolean) => {
    commit((d) => {
      d.fx[id].params[key] = value
    })
  }
  const setOn = (v: boolean) =>
    setParams('fx', { [id]: { ...fx, enabled: v } } as Partial<Record<FxId, typeof fx>>)

  const knob = (
    label: string, paramKey: string, value: number, def: number,
    fmt: (v: number) => string, apply: (v: number) => number | boolean = (v) => v,
    dest?: ModDestId,
  ) => {
    const k = (
      <Knob size="mini" label={label} value={value} defaultValue={def} disabled={!on}
        onChange={(v) => setParam(paramKey, apply(v))} formatValue={fmt} />
    )
    return dest ? <ModTarget dest={dest} knobPx={32}>{k}</ModTarget> : k
  }

  const controls = () => {
    const p = fx.params
    switch (id) {
      case 'saturator':
        return (
          <>
            {knob('DRIVE', 'drive', p.drive as number, 0.3, fmtPct, (v) => v, 'fxSaturatorDrive')}
            {knob('MIX', 'mix', p.mix as number, 0.5, fmtPct)}
          </>
        )
      case 'chorus':
        return (
          <>
            {knob('RATE', 'rate', norm(p.rate as number, 0.05, 8), norm(0.8, 0.05, 8),
              (v) => `${denorm(v, 0.05, 8).toFixed(2)} Hz`, (v) => denorm(v, 0.05, 8))}
            {knob('DEPTH', 'depth', p.depth as number, 0.4, fmtPct, (v) => v, 'fxChorusDepth')}
          </>
        )
      case 'delay':
        return (
          <>
            <div className="flex items-start gap-1">
              {knob('TIME', 'timeMs', logNorm(p.timeMs as number, 20, 2000), logNorm(320, 20, 2000),
                (v) => fmtMs(logDenorm(v, 20, 2000)), (v) => logDenorm(v, 20, 2000), 'fxDelayTime')}
              <motion.button
                type="button"
                disabled={!on}
                animate={tapTimes.current.length > 0 ? { scale: [1, 1.2, 1] } : {}}
                onClick={() => {
                  const now = performance.now()
                  const ts = tapTimes.current
                  if (ts.length && now - ts[ts.length - 1] > 2000) ts.length = 0
                  ts.push(now)
                  tapFlash((x) => x + 1)
                  if (ts.length >= 2) {
                    const diffs = ts.slice(1).map((t, i) => t - ts[i])
                    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
                    setParam('timeMs', Math.min(2000, Math.max(20, Math.round(avg))))
                  }
                }}
                className="mt-4 rounded-[2px] border border-line-hair px-1.5 py-0.5 font-mono text-[9px] text-ink-mid transition-colors hover:border-line-bright hover:text-ink-hi disabled:opacity-30"
              >
                TAP
              </motion.button>
            </div>
            {knob('FEEDBACK', 'feedback', p.feedback as number, 0.35, fmtPct, (v) => v, 'fxDelayFeedback')}
            <div className="pt-2">
              <LEDToggle on={p.sync as boolean} onChange={(v) => setParam('sync', v)} label="SYNC"
                color="var(--accent-cyan)" disabled={!on} />
            </div>
          </>
        )
      case 'reverb':
        return (
          <>
            {knob('SIZE', 'size', p.size as number, 0.5, fmtPct, (v) => v, 'fxReverbSize')}
            {knob('MIX', 'mix', p.mix as number, 0.25, fmtPct, (v) => v, 'fxReverbMix')}
          </>
        )
      case 'width':
        return (
          <>
            {knob('WIDTH', 'width', p.width as number, 0.5,
              (v) => (v < 0.05 ? 'MONO' : v > 0.95 ? 'WIDE' : fmtPct(v)), (v) => v, 'fxWidth')}
            <div className="pt-2">
              <LEDToggle on={p.monoBass as boolean} onChange={(v) => setParam('monoBass', v)} label="MONO BASS"
                color="var(--accent-cyan)" disabled={!on} />
            </div>
          </>
        )
      case 'compressor':
        return (
          <>
            {knob('AMOUNT', 'amount', p.amount as number, 0.4, fmtPct)}
            {knob('MIX', 'mix', p.mix as number, 1, fmtPct)}
            <div className="pt-5">
              <GrMeter on={on} />
            </div>
          </>
        )
    }
  }

  return (
    <div className={`flex items-center gap-3 px-2 py-2 transition-opacity ${on ? '' : 'opacity-60'}`}>
      <FxIcon id={id} on={on} />
      <span className={`w-[86px] font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${on ? 'text-ink-hi' : 'text-ink-low'}`}>
        {FX_META[id].name}
      </span>
      <LEDToggle on={on} onChange={setOn} />
      <div className="flex flex-1 items-start justify-end gap-3">{controls()}</div>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-ink-low opacity-0 transition-opacity group-hover:opacity-100">
              <Info size={11} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[200px] border-line-hair bg-raised font-mono text-[10px] text-ink-mid">
            {FX_META[id].blurb}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span
        onPointerDown={onGripDown}
        style={{ touchAction: 'none' }}
        className="cursor-grab text-ink-low transition-colors hover:text-ink-hi active:cursor-grabbing"
        aria-label={`drag to reorder ${FX_META[id].name}`}
      >
        <GripVertical size={13} />
      </span>
    </div>
  )
}

/** One rack row. `dragListener={false}` keeps pointer-down anywhere on the
 *  module (knobs, toggles, selects) from starting a reorder drag; the drag is
 *  started manually from the ≡ grip via its own DragControls. */
function FxRow({ id }: { id: FxId }) {
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      className="group rounded-[2px] bg-panel"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 20, position: 'relative' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <FxModule id={id} onGripDown={(e) => dragControls.start(e)} />
    </Reorder.Item>
  )
}

export default function FxRack() {
  const { state, commit } = useEngine()
  const [pulse, setPulse] = useState(0)
  return (
    <ModuleSection title="FX RACK" ledOn={state.fxOrder.some((id) => state.fx[id].enabled)}>
      <div className="relative">
        <Reorder.Group
          axis="y"
          values={state.fxOrder}
          onReorder={(order) => {
            commit((d) => {
              d.fxOrder = order
            })
            setPulse((p) => p + 1)
          }}
          className="flex flex-col divide-y divide-line-hair"
        >
          {state.fxOrder.map((id) => (
            <FxRow key={id} id={id} />
          ))}
        </Reorder.Group>
        {/* cyan flow pulse on reorder */}
        {pulse > 0 && (
          <motion.div
            key={pulse}
            className="pointer-events-none absolute left-0 top-0 h-full w-px bg-cyan"
            initial={{ opacity: 0.8, scaleY: 0 }}
            animate={{ opacity: 0, scaleY: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'top', boxShadow: '0 0 6px var(--accent-cyan)' }}
          />
        )}
      </div>
      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-low">
        SIGNAL FLOWS TOP → BOTTOM · DRAG ≡ TO REWIRE
      </p>
    </ModuleSection>
  )
}
