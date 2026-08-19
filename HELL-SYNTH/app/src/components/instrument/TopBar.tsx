/** TopBar — wordmark + engine LED, preset browser, transport, master, REC. */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, Settings2, SlidersHorizontal } from 'lucide-react'
import Knob from '@/components/controls/Knob'
import LEDToggle from '@/components/controls/LEDToggle'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { RecordedTake } from '@/audio'
import { BPM_DEFAULT } from '@/audio'
import { useEngine, useTeleFrame, useTele } from './engine'
import { fmtSec } from './bits'
import { EngineLed } from './bits'
import {
  applyAccentSwap, loadSettings, saveSettings, type VoxSettings,
} from './presets'

function PeakMeter() {
  const ref = useRef<HTMLDivElement>(null)
  const smooth = useRef(0)
  useTeleFrame((t) => {
    const db = t.info.outputPeakDb
    const v = db === -Infinity ? 0 : Math.min(1, Math.max(0, (db + 60) / 60))
    // 300ms release falloff
    smooth.current = v > smooth.current ? v : smooth.current * 0.94
    if (ref.current) {
      const segs = ref.current.children
      const n = 6
      for (let i = 0; i < n; i++) {
        const el = segs[i] as HTMLElement
        const on = smooth.current * n > i
        const color = i >= 5 ? 'var(--signal-red)' : i >= 4 ? 'var(--warn-amber)' : 'var(--led-green)'
        el.style.backgroundColor = on ? color : 'var(--line-hair)'
        el.style.boxShadow = on && i >= 4 ? `0 0 4px ${color}` : 'none'
      }
    }
  })
  return (
    <div ref={ref} className="flex h-8 w-1.5 flex-col-reverse gap-[2px]" aria-label="master peak meter">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 rounded-[1px] bg-line-hair" />
      ))}
    </div>
  )
}

/** Master-clock BPM readout — drag vertically or horizontally to nudge,
 *  wheel for ±1, double-click resets to 120. */
function BpmControl() {
  const { bpm, setBpm } = useEngine()
  const drag = useRef<{ x: number; y: number; bpm: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setBpm(bpmRef.current + (e.deltaY < 0 ? 1 : -1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setBpm])
  return (
    <div
      ref={rootRef}
      role="spinbutton"
      aria-label="master tempo"
      aria-valuemin={40}
      aria-valuemax={240}
      aria-valuenow={bpm}
      tabIndex={0}
      title="Master BPM — drag or scroll to change, double-click resets. Sequencer, delay SYNC and LFO sync all follow this clock."
      onPointerDown={(e) => {
        e.preventDefault()
        drag.current = { x: e.clientX, y: e.clientY, bpm }
        const mv = (ev: PointerEvent) => {
          if (!drag.current) return
          const d = (drag.current.y - ev.clientY + (ev.clientX - drag.current.x)) / 2
          setBpm(drag.current.bpm + d)
        }
        const up = () => {
          drag.current = null
          window.removeEventListener('pointermove', mv)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', mv)
        window.addEventListener('pointerup', up)
      }}
      onDoubleClick={() => setBpm(BPM_DEFAULT)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setBpm(bpm + 1) }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setBpm(bpm - 1) }
      }}
      className="flex h-9 cursor-ns-resize select-none flex-col items-center justify-center rounded-[4px] bg-display px-2.5 shadow-recessed outline-none focus-visible:ring-1 focus-visible:ring-cyan"
    >
      <span className="font-mono text-[13px] leading-none tabular-nums text-ink-hi">{bpm}</span>
      <span className="mt-1 font-mono text-[7px] uppercase leading-none tracking-[0.2em] text-ink-low">BPM</span>
    </div>
  )
}

export default function TopBar({
  compact,
  fxDrawerOpen,
  onToggleFxDrawer,
  onOpenPresets,
  onTake,
}: {
  compact: boolean
  fxDrawerOpen: boolean
  onToggleFxDrawer: () => void
  onOpenPresets: () => void
  onTake: (take: RecordedTake) => void
}) {
  const navigate = useNavigate()
  const {
    state, setParams, status, recording, recElapsed, presetName, dirty,
    startRec, stopRec, resumeEngine, cyclePreset,
    startTransport, pauseTransport, startEngine,
  } = useEngine()
  const [settings, setSettings] = useState<VoxSettings>(() => loadSettings())
  const [recBusy, setRecBusy] = useState(false)
  const sampleRate = useTele((t) => t.info.sampleRate)
  const transportPlaying = useTele((t) => t.info.transportPlaying ?? false)

  const onRecClick = async () => {
    if (recBusy) return
    if (!recording) {
      startRec()
    } else {
      setRecBusy(true)
      try {
        const take = await stopRec()
        onTake(take)
      } finally {
        setRecBusy(false)
      }
    }
  }

  const engineLive = status === 'live' || status === 'no-mic'
  const suspended = status === 'suspended'

  const onTransportClick = async () => {
    if (transportPlaying) {
      pauseTransport()
      return
    }
    if (suspended) await resumeEngine()
    else if (!engineLive) await startEngine(false)
    startTransport()
  }

  const patchSettings = (p: Partial<VoxSettings>) => {
    const next = { ...settings, ...p }
    setSettings(next)
    saveSettings(next)
    if (p.accentSwap !== undefined) applyAccentSwap(next.accentSwap)
  }

  return (
    <motion.header
      initial={{ y: -56 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-40 flex h-14 shrink-0 items-center gap-4 border-b border-line-hair bg-panel px-4"
    >
      {/* left: wordmark + engine status */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (recording && !window.confirm('A recording is in progress. Leave the instrument?')) return
            navigate('/')
          }}
          className="flex items-center gap-2 outline-none"
          aria-label="HELLA.SYNTH home"
        >
          <img src="./logo.svg" alt="" className="h-[16px] w-[16px]" />
          <span className="whitespace-nowrap font-display text-[14px] font-extrabold uppercase tracking-[0.14em] text-ink-hi">
            HELLA.SYNTH
          </span>
        </button>
        <div className="hidden items-center gap-1.5 border-l border-line-hair pl-3 xl:flex">
          <EngineLed on={engineLive} color={suspended ? 'var(--warn-amber)' : 'var(--led-green)'} />
          {suspended ? (
            <button
              type="button"
              onClick={() => void resumeEngine()}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-warn-amber hover:text-ink-hi"
            >
              SUSPENDED — CLICK TO RESUME
            </button>
          ) : (
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mid">
              {engineLive ? `${Math.round((sampleRate || 48000) / 1000)}kHz` : 'BOOTING…'}
            </span>
          )}
        </div>
      </div>

      {/* center: preset browser (← → arrow keys cycle too) */}
      <div className="mx-auto flex items-center">
        <div className="flex h-9 w-[300px] items-center rounded-[4px] bg-display px-1 shadow-recessed">
          <button type="button" aria-label="previous preset" onClick={() => cyclePreset(-1)}
            className="rounded-[2px] p-1 text-ink-mid transition-colors hover:text-ink-hi">
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={onOpenPresets}
            className="relative h-full flex-1 overflow-hidden font-mono text-[13px] uppercase tracking-[0.08em] text-ink-hi"
            aria-label="open preset drawer">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={presetName}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center gap-1"
              >
                {presetName}
                {dirty && <span className="text-magenta">*</span>}
              </motion.span>
            </AnimatePresence>
          </button>
          <button type="button" aria-label="next preset" onClick={() => cyclePreset(1)}
            className="rounded-[2px] p-1 text-ink-mid transition-colors hover:text-ink-hi">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* right cluster */}
      <div className="flex min-w-0 items-center gap-3">
        {compact && (
          <button
            type="button"
            onClick={onToggleFxDrawer}
            className={`flex items-center gap-1.5 rounded-[2px] border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
              fxDrawerOpen ? 'border-cyan text-cyan' : 'border-line-hair text-ink-mid hover:border-line-bright hover:text-ink-hi'
            }`}
          >
            <SlidersHorizontal size={11} /> FX / XY
          </button>
        )}

        {/* transport: master PLAY/STOP + BPM — SPACE works too */}
        <div className="flex items-center gap-2" data-module="transport">
          <button
            type="button"
            onClick={() => void onTransportClick()}
            aria-label={transportPlaying ? 'stop transport' : 'play transport'}
            aria-pressed={transportPlaying}
            title={transportPlaying ? 'STOP — fades the synth out and freezes the clock (SPACE)' : 'PLAY — fades the synth in, sequencer runs (SPACE)'}
            className={`flex h-9 w-9 items-center justify-center rounded-[4px] border transition-colors ${
              transportPlaying
                ? 'border-cyan bg-cyan/15 text-cyan shadow-[0_0_10px_rgba(0,229,199,0.25)]'
                : 'border-line-hair text-ink-mid hover:border-line-bright hover:text-ink-hi'
            }`}
          >
            {transportPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-[1px]" />}
          </button>
          <BpmControl />
        </div>

        <div className="flex items-center gap-2">
          <span className="micro-label">MASTER</span>
          <Knob
            size="mini"
            value={state.master.masterLevel}
            onChange={(v) => setParams('master', { masterLevel: v })}
            defaultValue={0.8}
            formatValue={(v) => `${Math.round(v * 100)}`}
          />
          <PeakMeter />
        </div>

        {/* REC — captures the master output, no mic involved */}
        <div className="flex items-center gap-2" data-module="rec">
          {recording && (
            <motion.span
              key="elapsed"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-mono text-[13px] tabular-nums text-signal-red"
            >
              {fmtSec(recElapsed)}
            </motion.span>
          )}
          <button
            type="button"
            onClick={() => void onRecClick()}
            aria-label={recording ? 'stop recording' : 'start recording'}
            aria-pressed={recording}
            title="Record the master output → 48kHz / 32-bit float WAV"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-signal-red transition-shadow duration-200 hover:shadow-[0_0_10px_rgba(255,51,85,0.35)]"
            style={recording ? { boxShadow: '0 0 16px rgba(255,51,85,0.4)' } : undefined}
          >
            <motion.span
              className="block h-3 w-3 rounded-full bg-signal-red"
              animate={recording ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={recording ? { duration: 1, repeat: Infinity, times: [0, 0.4, 1] } : { duration: 0.15 }}
            />
          </button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="settings" className="text-ink-mid transition-colors hover:text-ink-hi">
              <Settings2 size={17} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 border-line-hair bg-raised p-3">
            <div className="micro-label mb-2">SETTINGS</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mid">ACCENT SWAP M⇄C</span>
                <LEDToggle on={settings.accentSwap} onChange={(on) => patchSettings({ accentSwap: on })} />
              </div>
              <div className="h-px bg-line-hair" />
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('Delete all local HELLA.SYNTH data (presets, settings)?')) return
                  if (!window.confirm('Really erase everything? This cannot be undone.')) return
                  localStorage.removeItem('voxform.presets')
                  localStorage.removeItem('voxform.settings')
                  window.location.reload()
                }}
                className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-signal-red/80 transition-colors hover:text-signal-red"
              >
                RESET ALL LOCAL DATA
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* red recording hairline under the TopBar */}
      {recording && (
        <motion.div
          className="absolute bottom-[-1px] left-0 h-px bg-signal-red"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, ease: 'linear' }}
          style={{ boxShadow: '0 0 6px rgba(255,51,85,0.6)' }}
        />
      )}
    </motion.header>
  )
}
