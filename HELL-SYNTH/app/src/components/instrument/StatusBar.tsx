/** Status bar — chain breadcrumbs, transport, MIDI, REC, latency, preset. */
import { useEngine, useTele } from './engine'

const CRUMBS: { label: string; module: string | null }[] = [
  { label: 'KEYS', module: null },
  { label: 'OSC A+B', module: 'osc' },
  { label: 'LADDER', module: 'filter' },
  { label: 'MATRIX', module: 'mod' },
  { label: 'FX', module: 'fx' },
  { label: 'OUT', module: null },
]

export default function StatusBar() {
  const { recording, presetName, dirty, setCrumbHover, bpm, midiName, midiSupported } = useEngine()
  const info = useTele(
    (t) => ({ sr: t.info.sampleRate, buf: t.info.bufferSize, lat: Math.round(t.info.latencyMs) }),
    (a, b) => a.sr === b.sr && a.buf === b.buf && a.lat === b.lat,
  )
  const transportPlaying = useTele((t) => t.info.transportPlaying ?? false)
  const latWarn = info.lat > 15

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-line-hair bg-panel px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-low">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-ink-low/70">SIGNAL:</span>
        {CRUMBS.map((c, i) => (
          <span key={c.label} className="flex items-center">
            {i > 0 && <span className="mx-1 text-ink-low/50">→</span>}
            <span
              onMouseEnter={() => c.module && setCrumbHover(c.module)}
              onMouseLeave={() => c.module && setCrumbHover(null)}
              className={c.module ? 'cursor-default transition-colors hover:text-cyan' : ''}
            >
              {c.label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span
          title="Master transport (SPACE) — sequencer, delay SYNC and LFO sync follow this clock"
          className={transportPlaying ? 'text-cyan' : ''}
        >
          {transportPlaying ? '▶' : '❚❚'} {bpm} BPM
        </span>
        <span
          title={
            !midiSupported
              ? 'This browser has no Web MIDI API (Chrome/Edge support it)'
              : midiName
                ? `USB MIDI connected: ${midiName}`
                : 'Plug in a USB MIDI keyboard to play notes'
          }
          className={`flex items-center gap-1.5 ${midiName ? 'text-cyan' : ''}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${midiName ? 'bg-cyan' : 'bg-ink-low'}`}
            style={midiName ? { boxShadow: '0 0 4px var(--accent-cyan)' } : undefined}
          />
          MIDI{midiName ? `: ${midiName.toUpperCase()}` : midiSupported ? ': NONE' : ': N/A'}
        </span>
        {recording && (
          <span className="flex items-center gap-1.5 text-signal-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-red" />
            REC — 48kHz · 32-BIT FLOAT
          </span>
        )}
        <span
          title={latWarn ? 'High round-trip latency — close other audio apps/tabs to free the device' : undefined}
          className={latWarn ? 'animate-pulse text-warn-amber' : ''}
        >
          {Math.round(info.sr / 1000)}kHz · BUFFER {info.buf} · ~{info.lat}ms
        </span>
        <span>
          PRESET: <span className="text-ink-mid">{presetName}{dirty ? '*' : ''}</span>
        </span>
        <span className="flex items-center gap-1.5">
          MADE IN SOMA SF
          <span className="h-1.5 w-1.5 rounded-full bg-led-green" style={{ boxShadow: '0 0 4px var(--led-green)' }} />
        </span>
      </div>
    </footer>
  )
}
