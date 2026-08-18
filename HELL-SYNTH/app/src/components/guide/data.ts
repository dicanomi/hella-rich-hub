/**
 * Guide page content model. Control reference rows mirror the real engine
 * contract (src/audio/contract.ts) — names and ranges must stay in sync.
 */

export interface SpecRow {
  control: string
  range: string
  description: string
}

export interface ModuleBlock {
  id: string
  nav: string
  title: string
  /** LED dot color (design.md §2 modulator coding). */
  led: string
  purpose: string
  groups: { label?: string; rows: SpecRow[] }[]
}

export const MODULES: ModuleBlock[] = [
  {
    id: 'keys-sequencer',
    nav: 'KEYS + SEQ',
    title: 'KEYS + SEQUENCER',
    led: 'var(--accent-magenta)',
    purpose: 'QWERTY, the on-screen piano, USB MIDI — and a 16-step sequencer on a lookahead master clock.',
    groups: [
      {
        label: 'PLAYING',
        rows: [
          { control: 'GLIDE', range: '0–500 MS', description: 'Portamento smoothing between notes. Zero is a hard switch, 500ms is a slow sweep.' },
          { control: 'OCTAVE SHIFT', range: 'Z / X', description: 'QWERTY octave down / up, two octaves each way.' },
          { control: 'VELOCITY SENSE', range: '0–100%', description: 'How strongly MIDI velocity maps to note velocity.' },
          { control: 'PITCH QUANTIZE', range: 'ON / OFF', description: 'Snaps played notes to a key. Pair with SCALE + ROOT to stay perfectly in tune.' },
          { control: 'SCALE', range: '6 SCALES', description: 'Chromatic, major, minor, pentatonic, dorian, whole tone.' },
          { control: 'ROOT', range: 'C–B', description: 'Root note of the quantize scale.' },
          { control: 'HOLD / LEGATO', range: 'C / V', description: 'Hold latches notes; legato retriggers pitch without re-opening the gate.' },
        ],
      },
      {
        label: 'SEQUENCER + TRANSPORT',
        rows: [
          { control: 'STEPS', range: '16', description: 'Click a cell to toggle its gate; drag vertically to set pitch, 6px per semitone.' },
          { control: 'LENGTH №', range: '1–16', description: 'How many steps the pattern loops over.' },
          { control: 'PLAY / STOP', range: 'SPACE', description: 'Runs or stops the master clock — the sound fades in and out over 350ms.' },
          { control: 'BPM', range: '30–300', description: 'Master tempo. Delay SYNC and LFO sync follow it.' },
          { control: '← / →', range: 'PRESETS', description: 'Arrow keys flip to the previous / next preset — your master volume, drums, and XY drift ride along unchanged.' },
          { control: 'DRUMS', range: 'KICK / HAT / CLAP', description: 'Sketch beat on the transport clock — hear your patch against a rough groove. Processed by its own dotted-8th echo + reverb, not the FX rack.' },
          { control: 'DRUM LEVEL / ECHO', range: '0–100%', description: 'Drum bus level and how much of it hits the echo send.' },
        ],
      },
    ],
  },
  {
    id: 'oscillators',
    nav: 'OSCILLATORS',
    title: 'OSCILLATORS A / B · SUB · NOISE',
    led: 'var(--accent-cyan)',
    purpose: 'Two morphing wavetable oscillators plus a sub and a noise source.',
    groups: [
      {
        label: 'OSC A / B',
        rows: [
          { control: 'WAVETABLE', range: '6 BANKS', description: 'Morphable source: Basic Shapes, Analog Grit, Vocal Formant, Harmonics, Digital Edge, Glass.' },
          { control: 'WT POS', range: '0–100%', description: 'Position within the wavetable. The prime modulation target.' },
          { control: 'UNISON', range: '1–7', description: 'Stacked voices per oscillator.' },
          { control: 'DETUNE', range: '0–100%', description: 'Pitch spread across unison voices.' },
          { control: 'BLEND', range: '0–100%', description: 'Stereo spread of the unison stack.' },
          { control: 'WARP', range: 'SYNC / FM←B / BEND / MIRROR', description: 'Waveform distortion mode, with an amount knob beside it.' },
          { control: 'PAN', range: 'L–R', description: 'Stereo placement of the oscillator.' },
          { control: 'LEVEL', range: '0–100%', description: 'Oscillator output into the mixer.' },
          { control: 'FINE', range: '±100¢', description: 'Fine pitch in cents — beat it against the other oscillator.' },
          { control: 'OCT / SEMI', range: '±2 OCT / ±12 ST', description: 'Coarse tuning in octaves and semitones.' },
        ],
      },
      {
        label: 'SUB',
        rows: [
          { control: 'SHAPE', range: 'SINE / TRI / SQ1 / SQ2', description: 'Sub-oscillator waveform.' },
          { control: 'LEVEL', range: '0–100%', description: 'Sub level into the mixer.' },
          { control: 'OCTAVE', range: '−2…0', description: 'One or two octaves below the played note.' },
        ],
      },
      {
        label: 'NOISE',
        rows: [
          { control: 'COLOR', range: 'WHITE→PINK→BROWN', description: 'Spectral tilt of the noise source.' },
          { control: 'LEVEL', range: '0–100%', description: 'Noise level into the mixer — breath and air.' },
          { control: 'PITCH TRACK', range: 'ON / OFF', description: 'Lets the noise band follow the played note.' },
        ],
      },
    ],
  },
  {
    id: 'ladder-filter',
    nav: 'LADDER FILTER',
    title: 'LADDER FILTER',
    led: 'var(--accent-magenta)',
    purpose: 'Moog-style ladder. The hero control of the whole instrument.',
    groups: [
      {
        rows: [
          { control: 'MODE', range: 'LP24 / LP12 / BP / HP', description: 'Low-pass 24 or 12 dB/oct, band-pass, or high-pass.' },
          { control: 'CUTOFF', range: '20 HZ–20 KHZ', description: 'The big knob. Where the harmonics live or die.' },
          { control: 'RESONANCE', range: '0–100%', description: 'Emphasis at the cutoff. Self-oscillates past 85% — the filter becomes an oscillator.' },
          { control: 'DRIVE', range: '0–100%', description: 'Pre-filter saturation. Grit before the scoop.' },
          { control: 'KEY TRACK', range: '0–100%', description: 'Cutoff follows the note — keeps timbre consistent across the keyboard.' },
          { control: 'ENV AMT', range: '±100%', description: 'Bipolar envelope depth into the cutoff.' },
        ],
      },
    ],
  },
  {
    id: 'modulation',
    nav: 'MODULATION',
    title: 'MODULATION',
    led: 'var(--accent-cyan)',
    purpose: 'Envelopes, LFOs, velocity and mod wheel — patched anywhere in the matrix.',
    groups: [
      {
        label: 'ENV 1–2 (AHDSR)',
        rows: [
          { control: 'ATTACK', range: '0–4000 MS', description: 'Time from gate to peak.' },
          { control: 'HOLD', range: '0–2000 MS', description: 'Time held at peak before decay.' },
          { control: 'DECAY', range: '0–4000 MS', description: 'Fall from peak to sustain level.' },
          { control: 'SUSTAIN', range: '0–100%', description: 'Level held while the gate is open.' },
          { control: 'RELEASE', range: '0–8000 MS', description: 'Tail after the gate closes.' },
          { control: 'CURVE', range: 'LIN / EXP / LOG', description: 'Segment shape, set per envelope.' },
        ],
      },
      {
        label: 'LFO 1–3',
        rows: [
          { control: 'SHAPE', range: '6 SHAPES', description: 'Sine, triangle, saw, square, sample & hold, custom.' },
          { control: 'RATE', range: '0.01–20 HZ', description: 'Free-running speed when unsynced.' },
          { control: 'SYNC', range: '1/1–1/16', description: 'Lock the rate to tempo divisions, including triplets.' },
          { control: 'DEPTH', range: '0–100%', description: 'Output amplitude of the LFO.' },
          { control: 'PHASE', range: '0–100%', description: 'Start position of the cycle.' },
          { control: 'DELAY', range: '0–2000 MS', description: 'Fade-in time before the LFO reaches full depth.' },
          { control: 'SMOOTH', range: '0–100%', description: 'Low-pass on the output — rounds off squares and S&H.' },
        ],
      },
      {
        label: 'HUMAN',
        rows: [
          { control: 'WANDER', range: 'SMOOTH RANDOM', description: 'Picks a new random target every interval and glides there — unpredictability and human touch, routable anywhere.' },
          { control: 'RATE', range: '0.05–8 HZ', description: 'How often a new random target is picked. Slow = gentle drift, fast = nervous jitter.' },
          { control: 'SYNC', range: '1/1–1/32', description: 'Lock the wander interval to tempo divisions.' },
          { control: 'DEPTH', range: '0–100%', description: 'Output amplitude of the wander.' },
        ],
      },
      {
        label: 'MOD MATRIX',
        rows: [
          { control: 'SLOTS', range: '12', description: 'Source → amount → destination rows. Drag-and-drop routing, per-row enable.' },
          { control: 'SOURCES', range: '15', description: 'ENV 1–2, LFO 1–3, HUMAN, VELOCITY, PITCH, MACRO 1–4, XY X/Y, MOD WHEEL.' },
          { control: 'AMOUNT', range: '±100%', description: 'Bipolar depth per route. Negative inverts the source.' },
        ],
      },
    ],
  },
  {
    id: 'fx-rack',
    nav: 'FX RACK',
    title: 'FX RACK',
    led: 'var(--accent-cyan)',
    purpose: 'Six reorderable processors after the filter. Drag ≡ to re-order the chain.',
    groups: [
      {
        rows: [
          { control: 'SATURATOR', range: 'DRIVE / MIX', description: 'Harmonic saturation with parallel blend.' },
          { control: 'CHORUS', range: 'RATE / DEPTH', description: 'Width and movement for leads and pads.' },
          { control: 'DELAY', range: 'TIME / FEEDBACK / SYNC', description: 'Echo with tempo sync and tap tempo.' },
          { control: 'REVERB', range: 'SIZE / MIX', description: 'Space, from tight room to hall.' },
          { control: 'WIDTH', range: 'WIDTH / MONO-BASS', description: 'Stereo image control; MONO-BASS keeps the low end centered.' },
          { control: 'COMPRESSOR', range: 'AMOUNT / MIX', description: 'Glues the output. On by default.' },
        ],
      },
    ],
  },
  {
    id: 'xy-macros',
    nav: 'XY + MACROS',
    title: 'XY PAD + MACROS',
    led: 'var(--accent-magenta)',
    purpose: 'Performance surface. Two axes and four knobs that reach anywhere.',
    groups: [
      {
        rows: [
          { control: 'X AXIS', range: 'ANY DEST', description: 'Assignable to any matrix destination. Defaults to CUTOFF.' },
          { control: 'Y AXIS', range: 'ANY DEST', description: 'Assignable to any matrix destination. Defaults to WT POS A.' },
          { control: 'HOLD', range: 'ON / OFF', description: 'Latches the pad position when you let go.' },
          { control: 'DRIFT', range: 'OFF / SLOW / MED / FAST', description: 'Auto-glide: the node wanders to a random spot every segment, so the FX breathes on its own.' },
          { control: 'DRIFT SYNC', range: 'ON / OFF', description: 'Sync drift segments to tempo — 2 bars / 1 bar / 2 beats.' },
          { control: 'MACRO 1–4', range: '0–100%', description: 'Renameable multi-destination sources — one gesture, many parameters.' },
        ],
      },
    ],
  },
  {
    id: 'recorder',
    nav: 'RECORDER',
    title: 'RECORDER',
    led: 'var(--signal-red)',
    purpose: 'One button to a master-ready WAV. Rendered offline, faster than realtime.',
    groups: [
      {
        rows: [
          { control: '● REC', range: 'START / STOP', description: 'Arms and captures the master bus. Elapsed time shows beside the button.' },
          { control: 'REVIEW', range: 'TRIM / AUDITION', description: 'Stop opens the review modal: see the waveform, trim the take, press SPACE to audition.' },
          { control: 'NORMALIZE', range: 'OPT −1 DBFS', description: 'Optional peak normalization on export.' },
          { control: 'SAVE', range: 'WAV 48K / 32F', description: '48 kHz / 32-bit float stereo WAV of the master output, named TAKE_07.WAV.' },
        ],
      },
    ],
  },
]

export interface ShortcutRow {
  keys: string[]
  action: string
}

export const SHORTCUTS: ShortcutRow[] = [
  { keys: ['SPACE'], action: 'Play / stop the engine — sound fades in and out' },
  { keys: ['←', '/', '→'], action: 'Previous / next preset' },
  { keys: ['A', '–', 'K'], action: 'Play notes — white keys' },
  { keys: ['W', 'E', 'T', 'Y', 'U'], action: 'Play notes — black keys' },
  { keys: ['Z', '/', 'X'], action: 'Octave down / up' },
  { keys: ['C'], action: 'Hold toggle' },
  { keys: ['V'], action: 'Legato toggle' },
  { keys: ['R'], action: 'Record start / stop' },
  { keys: ['Q'], action: 'Pitch quantize toggle' },
  { keys: ['F'], action: 'Fullscreen visualizer' },
  { keys: ['1', '–', '4', '+ DRAG'], action: 'Assign macro' },
  { keys: ['SPACE'], action: 'Audition take (in review modal)' },
  { keys: ['ESC'], action: 'Close modal / exit fullscreen' },
  { keys: ['SHIFT', '+ DRAG'], action: 'Fine knob control' },
  { keys: ['DBL-CLICK'], action: 'Reset knob to default' },
]

export interface FaqItem {
  q: string
  a: string
}

export const FAQ: FaqItem[] = [
  {
    q: 'Does anything get uploaded?',
    a: "No. The engine runs locally in an AudioWorklet. There is no server. The only network requests are this page's files.",
  },
  {
    q: 'What browsers work?',
    a: 'Chrome, Edge, and Safari 17+. Firefox works; Safari needs one extra click to resume audio. USB MIDI needs Chrome or Edge.',
  },
  {
    q: 'Why 48kHz / 32-bit float?',
    a: 'The resolution your DAW session already uses. 32-bit float means the exported file literally cannot clip.',
  },
  {
    q: 'Can I plug in a USB piano?',
    a: 'Yes — Web MIDI. Connect any USB MIDI keyboard and it just plays; the status bar shows the device name. Chrome and Edge only.',
  },
  {
    q: 'Will this become a DAW plug-in?',
    a: "That's the plan. The DSP core is framework-free TypeScript; presets export as JSON today so your sounds can come along.",
  },
  {
    q: 'It feels latent — what do I do?',
    a: 'Settings → LOW LATENCY mode, and close other tabs using audio. The status bar shows real latency; keep it under ~10ms.',
  },
  {
    q: 'How do I stay perfectly in key?',
    a: 'Hit Q for QUANTIZE, pick a scale and root. Every note you play snaps to the scale.',
  },
  {
    q: 'Where are my presets stored?',
    a: 'localStorage on this device. Use EXPORT .JSON in the preset drawer to back them up or move machines.',
  },
]

export const SPEC_SHEET: { label: string; value: string }[] = [
  { label: 'FORMAT', value: 'WAV (PCM)' },
  { label: 'SAMPLE RATE', value: '48,000 HZ' },
  { label: 'BIT DEPTH', value: '32-BIT FLOAT' },
  { label: 'CHANNELS', value: 'STEREO' },
  { label: 'NORMALIZE', value: 'OPTIONAL −1 DBFS' },
  { label: 'SOURCE', value: 'MASTER OUTPUT, POST-FADE' },
  { label: 'RENDER', value: 'OFFLINE, FASTER-THAN-REALTIME' },
]
