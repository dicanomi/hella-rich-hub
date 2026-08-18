/**
 * useEngine — React-side owner of the VOXFORM audio engine singleton.
 *
 * Creates `createEngine()` once per page, runs a single requestAnimationFrame
 * telemetry loop (pitch / info / follower / mod values) and distributes it:
 *  - canvases & meters subscribe via `useTeleFrame` (no re-renders)
 *  - text readouts use `useTele` (re-render only when the selected value changes)
 *
 * All parameter edits go through `setParams` (object groups) or `commit`
 * (array groups: matrix / macros / fxOrder / macroNames), keeping the engine
 * and React state in lockstep.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import type { ReactNode, MutableRefObject } from 'react'
import { createEngine, defaultEngineState, FACTORY_PRESETS, BPM_DEFAULT } from '@/audio'
import type {
  DemoSourceId, EngineInfo, EngineState, EngineStatus, ModDestId, ModRoute,
  ModSourceId, PitchState, Preset, RecordedTake, SeqStep, SequencerState, SynthEngine,
} from '@/audio'
import { FACTORY, loadUserPresets } from './presets'

export interface TeleFrame {
  pitch: PitchState
  info: EngineInfo
  follower: number
  mod: Partial<Record<ModSourceId, number>>
}

const SILENT_PITCH: PitchState = {
  locked: false, freq: 0, midi: 0, noteName: '—', octave: 0,
  cents: 0, confidence: 0, inputDb: -Infinity, gateOpen: false,
}
const IDLE_INFO: EngineInfo = {
  status: 'idle', sampleRate: 48000, bufferSize: 128, latencyMs: 0,
  recording: false, recordElapsedSec: 0, outputPeakDb: -Infinity, micError: null,
  demoPlaying: null, showcasePlaying: false, showcasePresetId: null,
  samplePlaying: null, transportPlaying: false, transportStep: null,
}

export interface EngineCtx {
  engine: SynthEngine
  state: EngineState
  status: EngineStatus
  recording: boolean
  recElapsed: number
  /** label shown in the TopBar preset strip */
  presetName: string
  /** true when live params differ from the loaded preset */
  dirty: boolean
  /** `?focus=` module pulse target */
  focusModule: string | null
  /** status-bar breadcrumb hover (pulses a module border cyan) */
  crumbHover: string | null
  setCrumbHover: (id: string | null) => void
  /** dest id → flash timestamp, set briefly when a mod source is dropped on a knob */
  destFlash: Record<string, number>
  teleRef: MutableRefObject<TeleFrame>
  subscribeFrame: (cb: () => void) => () => void
  setParams: <K extends keyof EngineState>(group: K, patch: Partial<EngineState[K]>) => void
  /** Full-clone mutate for array/record groups (matrix, macros, fxOrder, fx, macroNames). */
  commit: (mut: (draft: EngineState) => void) => void
  addRoute: (source: ModSourceId, dest: ModDestId, amount?: number) => void
  updateRoute: (id: string, patch: Partial<Omit<ModRoute, 'id'>>) => void
  removeRoute: (id: string) => void
  loadPreset: (p: Preset) => void
  markSavedPreset: (p: Preset) => void
  /** Cycle factory+user presets (arrow keys / TopBar chevrons). */
  cyclePreset: (dir: 1 | -1) => void
  /** First connected USB MIDI device name (Web MIDI), null when none. */
  midiName: string | null
  /** false when the browser has no Web MIDI API. */
  midiSupported: boolean
  startEngine: (useMic: boolean) => Promise<EngineStatus>
  resumeEngine: () => Promise<void>
  startDemo: (source: DemoSourceId) => void
  stopDemo: () => void
  startShowcase: () => void
  stopShowcase: () => void
  /** Send a recorded take into the synth input path (looping). */
  startSample: (buffer: AudioBuffer, name: string) => void
  stopSample: () => void
  /** Master transport clock — drives sequencer, showcase and loop freezes. */
  startTransport: () => void
  pauseTransport: () => void
  toggleTransport: () => void
  bpm: number
  setBpm: (bpm: number) => void
  sequencer: SequencerState
  setSequencer: (seq: SequencerState) => void
  setSeqStep: (index: number, step: SeqStep) => void
  setSeqEnabled: (on: boolean) => void
  startRec: () => void
  stopRec: () => Promise<RecordedTake>
  noteOn: (midi: number, velocity?: number) => void
  noteOff: (midi: number) => void
  registerModule: (id: string, el: HTMLElement | null) => void
  moduleRefs: MutableRefObject<Map<string, HTMLElement>>
}

const Ctx = createContext<EngineCtx | null>(null)

export function useEngine(): EngineCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEngine outside EngineProvider')
  return v
}

/** Subscribe a callback to run every animation frame (for canvases/meters). */
export function useTeleFrame(cb: (t: TeleFrame) => void) {
  const { subscribeFrame, teleRef } = useEngine()
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => subscribeFrame(() => cbRef.current(teleRef.current)), [subscribeFrame, teleRef])
}

/** Re-render only when the selected telemetry slice changes. */
export function useTele<T>(select: (t: TeleFrame) => T, eq?: (a: T, b: T) => boolean): T {
  const { subscribeFrame, teleRef } = useEngine()
  const selRef = useRef(select)
  selRef.current = select
  const eqRef = useRef(eq)
  eqRef.current = eq
  const [val, setVal] = useState<T>(() => select(teleRef.current))
  useEffect(
    () =>
      subscribeFrame(() => {
        const next = selRef.current(teleRef.current)
        setVal((prev) => {
          const e = eqRef.current
          return (e ? e(prev, next) : Object.is(prev, next)) ? prev : next
        })
      }),
    [subscribeFrame, teleRef],
  )
  return val
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export function EngineProvider({
  focusModule,
  children,
}: {
  focusModule: string | null
  children: ReactNode
}) {
  const [engine] = useState<SynthEngine>(() => createEngine())
  const [state, setState] = useState<EngineState>(() => defaultEngineState())
  const [status, setStatus] = useState<EngineStatus>('idle')
  const [recording, setRecording] = useState(false)
  const [recElapsed, setRecElapsed] = useState(0)
  const [preset, setPreset] = useState<Preset | null>(null)
  const [crumbHover, setCrumbHover] = useState<string | null>(null)
  const [destFlash, setDestFlash] = useState<Record<string, number>>({})

  const teleRef = useRef<TeleFrame>({ pitch: SILENT_PITCH, info: IDLE_INFO, follower: 0, mod: {} })
  const subs = useRef(new Set<() => void>())
  const moduleRefs = useRef(new Map<string, HTMLElement>())
  const recStart = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  // --- single telemetry loop -------------------------------------------------
  useEffect(() => {
    let raf = 0
    let lastStatus: EngineStatus | '' = ''
    let lastScPresetId: string | null = null
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const t = teleRef.current
      try {
        t.pitch = engine.getPitch()
        t.info = engine.getInfo()
        t.follower = engine.getFollowerValue()
        t.mod = engine.getModValues()
      } catch {
        /* engine not ready yet */
      }
      // showcase auto-advanced a factory preset engine-side → mirror it into
      // React state WITHOUT going through loadPreset's user semantics: the
      // engine already applied it, and state === preset.state keeps the
      // dirty tracker from flagging an automatic change as user-dirty.
      const scId = t.info.showcasePresetId ?? null
      if (scId !== lastScPresetId) {
        lastScPresetId = scId
        if (scId) {
          const p = FACTORY_PRESETS.find((x) => x.id === scId)
          if (p) {
            // engine already applied it (preserving master/drums/drift) —
            // mirror the applied state, not the raw preset snapshot
            setState(clone(engine.getState()))
            setPreset(p)
          }
        }
      }
      if (t.info.status !== lastStatus) {
        lastStatus = t.info.status
        setStatus(t.info.status)
      }
      if (recStart.current > 0) {
        const v =
          t.info.recordElapsedSec > 0
            ? t.info.recordElapsedSec
            : (performance.now() - recStart.current) / 1000
        // 10Hz tick is plenty for the REC readout; avoids re-rendering the tree per frame
        setRecElapsed((prev) => (Math.abs(v - prev) >= 0.1 ? v : prev))
      }
      subs.current.forEach((cb) => cb())
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [engine])

  // --- dispose + tab-visibility suspend (S15) --------------------------------
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) void engine.suspend()
      else void engine.resume()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      engine.dispose()
    }
  }, [engine])

  const subscribeFrame = useCallback((cb: () => void) => {
    subs.current.add(cb)
    return () => {
      subs.current.delete(cb)
    }
  }, [])

  // --- param writes ----------------------------------------------------------
  const setParams = useCallback(
    <K extends keyof EngineState>(group: K, patch: Partial<EngineState[K]>) => {
      engine.setParams(group, patch)
      setState((prev) => {
        const g = prev[group]
        if (typeof g !== 'object' || g === null || Array.isArray(g)) return prev
        return { ...prev, [group]: { ...(g as object), ...(patch as object) } } as EngineState
      })
    },
    [engine],
  )

  const commit = useCallback(
    (mut: (draft: EngineState) => void) => {
      setState((prev) => {
        const next = clone(prev)
        mut(next)
        engine.setState(next)
        return next
      })
    },
    [engine],
  )

  const addRoute = useCallback(
    (source: ModSourceId, dest: ModDestId, amount = 0.25) => {
      if (stateRef.current.matrix.length >= 12) return
      commit((d) => {
        if (d.matrix.length < 12) {
          d.matrix.push({
            id: `r${Date.now().toString(36)}${d.matrix.length}`,
            source, amount, dest, enabled: true,
          })
        }
      })
      // flash the destination knob (400ms) — the drop feedback from S7
      const stamp = Date.now()
      setDestFlash((f) => ({ ...f, [dest]: stamp }))
      window.setTimeout(() => {
        setDestFlash((f) => {
          if (f[dest] !== stamp) return f
          const n = { ...f }
          delete n[dest]
          return n
        })
      }, 500)
    },
    [commit],
  )

  const updateRoute = useCallback(
    (id: string, patch: Partial<Omit<ModRoute, 'id'>>) => {
      commit((d) => {
        const r = d.matrix.find((x) => x.id === id)
        if (r) Object.assign(r, patch)
      })
    },
    [commit],
  )

  const removeRoute = useCallback(
    (id: string) => {
      engine.removeRoute(id)
      commit((d) => {
        d.matrix = d.matrix.filter((r) => r.id !== id)
      })
    },
    [engine, commit],
  )

  const loadPreset = useCallback(
    (p: Preset) => {
      engine.setState(clone(p.state), { preservePerformance: true })
      // mirror the APPLIED state back: the engine preserves master level,
      // drums and XY drift across the swap, and the UI must show those
      setState(clone(engine.getState()))
      setPreset(p)
    },
    [engine],
  )

  const markSavedPreset = useCallback((p: Preset) => setPreset(p), [])

  const cyclePreset = useCallback(
    (dir: 1 | -1) => {
      const all = [...FACTORY, ...loadUserPresets()]
      if (all.length === 0) return
      const idx = all.findIndex((p) => p.id === preset?.id)
      const next = all[(idx + dir + all.length) % all.length]
      if (next) loadPreset(next)
    },
    [preset, loadPreset],
  )

  // --- USB MIDI (Web MIDI API): any connected keyboard/piano plays notes ----
  const [midiName, setMidiName] = useState<string | null>(null)
  const [midiSupported, setMidiSupported] = useState(true)
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiSupported(false)
      return
    }
    let access: MIDIAccess | null = null
    const onMsg = (msg: MIDIMessageEvent) => {
      const d = msg.data
      if (!d || d.length < 3) return
      const cmd = d[0] & 0xf0
      if (cmd === 0x90 && d[2] > 0) engine.noteOn(d[1], d[2] / 127)
      else if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) engine.noteOff(d[1])
    }
    const refresh = () => {
      if (!access) return
      access.inputs.forEach((input) => {
        input.onmidimessage = onMsg
      })
      const first = [...access.inputs.values()].find((i) => i.state === 'connected')
      setMidiName(first?.name ?? null)
    }
    navigator
      .requestMIDIAccess()
      .then((a) => {
        access = a
        refresh()
        a.onstatechange = refresh
      })
      .catch(() => setMidiSupported(false))
    return () => {
      if (access) {
        access.inputs.forEach((i) => {
          i.onmidimessage = null
        })
        access.onstatechange = null
      }
    }
  }, [engine])

  // --- lifecycle -------------------------------------------------------------
  const startEngine = useCallback(
    async (useMic: boolean) => {
      const s = await engine.start({ useMic })
      setStatus(s)
      return s
    },
    [engine],
  )
  const resumeEngine = useCallback(async () => {
    await engine.resume()
  }, [engine])

  const startDemo = useCallback((source: DemoSourceId) => {
    void engine.startDemo(source)
  }, [engine])
  const stopDemo = useCallback(() => engine.stopDemo(), [engine])
  const startShowcase = useCallback(() => engine.startShowcase(), [engine])
  const stopShowcase = useCallback(() => engine.stopShowcase(), [engine])
  const startSample = useCallback(
    (buffer: AudioBuffer, name: string) => engine.startSample(buffer, name),
    [engine],
  )
  const stopSample = useCallback(() => engine.stopSample(), [engine])

  // --- transport + sequencer -------------------------------------------------
  const [bpm, setBpmState] = useState(BPM_DEFAULT)
  const [sequencer, setSeqState] = useState<SequencerState>(() => engine.getSequencer())
  const startTransport = useCallback(() => engine.startTransport(), [engine])
  const pauseTransport = useCallback(() => engine.pauseTransport(), [engine])
  const toggleTransport = useCallback(() => {
    if (teleRef.current.info.transportPlaying) engine.pauseTransport()
    else engine.startTransport()
  }, [engine])
  const setBpm = useCallback(
    (b: number) => {
      engine.setBpm(b)
      setBpmState(engine.getBpm())
    },
    [engine],
  )
  const syncSeqFromEngine = useCallback(() => setSeqState(engine.getSequencer()), [engine])
  const setSequencer = useCallback(
    (seq: SequencerState) => {
      engine.setSequencer(seq)
      syncSeqFromEngine()
    },
    [engine, syncSeqFromEngine],
  )
  const setSeqStep = useCallback(
    (index: number, step: SeqStep) => {
      engine.setSeqStep(index, step)
      syncSeqFromEngine()
    },
    [engine, syncSeqFromEngine],
  )
  const setSeqEnabled = useCallback(
    (on: boolean) => {
      engine.setSeqEnabled(on)
      syncSeqFromEngine()
    },
    [engine, syncSeqFromEngine],
  )

  const startRec = useCallback(() => {
    engine.startRecording()
    recStart.current = performance.now()
    setRecElapsed(0)
    setRecording(true)
  }, [engine])

  const stopRec = useCallback(async () => {
    recStart.current = 0
    setRecording(false)
    return engine.stopRecording()
  }, [engine])

  const noteOn = useCallback((midi: number, velocity = 0.85) => engine.noteOn(midi, velocity), [engine])
  const noteOff = useCallback((midi: number) => engine.noteOff(midi), [engine])

  const registerModule = useCallback((id: string, el: HTMLElement | null) => {
    if (el) moduleRefs.current.set(id, el)
    else moduleRefs.current.delete(id)
  }, [])

  const dirty = useMemo(() => {
    if (!preset) return false
    return JSON.stringify(state) !== JSON.stringify(preset.state)
  }, [state, preset])

  const value: EngineCtx = {
    engine, state, status, recording, recElapsed,
    presetName: preset?.name ?? 'INIT PATCH', dirty,
    focusModule, crumbHover, setCrumbHover, destFlash,
    teleRef, subscribeFrame, setParams, commit,
    addRoute, updateRoute, removeRoute, loadPreset, markSavedPreset, cyclePreset,
    midiName, midiSupported,
    startEngine, resumeEngine, startDemo, stopDemo, startShowcase, stopShowcase,
    startSample, stopSample,
    startTransport, pauseTransport, toggleTransport, bpm, setBpm,
    sequencer, setSequencer, setSeqStep, setSeqEnabled,
    startRec, stopRec, noteOn, noteOff,
    registerModule, moduleRefs,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
