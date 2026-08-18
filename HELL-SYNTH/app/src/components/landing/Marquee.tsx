const ITEMS = [
  '16-STEP SEQUENCER',
  'WAVETABLE + LADDER FILTER',
  'MOD MATRIX',
  '48kHz / 32-BIT FLOAT WAV',
  'RUNS IN YOUR BROWSER',
  'QWERTY + USB MIDI',
  'MADE IN SOMA SF',
]

/** Infinite marquee strip (home.md §3) — 64px, hairline borders, pauses on hover. */
export default function Marquee() {
  // three repetitions for a seamless -33.33% translate loop
  const runs = [0, 1, 2]
  return (
    <div className="h-16 overflow-hidden border-y border-line-hair bg-panel">
      <div
        className="flex h-full w-max items-center hover:[animation-play-state:paused]"
        style={{ animation: 'vox-marquee 30s linear infinite' }}
      >
        {runs.map((run) => (
          <div key={run} className="flex items-center" aria-hidden={run > 0}>
            {ITEMS.map((item) => (
              <span
                key={`${run}-${item}`}
                className="flex items-center whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.22em] text-ink-mid"
              >
                <span className="px-6">{item}</span>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-magenta" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
