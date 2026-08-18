import { useMemo } from 'react'

export type WaveformShape = 'sine' | 'saw' | 'square' | 'triangle' | 'pulse' | 'noise'

export interface WaveformThumbProps {
  shape?: WaveformShape
  width?: number
  height?: number
  /** Stroke color (defaults to --accent-cyan) */
  color?: string
  strokeWidth?: number
  /** Number of cycles drawn across the width */
  cycles?: number
  className?: string
}

const SAMPLES = 96

function sample(shape: WaveformShape, phase: number): number {
  const t = phase % 1
  switch (shape) {
    case 'sine':
      return Math.sin(t * Math.PI * 2)
    case 'saw':
      return t * 2 - 1
    case 'square':
      return t < 0.5 ? 1 : -1
    case 'pulse':
      return t < 0.25 ? 1 : -1
    case 'triangle':
      return t < 0.5 ? t * 4 - 1 : 3 - t * 4
    case 'noise':
      // deterministic pseudo-noise
      return Math.sin(t * 127.1) * Math.sin(t * 311.7) * 0.9
  }
}

/**
 * Thin cyan vector waveform drawing (design.md §7.5, FRQ Shift style) — used
 * for wavetable previews, LFO shape icons and FX module icons.
 */
export default function WaveformThumb({
  shape = 'sine',
  width = 64,
  height = 24,
  color = 'var(--accent-cyan)',
  strokeWidth = 1.5,
  cycles = 2,
  className = '',
}: WaveformThumbProps) {
  const d = useMemo(() => {
    const pad = strokeWidth
    const w = width - pad * 2
    const h = height - pad * 2
    const mid = pad + h / 2
    let path = ''
    for (let i = 0; i <= SAMPLES; i++) {
      const x = pad + (i / SAMPLES) * w
      const y = mid - sample(shape, (i / SAMPLES) * cycles) * (h / 2)
      path += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    }
    return path
  }, [shape, width, height, strokeWidth, cycles])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className={className}
    >
      <path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
