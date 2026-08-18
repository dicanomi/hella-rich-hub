/** Keyboard strip (S12) — QWERTY piano, pitch/mod touch strips, octave/hold/legato. */
import { useEffect, useRef, useState } from 'react'
import LEDToggle from '@/components/controls/LEDToggle'
import { useEngine, useTeleFrame } from './engine'
import { Stepper } from './bits'

const WHITE_LETTERS = ['A', 'S', 'D', 'F', 'G', 'H', 'J']
const BLACK_LETTERS: Record<number, string> = { 0: 'W', 1: 'E', 3: 'T', 4: 'Y', 5: 'U' }
const BLACK_AFTER_WHITE = [0, 1, 3, 4, 5] // black key sits after these white indices (per octave)

const SCALE_INTERVALS: Record<string, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
}

// QWERTY → semitone offset from base C
const QWERTY: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
}

function TouchStrip({
  label, bipolar, onValue, onRelease,
}: {
  label: string
  bipolar: boolean
  onValue: (v: number) => void
  onRelease?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  const set = (clientY: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const n = Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height)) // 0 bottom → 1 top
    const v = bipolar ? n * 2 - 1 : n
    onValue(v)
    if (fillRef.current) {
      if (bipolar) {
        fillRef.current.style.bottom = v < 0 ? `${50 + v * 50}%` : '50%'
        fillRef.current.style.height = `${Math.abs(v) * 50}%`
      } else {
        fillRef.current.style.bottom = '0%'
        fillRef.current.style.height = `${v * 100}%`
      }
    }
  }

  const release = () => {
    setActive(false)
    if (bipolar) {
      onValue(0)
      if (fillRef.current) {
        fillRef.current.style.transition = 'all 200ms cubic-bezier(0.22,1,0.36,1)'
        fillRef.current.style.bottom = '50%'
        fillRef.current.style.height = '0%'
        window.setTimeout(() => {
          if (fillRef.current) fillRef.current.style.transition = ''
        }, 220)
      }
    }
    onRelease?.()
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={ref}
        role="slider"
        aria-label={label}
        aria-valuemin={bipolar ? -100 : 0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onValue(bipolar ? 0.5 : 1)
          if (e.key === 'ArrowDown') onValue(bipolar ? -0.5 : 0)
          if (e.key === 'Home') onValue(0)
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          setActive(true)
          set(e.clientY)
          const mv = (ev: PointerEvent) => set(ev.clientY)
          const up = () => {
            window.removeEventListener('pointermove', mv)
            window.removeEventListener('pointerup', up)
            release()
          }
          window.addEventListener('pointermove', mv)
          window.addEventListener('pointerup', up)
        }}
        className={`relative h-[88px] w-6 cursor-ns-resize overflow-hidden rounded-[4px] bg-display shadow-recessed outline-none ${
          active ? 'ring-1 ring-magenta/50' : ''
        }`}
      >
        {bipolar && <div className="absolute left-0 top-1/2 h-px w-full bg-line-bright" />}
        <div ref={fillRef} className="absolute left-0 w-full bg-magenta/70" style={{ bottom: bipolar ? '50%' : 0, height: 0 }} />
      </div>
      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink-low">{label}</span>
    </div>
  )
}

export default function KeyboardStrip({ onToggleRecord }: { onToggleRecord: () => void }) {
  const { state, setParams, engine, noteOn, noteOff } = useEngine()
  const [baseOct, setBaseOct] = useState(3) // C3–B4
  const [hold, setHold] = useState(false)
  const [legato, setLegato] = useState(false)
  const [qwertyOn, setQwertyOn] = useState(true)
  const [pressed, setPressed] = useState<Set<number>>(new Set())
  const heldNotes = useRef<Set<number>>(new Set())
  const legatoLast = useRef<number | null>(null)
  const keyRefs = useRef(new Map<number, HTMLElement>())
  const voiceKey = useRef<number | null>(null)

  const baseMidi = 12 * (baseOct + 1) // C of base octave (C3 = 48)
  const holdRef = useRef(hold)
  holdRef.current = hold
  const legatoRef = useRef(legato)
  legatoRef.current = legato

  const press = (midi: number) => {
    if (legatoRef.current && legatoLast.current !== null && legatoLast.current !== midi) {
      noteOff(legatoLast.current)
      heldNotes.current.delete(legatoLast.current)
    }
    legatoLast.current = midi
    noteOn(midi, 0.5 + state.pitchEngine.velocitySense * 0.5)
    heldNotes.current.add(midi)
    setPressed(new Set(heldNotes.current))
  }
  const releaseNote = (midi: number) => {
    if (holdRef.current) return
    noteOff(midi)
    heldNotes.current.delete(midi)
    if (legatoLast.current === midi) legatoLast.current = null
    setPressed(new Set(heldNotes.current))
  }

  // QWERTY
  useEffect(() => {
    if (!qwertyOn) return
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k in QWERTY) {
        e.preventDefault()
        press(baseMidi + QWERTY[k])
      } else if (k === 'z') setBaseOct((o) => Math.max(1, o - 1))
      else if (k === 'x') setBaseOct((o) => Math.min(5, o + 1))
      else if (k === 'c') setHold((h) => !h)
      else if (k === 'v') setLegato((l) => !l)
      else if (k === 'r') onToggleRecord()
      else if (k === 'q') setParams('pitchEngine', { quantizeOn: !state.pitchEngine.quantizeOn })
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k in QWERTY) releaseNote(baseMidi + QWERTY[k])
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qwertyOn, baseMidi, onToggleRecord, state.pitchEngine.quantizeOn, state.pitchEngine.velocitySense])

  // voice-tracked note highlight (DOM-direct, 60fps)
  useTeleFrame((t) => {
    const midi = t.pitch.locked && t.pitch.gateOpen ? Math.round(t.pitch.midi) : null
    if (midi === voiceKey.current) return
    if (voiceKey.current !== null) {
      const el = keyRefs.current.get(voiceKey.current)
      if (el) {
        el.style.boxShadow = ''
        el.style.borderTop = ''
      }
    }
    voiceKey.current = midi
    if (midi !== null) {
      const el = keyRefs.current.get(midi)
      if (el) {
        el.style.boxShadow = '0 6px 12px rgba(255,46,136,0.45), inset 0 -2px 0 var(--accent-magenta)'
        el.style.transition = 'box-shadow 80ms'
      }
    }
  })

  const whites: { midi: number; letter: string; inScale: boolean }[] = []
  const blacks: { midi: number; xFrac: number; letter?: string }[] = []
  const scaleSet = new Set(SCALE_INTERVALS[state.pitchEngine.scale] ?? SCALE_INTERVALS.chromatic)
  const root = state.pitchEngine.root
  for (let oct = 0; oct < 2; oct++) {
    WHITE_LETTERS.forEach((letter, wi) => {
      const whiteSemis = [0, 2, 4, 5, 7, 9, 11]
      const midi = baseMidi + oct * 12 + whiteSemis[wi]
      const pc = (midi - root) % 12
      whites.push({ midi, letter: oct === 0 ? letter : '', inScale: !state.pitchEngine.quantizeOn || scaleSet.has((pc + 12) % 12) })
    })
    BLACK_AFTER_WHITE.forEach((wi, bi) => {
      const blackSemis = [1, 3, 6, 8, 10]
      const midi = baseMidi + oct * 12 + blackSemis[bi]
      blacks.push({ midi, xFrac: (oct * 7 + wi + 0.68) / 14, letter: oct === 0 ? BLACK_LETTERS[wi] : undefined })
    })
  }

  return (
    <div className="flex h-32 shrink-0 items-stretch gap-4 border-t border-line-hair bg-panel px-4 py-3">
      {/* left: touch strips */}
      <div className="flex w-[160px] shrink-0 items-center gap-3">
        <TouchStrip label="PITCH" bipolar onValue={(v) => engine.pitchBend(v)} />
        <TouchStrip label="MOD" bipolar={false} onValue={(v) => engine.modWheel(v)} />
        <div className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-ink-low">
          TOUCH
          <br />
          STRIPS
        </div>
      </div>

      {/* center: piano */}
      <div className="relative min-w-0 flex-1 select-none" role="group" aria-label="piano keyboard, two octaves">
        <div className="flex h-full gap-px">
          {whites.map(({ midi, letter, inScale }) => (
            <button
              key={midi}
              type="button"
              ref={(el) => {
                if (el) keyRefs.current.set(midi, el)
                else keyRefs.current.delete(midi)
              }}
              aria-label={`note ${midi}`}
              onPointerDown={(e) => {
                e.preventDefault()
                press(midi)
              }}
              onPointerUp={() => releaseNote(midi)}
              onPointerEnter={(e) => {
                if (e.buttons === 1 && !heldNotes.current.has(midi)) press(midi)
              }}
              onPointerLeave={() => {
                if (heldNotes.current.has(midi) && !holdRef.current) releaseNote(midi)
              }}
              className="relative flex-1 rounded-b-[2px] border border-line-hair transition-transform duration-100"
              style={{
                backgroundColor: 'rgba(242,240,235,0.9)',
                transform: pressed.has(midi) ? 'translateY(2px)' : 'none',
              }}
            >
              {inScale && state.pitchEngine.quantizeOn && (
                <span className="absolute left-1/2 top-1 h-[2px] w-[2px] -translate-x-1/2 rounded-full bg-cyan" />
              )}
              {letter && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-ink-low">
                  {letter}
                </span>
              )}
            </button>
          ))}
        </div>
        {blacks.map(({ midi, xFrac, letter }) => (
          <button
            key={midi}
            type="button"
            ref={(el) => {
              if (el) keyRefs.current.set(midi, el)
              else keyRefs.current.delete(midi)
            }}
            aria-label={`note ${midi}`}
            onPointerDown={(e) => {
              e.preventDefault()
              press(midi)
            }}
            onPointerUp={() => releaseNote(midi)}
            onPointerEnter={(e) => {
              if (e.buttons === 1 && !heldNotes.current.has(midi)) press(midi)
            }}
            onPointerLeave={() => {
              if (heldNotes.current.has(midi) && !holdRef.current) releaseNote(midi)
            }}
            className="absolute top-0 z-10 h-[58%] rounded-b-[2px] border border-black bg-display transition-transform duration-100"
            style={{
              left: `${xFrac * 100}%`,
              width: `${(1 / 14) * 62}%`,
              transform: `translateX(-50%) ${pressed.has(midi) ? 'translateY(2px)' : ''}`,
            }}
          >
            {letter && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-ink-low">
                {letter}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* right cluster */}
      <div className="flex w-[200px] shrink-0 flex-col items-end justify-center gap-2">
        <Stepper
          label="OCT"
          display={`C${baseOct}–B${baseOct + 1}`}
          onDec={() => setBaseOct((o) => Math.max(1, o - 1))}
          onInc={() => setBaseOct((o) => Math.min(5, o + 1))}
          decDisabled={baseOct <= 1}
          incDisabled={baseOct >= 5}
        />
        <div className="flex items-center gap-4">
          <LEDToggle on={hold} onChange={(v) => {
            setHold(v)
            if (!v) {
              heldNotes.current.forEach((m) => noteOff(m))
              heldNotes.current.clear()
              setPressed(new Set())
            }
          }} label="HOLD" color="var(--accent-magenta)" />
          <LEDToggle on={legato} onChange={setLegato} label="LEGATO" color="var(--accent-cyan)" />
          <LEDToggle on={qwertyOn} onChange={setQwertyOn} label="QWERTY" color="var(--accent-cyan)" />
        </div>
      </div>
    </div>
  )
}
