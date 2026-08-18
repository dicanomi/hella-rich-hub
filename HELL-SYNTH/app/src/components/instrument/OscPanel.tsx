/** Oscillators panel (S5) — Serum-style tabs OSC A / OSC B / SUB / NOISE. */
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import ModuleSection from '@/components/controls/ModuleSection'
import WaveformThumb from '@/components/controls/WaveformThumb'
import type { OscParams, WarpMode } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { DarkSelect, Stepper, denorm, fmtBipolar, fmtPct, norm } from './bits'
import { ModTarget } from './modMeta'
import { WT_LABELS, WT_NAMES, wtSample } from './wavetables'

type Tab = 'oscA' | 'oscB' | 'sub' | 'noise'
const TABS: { id: Tab; label: string }[] = [
  { id: 'oscA', label: 'OSC A' },
  { id: 'oscB', label: 'OSC B' },
  { id: 'sub', label: 'SUB' },
  { id: 'noise', label: 'NOISE' },
]
const WARP_MODES: WarpMode[] = ['sync', 'fmB', 'bend', 'mirror']
const WARP_LABELS: Record<WarpMode, string> = { sync: 'SYNC', fmB: 'FM←B', bend: 'BEND', mirror: 'MIRROR' }

/** Wavetable display well — cyan line, magenta mod ghost, drag-scrubs WT POS. */
function WavetableWell({ tab, osc, hoverWt }: { tab: 'oscA' | 'oscB'; osc: OscParams; hoverWt: OscParams['wavetable'] | null }) {
  const { state, setParams } = useEngine()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const oscRef = useRef(osc)
  oscRef.current = osc
  const hoverRef = useRef(hoverWt)
  hoverRef.current = hoverWt
  const modDest = tab === 'oscA' ? 'wtPosA' : 'wtPosB'
  const flat = useRef(osc.enabled ? 1 : 0)

  useTeleFrame((t) => {
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

    const o = oscRef.current
    // power-off CRT flatten (250ms)
    flat.current += ((o.enabled ? 1 : 0) - flat.current) * 0.12
    const amp = flat.current

    // ghost target when WT POS is modulated
    let modOffset = 0
    for (const r of state.matrix) {
      if (r.dest === modDest && r.enabled) modOffset += (t.mod[r.source] ?? 0) * r.amount
    }
    const draw = (pos: number, color: string, width: number, alpha: number, wt?: OscParams['wavetable']) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.globalAlpha = alpha
      ctx.beginPath()
      const N = 128
      const table = wt ?? o.wavetable
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w
        const y = h / 2 - wtSample(table, pos, (i / N) * 2) * (h / 2 - 6) * amp
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    if (hoverRef.current && hoverRef.current !== o.wavetable) {
      draw(o.wtPos, '#00E5C7', 1, 0.35, hoverRef.current)
    }
    if (Math.abs(modOffset) > 0.01) draw(Math.min(1, Math.max(0, o.wtPos + modOffset)), '#FF2E88', 1.5, 0.55)
    draw(o.wtPos, '#00E5C7', 1.5, o.enabled ? 1 : 0.5)
  })

  const scrub = (clientX: number) => {
    const r = canvasRef.current?.getBoundingClientRect()
    if (!r) return
    const v = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setParams(tab, { wtPos: v })
  }

  return (
    <div
      className="relative h-[220px] flex-1 cursor-ew-resize overflow-hidden rounded-[4px] bg-display shadow-recessed"
      onPointerDown={(e) => {
        e.preventDefault()
        scrub(e.clientX)
        const mv = (ev: PointerEvent) => scrub(ev.clientX)
        const up = () => {
          window.removeEventListener('pointermove', mv)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', mv)
        window.addEventListener('pointerup', up)
      }}
      title="Drag horizontally to scrub wavetable position"
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

function OscBody({ tab }: { tab: 'oscA' | 'oscB' }) {
  const { state, setParams } = useEngine()
  const o = state[tab]
  const set = (patch: Partial<OscParams>) => setParams(tab, patch)
  const wtIdx = WT_NAMES.indexOf(o.wavetable)
  const [hoverWt, setHoverWt] = useState<OscParams['wavetable'] | null>(null)

  return (
    <div className="flex gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <WavetableWell tab={tab} osc={o} hoverWt={hoverWt} />
        {/* wavetable selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="previous wavetable"
              onClick={() => set({ wavetable: WT_NAMES[(wtIdx - 1 + WT_NAMES.length) % WT_NAMES.length] })}
              className="rounded-[2px] p-0.5 text-ink-mid hover:text-ink-hi">
              <ChevronLeft size={13} />
            </button>
            <span className="min-w-[110px] text-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-hi">
              {WT_LABELS[o.wavetable]}
            </span>
            <button type="button" aria-label="next wavetable"
              onClick={() => set({ wavetable: WT_NAMES[(wtIdx + 1) % WT_NAMES.length] })}
              className="rounded-[2px] p-0.5 text-ink-mid hover:text-ink-hi">
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-1 overflow-hidden">
            {WT_NAMES.map((n) => (
              <button key={n} type="button" title={WT_LABELS[n]} onClick={() => set({ wavetable: n })}
                onMouseEnter={() => setHoverWt(n)}
                onMouseLeave={() => setHoverWt(null)}
                className={`rounded-[2px] border p-px transition-colors ${
                  n === o.wavetable ? 'border-cyan' : 'border-line-hair hover:border-line-bright'
                }`}>
                <WaveformThumb
                  shape={n === 'basicShapes' ? 'sine' : n === 'analogGrit' ? 'saw' : n === 'vocalFormant' ? 'triangle' : n === 'harmonics' ? 'sine' : n === 'digitalEdge' ? 'pulse' : 'sine'}
                  width={26} height={14} cycles={n === 'harmonics' ? 3 : 2} strokeWidth={1}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <ModTarget dest={tab === 'oscA' ? 'wtPosA' : 'wtPosB'} knobPx={64}>
            <Knob size="large" label="WT POS" value={o.wtPos}
              onChange={(v) => set({ wtPos: v })} accentColor="var(--accent-cyan)" />
          </ModTarget>
          <div className="flex flex-col items-end gap-1 pt-4">
            <Stepper label="OCT" display={o.octave > 0 ? `+${o.octave}` : `${o.octave}`}
              onDec={() => set({ octave: Math.max(-2, o.octave - 1) })} onInc={() => set({ octave: Math.min(2, o.octave + 1) })}
              decDisabled={o.octave <= -2} incDisabled={o.octave >= 2} />
            <Stepper label="SEMI" display={o.semi > 0 ? `+${o.semi}` : `${o.semi}`}
              onDec={() => set({ semi: Math.max(-12, o.semi - 1) })} onInc={() => set({ semi: Math.min(12, o.semi + 1) })}
              decDisabled={o.semi <= -12} incDisabled={o.semi >= 12} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3">
          <Knob label="UNISON" value={norm(o.unison, 1, 7)} defaultValue={0}
            onChange={(v) => set({ unison: Math.round(denorm(v, 1, 7)) })}
            formatValue={(v) => `${Math.round(denorm(v, 1, 7))}v`} />
          <Knob label="DETUNE" value={o.detune} defaultValue={0.15}
            onChange={(v) => set({ detune: v })} formatValue={fmtPct} />
          <Knob label="BLEND" value={o.blend} defaultValue={0.5}
            onChange={(v) => set({ blend: v })} formatValue={fmtPct} />
          <ModTarget dest="pan">
            <Knob label="PAN" value={norm(o.pan, -1, 1)} defaultValue={0.5}
              onChange={(v) => set({ pan: denorm(v, -1, 1) })}
              formatValue={(v) => fmtBipolar(denorm(v, -1, 1))} />
          </ModTarget>
          <ModTarget dest={tab === 'oscA' ? 'oscALevel' : 'oscBLevel'}>
            <Knob label="LEVEL" value={o.level} defaultValue={tab === 'oscA' ? 0.8 : 0.7}
              onChange={(v) => set({ level: v })} formatValue={fmtPct} />
          </ModTarget>
          <Knob label="FINE" value={norm(o.fineCents, -100, 100)} defaultValue={0.5}
            onChange={(v) => set({ fineCents: denorm(v, -100, 100) })}
            formatValue={(v) => { const c = Math.round(denorm(v, -100, 100)); return `${c > 0 ? '+' : ''}${c}¢` }} />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="micro-label">WARP</span>
            <DarkSelect ariaLabel="warp mode" value={o.warpMode} options={WARP_MODES}
              labelFn={(m) => WARP_LABELS[m]} onChange={(m) => set({ warpMode: m })} />
          </div>
          <Knob label="AMT" value={o.warpAmt} defaultValue={0}
            onChange={(v) => set({ warpAmt: v })} formatValue={fmtPct} />
        </div>
      </div>
    </div>
  )
}

function SubBody() {
  const { state, setParams } = useEngine()
  const s = state.sub
  const SHAPES = [
    { id: 'sine' as const, label: 'SINE', thumb: 'sine' as const },
    { id: 'triangle' as const, label: 'TRIANGLE', thumb: 'triangle' as const },
    { id: 'square1' as const, label: 'SQUARE -1OCT', thumb: 'square' as const },
    { id: 'square2' as const, label: 'SQUARE -2OCT', thumb: 'square' as const },
  ]
  return (
    <div className="flex items-start gap-6">
      <div className="flex flex-col gap-1">
        <span className="micro-label mb-1">SHAPE</span>
        {SHAPES.map((sh) => (
          <button key={sh.id} type="button" onClick={() => setParams('sub', { shape: sh.id })}
            className={`flex items-center gap-2 rounded-[2px] border px-2 py-1 transition-colors ${
              s.shape === sh.id ? 'border-cyan bg-cyan/5' : 'border-line-hair hover:border-line-bright'
            }`}>
            <WaveformThumb shape={sh.thumb} width={34} height={16} cycles={sh.id === 'square2' ? 1 : 2}
              color={s.shape === sh.id ? 'var(--accent-cyan)' : 'var(--ink-low)'} strokeWidth={1} />
            <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${s.shape === sh.id ? 'text-ink-hi' : 'text-ink-low'}`}>
              {sh.label}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 pt-5">
        <ModTarget dest="subLevel">
          <Knob label="LEVEL" value={s.level} defaultValue={0.6}
            onChange={(v) => setParams('sub', { level: v })} formatValue={fmtPct} />
        </ModTarget>
        <Knob label="OCTAVE" value={norm(s.octave, -2, 0)} defaultValue={0.5}
          onChange={(v) => setParams('sub', { octave: Math.round(denorm(v, -2, 0)) })}
          formatValue={(v) => `${Math.round(denorm(v, -2, 0))}`} />
      </div>
    </div>
  )
}

function NoiseBody() {
  const { state, setParams } = useEngine()
  const n = state.noise
  return (
    <div className="flex items-start gap-6">
      <div className="flex h-[220px] w-[200px] items-center justify-center rounded-[4px] bg-display shadow-recessed">
        <WaveformThumb shape="noise" width={160} height={80} cycles={3}
          color={n.enabled ? 'var(--accent-cyan)' : 'var(--ink-low)'} />
      </div>
      <div className="flex items-start gap-4 pt-5">
        <Knob label="COLOR" value={n.color} defaultValue={0}
          onChange={(v) => setParams('noise', { color: v })}
          formatValue={(v) => (v < 0.33 ? 'WHITE' : v < 0.66 ? 'PINK' : 'BROWN')} />
        <ModTarget dest="noiseLevel">
          <Knob label="LEVEL" value={n.level} defaultValue={0.3}
            onChange={(v) => setParams('noise', { level: v })} formatValue={fmtPct} />
        </ModTarget>
        <div className="pt-2">
          <LEDToggle on={n.pitchTrack} onChange={(on) => setParams('noise', { pitchTrack: on })}
            label="PITCH TRACK" color="var(--accent-cyan)" />
          <p className="mt-2 max-w-[130px] font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-ink-low">
            Noise follows voice pitch → breathy formant textures
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OscPanel() {
  const { state, setParams } = useEngine()
  const [tab, setTab] = useState<Tab>('oscA')
  const enabled = state[tab].enabled

  return (
    <ModuleSection
      title="OSCILLATORS"
      ledOn={enabled}
      headerRight={
        <div className="flex gap-1" role="tablist">
          {TABS.map((t) => {
            const on = state[t.id].enabled
            const active = tab === t.id
            return (
              <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-t-2 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  active ? 'border-magenta text-ink-hi' : 'border-transparent text-ink-mid hover:text-ink-hi'
                }`}>
                <span className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: on ? 'var(--led-green)' : 'var(--ink-low)', boxShadow: on ? '0 0 4px var(--led-green)' : 'none' }} />
                {t.label}
              </button>
            )
          })}
        </div>
      }
    >
      <div className="mb-3 flex justify-end">
        <LEDToggle
          on={enabled}
          onChange={(on) => setParams(tab, { enabled: on } as never)}
          label={`${TABS.find((t) => t.id === tab)?.label} POWER`}
        />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'oscA' || tab === 'oscB' ? <OscBody tab={tab} /> : tab === 'sub' ? <SubBody /> : <NoiseBody />}
        </motion.div>
      </AnimatePresence>
    </ModuleSection>
  )
}
