/** Deterministic pseudo-wavetable shapes for the oscillator display (visual only). */
import type { WavetableName } from '@/audio'

/** Sample one cycle of wavetable `name` at morph position `pos` (0..1), phase 0..1. */
export function wtSample(name: WavetableName, pos: number, phase: number): number {
  const t = phase % 1
  const sine = Math.sin(t * Math.PI * 2)
  const tri = t < 0.5 ? t * 4 - 1 : 3 - t * 4
  const saw = t * 2 - 1
  const sq = t < 0.5 ? 1 : -1
  const mix = (a: number, b: number, x: number) => a + (b - a) * Math.min(1, Math.max(0, x))
  switch (name) {
    case 'basicShapes': {
      // sine → triangle → saw → square across pos
      if (pos < 1 / 3) return mix(sine, tri, pos * 3)
      if (pos < 2 / 3) return mix(tri, saw, pos * 3 - 1)
      return mix(saw, sq, pos * 3 - 2)
    }
    case 'analogGrit': {
      const grit = Math.sin(t * 127.1) * 0.08
      return mix(saw + grit, sq * 0.9 + grit, pos)
    }
    case 'vocalFormant': {
      const f1 = Math.sin(t * Math.PI * 2 * (2 + Math.floor(pos * 3))) * 0.5
      const f2 = Math.sin(t * Math.PI * 2 * (5 + Math.floor(pos * 4))) * 0.25
      return (sine * 0.8 + f1 + f2) * 0.7
    }
    case 'harmonics': {
      let v = sine
      const n = 1 + Math.floor(pos * 6)
      for (let i = 2; i <= n + 1; i++) v += Math.sin(t * Math.PI * 2 * i) / i
      return v * 0.7
    }
    case 'digitalEdge': {
      const steps = Math.max(2, Math.round(16 - pos * 12))
      const q = Math.round(sine * steps) / steps
      return mix(q, sq, pos * 0.5)
    }
    case 'glass': {
      return (sine + Math.sin(t * Math.PI * 2 * 3) * 0.3 * pos + Math.sin(t * Math.PI * 2 * 7.01) * 0.18 * pos) * 0.8
    }
  }
}

export const WT_NAMES: WavetableName[] = ['basicShapes', 'analogGrit', 'vocalFormant', 'harmonics', 'digitalEdge', 'glass']
export const WT_LABELS: Record<WavetableName, string> = {
  basicShapes: 'BASIC SHAPES', analogGrit: 'ANALOG GRIT', vocalFormant: 'VOCAL FORMANT',
  harmonics: 'HARMONICS', digitalEdge: 'DIGITAL EDGE', glass: 'GLASS',
}
