/**
 * HELL.SYNTH Instrument — /instrument.
 * Straight into the synth: no onboarding, no mic wall. Engine boots mic-less
 * on mount; SPACE plays/stops with a fade, ← → cycle presets, QWERTY and USB
 * MIDI play notes, REC captures the master output to WAV.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import type { RecordedTake } from '@/audio'
import { EngineProvider, useEngine } from '@/components/instrument/engine'
import { ModulePulse } from '@/components/instrument/bits'
import {
  FACTORY, applyAccentSwap, loadSettings, loadUserPresets,
} from '@/components/instrument/presets'
import TopBar from '@/components/instrument/TopBar'
import Visualizer from '@/components/instrument/Visualizer'
import OscPanel from '@/components/instrument/OscPanel'
import FilterPanel from '@/components/instrument/FilterPanel'
import ModPanel from '@/components/instrument/ModPanel'
import StepSequencer from '@/components/instrument/StepSequencer'
import FxRack from '@/components/instrument/FxRack'
import XyPad from '@/components/instrument/XyPad'
import RecordModal from '@/components/instrument/RecordModal'
import PresetDrawer from '@/components/instrument/PresetDrawer'
import KeyboardStrip from '@/components/instrument/KeyboardStrip'
import StatusBar from '@/components/instrument/StatusBar'

type WidthMode = 'full' | 'compact' | 'small'

function useWidthMode(): WidthMode {
  const [mode, setMode] = useState<WidthMode>(() =>
    typeof window === 'undefined' ? 'full' : window.innerWidth < 1024 ? 'small' : window.innerWidth < 1280 ? 'compact' : 'full',
  )
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      setMode(w < 1024 ? 'small' : w < 1280 ? 'compact' : 'full')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mode
}

/** page-boot stagger wrapper — plays once on mount */
function Boot({ delay, children, className = '' }: { delay: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Shell() {
  const {
    status, recording, startEngine, resumeEngine, startRec, stopRec, loadPreset,
    toggleTransport, cyclePreset,
  } = useEngine()
  const [params] = useSearchParams()
  const widthMode = useWidthMode()
  const [fxDrawer, setFxDrawer] = useState(false)
  const [presetDrawer, setPresetDrawer] = useState(false)
  const [take, setTake] = useState<RecordedTake | null>(null)
  const started = useRef(false)

  // apply persisted accent swap
  useEffect(() => {
    applyAccentSwap(loadSettings().accentSwap)
  }, [])

  // boot the engine immediately (mic-less); honor ?preset= once
  useEffect(() => {
    if (started.current) return
    started.current = true
    const presetId = params.get('preset')
    if (presetId) {
      const p = [...FACTORY, ...loadUserPresets()].find((x) => x.id === presetId)
      if (p) loadPreset(p)
    }
    void startEngine(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // browsers gate AudioContext behind a user gesture — resume on first touch
  useEffect(() => {
    const wake = () => void resumeEngine()
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', wake)
    return () => {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [resumeEngine])

  // SPACE = play/stop (fades), ← → = cycle presets
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [role="slider"], [role="spinbutton"], [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"]')) return // modal owns its keys
      if (e.key === ' ') {
        e.preventDefault()
        toggleTransport()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        cyclePreset(e.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTransport, cyclePreset])

  const onToggleRecord = useCallback(async () => {
    if (!recording) {
      startRec()
    } else {
      const t = await stopRec()
      setTake(t)
    }
  }, [recording, startRec, stopRec])

  const onReRecord = useCallback(() => {
    setTake(null)
    startRec()
  }, [startRec])

  // tab hidden / engine suspended → click anywhere resumes
  const rootClick = () => {
    if (status === 'suspended') void resumeEngine()
  }

  if (widthMode === 'small') {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-abyss p-8">
        <div className="absolute inset-0 bg-abyss/70" />
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-6 h-1.5 w-1.5 rounded-full bg-magenta shadow-glow-magenta" />
          <h1 className="font-display text-[28px] font-extrabold uppercase leading-tight tracking-[0.06em] text-ink-hi">
            HELL.SYNTH is a desktop instrument.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-mid">
            A synthesizer this dense needs a real screen. Come back on a laptop.
          </p>
          <Link to="/"
            className="mt-6 inline-block rounded-[2px] border border-magenta px-6 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-magenta transition-colors hover:bg-magenta/10">
            BACK TO SITE
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-abyss" onClick={rootClick}>
      <TopBar
        compact={widthMode === 'compact'}
        fxDrawerOpen={fxDrawer}
        onToggleFxDrawer={() => setFxDrawer((v) => !v)}
        onOpenPresets={() => setPresetDrawer(true)}
        onTake={setTake}
      />

      <div className="pt-3">
        <Visualizer />
      </div>

      {/* control surface grid */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-12 gap-3">
          {/* left column */}
          <div className="col-span-3 flex flex-col gap-3">
            <Boot delay={0}>
              <ModulePulse id="filter">
                <FilterPanel />
              </ModulePulse>
            </Boot>
            <Boot delay={0.1}>
              <ModulePulse id="mod">
                <ModPanel />
              </ModulePulse>
            </Boot>
          </div>
          {/* center column */}
          <div className={`${widthMode === 'compact' ? 'col-span-9' : 'col-span-6'} flex flex-col gap-3`}>
            <Boot delay={0.05}>
              <ModulePulse id="osc">
                <OscPanel />
              </ModulePulse>
            </Boot>
            <Boot delay={0.15}>
              <ModulePulse id="seq">
                <StepSequencer />
              </ModulePulse>
            </Boot>
          </div>
          {/* right column (full width only; compact uses the drawer) */}
          {widthMode === 'full' && (
            <div className="col-span-3 flex flex-col gap-3">
              <Boot delay={0.2}>
                <ModulePulse id="fx">
                  <FxRack />
                </ModulePulse>
              </Boot>
              <Boot delay={0.25}>
                <ModulePulse id="xy">
                  <XyPad />
                </ModulePulse>
              </Boot>
            </div>
          )}
        </div>
      </main>

      {/* compact-mode FX/XY drawer */}
      <AnimatePresence>
        {widthMode === 'compact' && fxDrawer && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="fixed bottom-0 right-0 top-14 z-30 flex w-[360px] flex-col gap-3 overflow-y-auto border-l border-line-hair bg-abyss p-3"
          >
            <ModulePulse id="fx">
              <FxRack />
            </ModulePulse>
            <ModulePulse id="xy">
              <XyPad />
            </ModulePulse>
          </motion.aside>
        )}
      </AnimatePresence>

      <Boot delay={0.3}>
        <KeyboardStrip onToggleRecord={() => void onToggleRecord()} />
      </Boot>
      <StatusBar />

      {take && (
        <RecordModal key={`${take.id}-${take.createdAt}`} take={take} onClose={() => setTake(null)} onReRecord={onReRecord} />
      )}
      <PresetDrawer open={presetDrawer} onClose={() => setPresetDrawer(false)} />
    </div>
  )
}

export default function Instrument() {
  const [params] = useSearchParams()
  // ?focus=<module> — pulse that panel's border magenta 3× (1s each), then clear
  const [focus, setFocus] = useState<string | null>(() => params.get('focus'))
  useEffect(() => {
    if (!focus) return
    const t = window.setTimeout(() => setFocus(null), 3200)
    return () => window.clearTimeout(t)
  }, [focus])
  return (
    <EngineProvider focusModule={focus}>
      <Shell />
    </EngineProvider>
  )
}
