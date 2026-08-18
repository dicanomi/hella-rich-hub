/**
 * Presets — factory list (falls back to locally-built 12 when the stub engine
 * only ships INIT PATCH), user presets in localStorage, JSON export/import.
 */
import { FACTORY_PRESETS, defaultEngineState } from '@/audio'
import type { EngineState, Preset, ModRoute } from '@/audio'

const LS_KEY = 'voxform.presets'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

function make(id: string, name: string, tag: string, mut: (s: EngineState) => void): Preset {
  const state = defaultEngineState()
  mut(state)
  return { id, name, tag, factory: true, state }
}

const route = (source: ModRoute['source'], dest: ModRoute['dest'], amount: number): ModRoute => ({
  id: `${source}-${dest}`, source, dest, amount, enabled: true,
})

/** The 12 factory presets (S11). Used when the engine stub ships only INIT. */
export const LOCAL_FACTORY: Preset[] = [
  make('neon-choir', 'NEON CHOIR', 'PAD', (s) => {
    s.oscA.wavetable = 'vocalFormant'; s.oscA.unison = 5; s.oscA.detune = 0.35; s.oscA.blend = 0.7
    s.oscB.enabled = true; s.oscB.wavetable = 'basicShapes'; s.oscB.unison = 3; s.oscB.detune = 0.3; s.oscB.level = 0.55
    s.filter.cutoffHz = 1800; s.filter.resonance = 0.2
    s.env1.attackMs = 180; s.env1.releaseMs = 600
    s.fx.chorus.enabled = true; s.fx.reverb.enabled = true; s.fx.reverb.params.size = 0.7; s.fx.reverb.params.mix = 0.4
    s.matrix = [route('follower', 'cutoff', 0.35), route('macro1', 'cutoff', 0.5), route('lfo1', 'wtPosA', 0.3)]
  }),
  make('velvet-lead', 'VELVET LEAD', 'LEAD', (s) => {
    s.oscA.wavetable = 'analogGrit'; s.oscA.wtPos = 0.4
    s.filter.cutoffHz = 2400; s.filter.resonance = 0.35; s.filter.drive = 0.45
    s.pitchEngine.glideMs = 90
    s.fx.saturator.enabled = true; s.fx.saturator.params.drive = 0.4
    s.fx.delay.enabled = true; s.fx.delay.params.mix = 0.3
    s.matrix = [route('macro1', 'cutoff', 0.45), route('velocity', 'level', 0.6)]
  }),
  make('glass-pad', 'GLASS PAD', 'PAD', (s) => {
    s.oscA.wavetable = 'glass'; s.oscA.unison = 4; s.oscA.detune = 0.25
    s.oscB.enabled = true; s.oscB.wavetable = 'harmonics'; s.oscB.level = 0.5
    s.env1.attackMs = 600; s.env1.releaseMs = 2000
    s.filter.cutoffHz = 3200
    s.fx.reverb.enabled = true; s.fx.reverb.params.size = 0.85; s.fx.reverb.params.mix = 0.55
    s.matrix = [route('lfo2', 'wtPosA', 0.4), route('macro2', 'wtPosA', 0.5)]
  }),
  make('solar-bass', 'SOLAR BASS', 'BASS', (s) => {
    s.oscA.wavetable = 'basicShapes'; s.oscA.octave = -1
    s.sub.enabled = true; s.sub.shape = 'sine'; s.sub.level = 0.8
    s.filter.mode = 'lp24'; s.filter.cutoffHz = 420; s.filter.resonance = 0.4; s.filter.envAmt = 0.55
    s.pitchEngine.quantizeOn = true; s.pitchEngine.scale = 'minor'
    s.fx.saturator.enabled = true; s.fx.saturator.params.drive = 0.55
    s.matrix = [route('env1', 'cutoff', 0.5)]
  }),
  make('whisper-keys', 'WHISPER KEYS', 'KEYS', (s) => {
    s.oscA.wavetable = 'harmonics'; s.noise.enabled = true; s.noise.pitchTrack = true; s.noise.level = 0.18
    s.env1.attackMs = 12; s.env1.decayMs = 480; s.env1.sustain = 0.4
    s.filter.cutoffHz = 2800
    s.fx.reverb.enabled = true; s.fx.reverb.params.mix = 0.3
    s.matrix = [route('follower', 'noiseLevel', 0.6)]
  }),
  make('analog-hymn', 'ANALOG HYMN', 'PAD', (s) => {
    s.oscA.wavetable = 'analogGrit'; s.oscA.unison = 3; s.oscA.detune = 0.2
    s.oscB.enabled = true; s.oscB.unison = 3; s.oscB.detune = 0.22; s.oscB.octave = 1; s.oscB.level = 0.4
    s.env1.attackMs = 400; s.env1.releaseMs = 1200
    s.fx.chorus.enabled = true; s.fx.chorus.params.depth = 0.6
    s.matrix = [route('lfo1', 'pitch', 0.08), route('macro1', 'cutoff', 0.4)]
  }),
  make('formant-ghost', 'FORMANT GHOST', 'VOX', (s) => {
    s.oscA.wavetable = 'vocalFormant'; s.oscA.wtPos = 0.6
    s.filter.mode = 'bp'; s.filter.resonance = 0.55; s.filter.cutoffHz = 1100
    s.noise.enabled = true; s.noise.pitchTrack = true; s.noise.level = 0.25; s.noise.color = 0.4
    s.matrix = [route('follower', 'wtPosA', 0.55), route('macro2', 'wtPosA', 0.6)]
  }),
  make('tape-whistle', 'TAPE WHISTLE', 'LEAD', (s) => {
    s.oscA.wavetable = 'basicShapes'; s.oscA.wtPos = 0.15
    s.pitchEngine.glideMs = 140; s.pitchEngine.vibratoSense = 0.9
    s.lfo1.shape = 'sine'; s.lfo1.rateHz = 5.5; s.lfo1.depth = 0.5
    s.fx.delay.enabled = true; s.fx.delay.params.timeMs = 240; s.fx.delay.params.feedback = 0.45
    s.matrix = [route('lfo1', 'pitch', 0.18), route('macro1', 'cutoff', 0.35)]
  }),
  make('drone-temple', 'DRONE TEMPLE', 'DRONE', (s) => {
    s.oscA.wavetable = 'analogGrit'; s.oscA.octave = -1; s.oscA.unison = 4; s.oscA.detune = 0.5
    s.oscB.enabled = true; s.oscB.octave = -1; s.oscB.fineCents = 8; s.oscB.level = 0.6
    s.sub.enabled = true; s.sub.level = 0.7
    s.env1.attackMs = 2500; s.env1.releaseMs = 4000
    s.filter.cutoffHz = 800; s.filter.resonance = 0.3
    s.fx.reverb.enabled = true; s.fx.reverb.params.size = 0.95; s.fx.reverb.params.mix = 0.6
    s.matrix = [route('lfo3', 'cutoff', 0.3), route('follower', 'level', 0.7)]
  }),
  make('pluck-whistler', 'PLUCK WHISTLER', 'PLUCK', (s) => {
    s.oscA.wavetable = 'digitalEdge'; s.oscA.wtPos = 0.3
    s.env1.attackMs = 2; s.env1.decayMs = 300; s.env1.sustain = 0.1; s.env1.releaseMs = 120
    s.filter.cutoffHz = 3600; s.filter.envAmt = -0.4
    s.fx.delay.enabled = true; s.fx.delay.params.sync = true
    s.matrix = [route('env2', 'wtPosA', 0.5), route('velocity', 'level', 0.5)]
  }),
  make('bit-bird', 'BIT BIRD', 'FX', (s) => {
    s.oscA.wavetable = 'digitalEdge'; s.oscA.warpMode = 'mirror'; s.oscA.warpAmt = 0.6
    s.lfo3.shape = 'sh'; s.lfo3.rateHz = 8
    s.pitchEngine.quantizeOn = true; s.pitchEngine.scale = 'pentatonic'
    s.filter.mode = 'hp'; s.filter.cutoffHz = 900
    s.fx.delay.enabled = true; s.fx.delay.params.timeMs = 180
    s.matrix = [route('lfo3', 'pitch', 0.35), route('lfo2', 'wtPosA', 0.5)]
  }),
  make('mono-moan', 'MONO MOAN', 'LEAD', (s) => {
    s.oscA.wavetable = 'analogGrit'; s.oscA.wtPos = 0.7
    s.pitchEngine.glideMs = 220
    s.filter.mode = 'lp24'; s.filter.cutoffHz = 900; s.filter.resonance = 0.6; s.filter.drive = 0.6
    s.fx.saturator.enabled = true; s.fx.width.enabled = true; s.fx.width.params.width = 0
    s.matrix = [route('pitch', 'cutoff', 0.3), route('macro4', 'resonance', 0.4)]
  }),
]

export const FACTORY: Preset[] = FACTORY_PRESETS.length >= 12 ? FACTORY_PRESETS : LOCAL_FACTORY

// --- user presets (localStorage `voxform.presets`) -----------------------------
export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as Preset[]
    return Array.isArray(arr) ? arr.filter((p) => p && p.state?.version === 1) : []
  } catch {
    return []
  }
}

export function saveUserPresets(list: Preset[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* storage full/blocked */
  }
}

export function makeUserPreset(name: string, state: EngineState): Preset {
  return {
    id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.toUpperCase() || 'UNTITLED',
    tag: 'USER',
    factory: false,
    state: clone(state),
  }
}

export function exportPresetJson(p: Preset) {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.voxform.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parsePresetJson(text: string): Preset | null {
  try {
    const p = JSON.parse(text) as Preset
    if (!p || typeof p.name !== 'string' || p.state?.version !== 1) return null
    return { ...p, id: `u-${Date.now().toString(36)}`, factory: false, tag: p.tag || 'USER' }
  } catch {
    return null
  }
}

// --- settings (`voxform.settings`) ----------------------------------------------
export interface VoxSettings {
  accentSwap: boolean
}
export function loadSettings(): VoxSettings {
  try {
    const raw = localStorage.getItem('voxform.settings')
    if (raw) return { accentSwap: false, ...(JSON.parse(raw) as Partial<VoxSettings>) }
  } catch {
    /* ignore */
  }
  return { accentSwap: false }
}
export function saveSettings(s: VoxSettings) {
  try {
    localStorage.setItem('voxform.settings', JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
/** Swap the whole accent system (magenta ⇄ cyan) by overriding the CSS vars. */
export function applyAccentSwap(swap: boolean) {
  const root = document.documentElement.style
  if (swap) {
    root.setProperty('--accent-magenta', '#00E5C7')
    root.setProperty('--accent-magenta-dim', '#0B6B5F')
    root.setProperty('--accent-cyan', '#FF2E88')
    root.setProperty('--accent-cyan-dim', '#8A1B4D')
  } else {
    root.removeProperty('--accent-magenta')
    root.removeProperty('--accent-magenta-dim')
    root.removeProperty('--accent-cyan')
    root.removeProperty('--accent-cyan-dim')
  }
}
