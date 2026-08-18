/** StepSequencer — 16-step mono sequencer riding the master transport clock.
 *
 * Click a cell to toggle it on/off, drag vertically (or horizontally) to set
 * its pitch. The cyan playhead follows the transport; the pattern length is
 * set by clicking a step number. Everything here is a view over the engine's
 * SequencerState — the engine fires the notes on the master 16th-note grid,
 * so the sequencer stays sample-accurate with showcase, loops and SYNC'd FX.
 */
import { DEFAULT_SEQUENCER, SEQ_STEPS } from '@/audio'
import ModuleSection from '@/components/controls/ModuleSection'
import LEDToggle from '@/components/controls/LEDToggle'
import Knob from '@/components/controls/Knob'
import { useEngine, useTele } from './engine'
import { NOTE_NAMES, fmtPct } from './bits'

const NOTE_MIN = 24
const NOTE_MAX = 96

const noteName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`

export default function StepSequencer() {
  const { state, sequencer, setSeqStep, setSeqEnabled, setSequencer, setParams } = useEngine()
  const drums = state.drums
  const transportPlaying = useTele((t) => t.info.transportPlaying ?? false)
  const currentStep = useTele((t) => t.info.transportStep ?? null)

  const onCellPointerDown = (i: number, e: React.PointerEvent) => {
    e.preventDefault()
    const start = { ...sequencer.steps[i] }
    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    const mv = (ev: PointerEvent) => {
      const d = startY - ev.clientY + (ev.clientX - startX)
      if (!moved && Math.abs(d) < 4) return
      moved = true
      const semis = Math.round(d / 6)
      const note = Math.min(NOTE_MAX, Math.max(NOTE_MIN, start.note + semis))
      // dragging a dead step wakes it up — classic x0x behavior
      setSeqStep(i, { ...start, on: true, note })
    }
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
      if (!moved) setSeqStep(i, { ...start, on: !start.on })
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  const status = !sequencer.enabled
    ? 'SEQ OFF'
    : transportPlaying
      ? `STEP ${(currentStep ?? 0) + 1} / ${sequencer.length}`
      : 'READY'

  return (
    <ModuleSection
      title="STEP SEQUENCER"
      ledColor="var(--accent-cyan)"
      ledOn={sequencer.enabled}
      status={status}
      headerRight={
        <LEDToggle on={sequencer.enabled} onChange={setSeqEnabled} label="SEQ" color="var(--accent-cyan)" />
      }
      bodyClassName="!p-3"
    >
      {/* 16 cells — bar height = pitch, magenta = on, cyan frame = playhead */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SEQ_STEPS}, minmax(0,1fr))` }}>
        {sequencer.steps.map((s, i) => {
          const inLength = i < sequencer.length
          const playhead = currentStep === i
          const barPct = 12 + ((s.note - NOTE_MIN) / (NOTE_MAX - NOTE_MIN)) * 88
          return (
            <button
              key={i}
              type="button"
              aria-pressed={s.on}
              aria-label={`step ${i + 1}: ${s.on ? noteName(s.note) : 'off'}`}
              title={`${s.on ? noteName(s.note) : 'OFF'} — click toggles, drag sets pitch`}
              onPointerDown={(e) => onCellPointerDown(i, e)}
              className={`flex h-[86px] select-none flex-col rounded-[3px] border bg-display p-1 shadow-recessed outline-none transition-[border-color,box-shadow] duration-100 focus-visible:ring-1 focus-visible:ring-cyan ${
                playhead
                  ? 'border-cyan shadow-[0_0_10px_rgba(0,229,199,0.3)]'
                  : 'border-line-hair hover:border-line-bright'
              } ${inLength ? '' : 'opacity-30'}`}
              style={{ touchAction: 'none' }}
            >
              {/* playhead LED */}
              <span
                aria-hidden
                className="mx-auto h-1 w-1 shrink-0 rounded-full transition-all duration-75"
                style={{
                  backgroundColor: playhead ? 'var(--accent-cyan)' : 'transparent',
                  boxShadow: playhead ? '0 0 6px var(--accent-cyan)' : 'none',
                }}
              />
              {/* pitch bar */}
              <span className="relative mt-0.5 flex flex-1 items-end justify-center overflow-hidden rounded-[2px]">
                <span
                  aria-hidden
                  className="w-full rounded-[1px] transition-[height,background-color] duration-75"
                  style={{
                    height: `${s.on ? barPct : 6}%`,
                    backgroundColor: s.on
                      ? playhead
                        ? 'var(--accent-cyan)'
                        : 'var(--accent-magenta)'
                      : 'var(--line-hair)',
                    boxShadow: s.on
                      ? `0 0 6px ${playhead ? 'rgba(0,229,199,0.6)' : 'rgba(255,46,136,0.45)'}`
                      : 'none',
                  }}
                />
              </span>
              {/* note label */}
              <span
                className={`mt-0.5 shrink-0 text-center font-mono text-[8px] leading-none tracking-wide ${
                  s.on ? (playhead ? 'text-cyan' : 'text-ink-hi') : 'text-ink-low'
                }`}
              >
                {s.on ? noteName(s.note) : '——'}
              </span>
            </button>
          )
        })}
      </div>

      {/* length row — click a number to end the pattern there */}
      <div className="mt-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${SEQ_STEPS}, minmax(0,1fr))` }}>
        {sequencer.steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`set pattern length to ${i + 1}`}
            onClick={() => setSequencer({ ...sequencer, length: i + 1 })}
            className={`rounded-[2px] py-0.5 text-center font-mono text-[8px] leading-none transition-colors ${
              i + 1 === sequencer.length
                ? 'bg-cyan/15 text-cyan'
                : i < sequencer.length
                  ? 'text-ink-mid hover:text-ink-hi'
                  : 'text-ink-low/60 hover:text-ink-mid'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* DRUMS strip — sketch a rough beat against your patch. Own echo bus
          (dotted-8th delay into reverb); rides the transport clock. */}
      <div className="mt-2 flex items-center justify-between gap-3 rounded-[3px] border border-line-hair bg-display/50 px-2 py-1.5">
        <span
          className="micro-label shrink-0"
          title="Sketch drums — hear your patch against a rough beat. Processed by their own delay + reverb, not the FX rack."
        >
          DRUMS
        </span>
        <div className="flex items-center gap-3">
          {(['kick', 'hat', 'clap'] as const).map((d) => (
            <LEDToggle
              key={d}
              on={drums[d]}
              onChange={(on) => setParams('drums', { [d]: on })}
              label={d.toUpperCase()}
              color={d === 'kick' ? 'var(--accent-magenta)' : d === 'hat' ? 'var(--accent-cyan)' : '#FFD166'}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Knob size="mini" label="LEVEL" value={drums.level} defaultValue={0.7}
            onChange={(v) => setParams('drums', { level: Math.round(v * 100) / 100 })}
            formatValue={fmtPct} accentColor="var(--accent-magenta)" />
          <Knob size="mini" label="ECHO" value={drums.send} defaultValue={0.35}
            onChange={(v) => setParams('drums', { send: Math.round(v * 100) / 100 })}
            formatValue={fmtPct} accentColor="var(--accent-cyan)" />
        </div>
      </div>

      {/* footer: hint + reset */}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-low">
          CLICK = GATE · DRAG ↕↔ = PITCH · № = LENGTH
        </span>
        <button
          type="button"
          onClick={() =>
            setSequencer(JSON.parse(JSON.stringify(DEFAULT_SEQUENCER)))
          }
          className="rounded-[2px] border border-line-hair px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-mid transition-colors hover:border-line-bright hover:text-ink-hi"
        >
          RESET
        </button>
      </div>
    </ModuleSection>
  )
}
