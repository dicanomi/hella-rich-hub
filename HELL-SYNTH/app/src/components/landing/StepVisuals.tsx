import { useEffect, useRef, useState } from 'react'

/* Lightweight synthesized demo visuals for the signal-chain step cards
   (home.md §4) — no audio, labeled DEMO. */

function useCanvas(draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const loop = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      draw(ctx, performance.now() / 1000, width, height)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [draw])
  return ref
}

const CYAN = '#00E5C7'
const MAGENTA = '#FF2E88'
const HAIR = '#26262C'

/** Step 1 — idle mic scope line (cyan, gentle wandering sine) */
export function MicScope({ width = 220, height = 56 }: { width?: number; height?: number }) {
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.strokeStyle = CYAN
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x <= w; x += 2) {
      const f = x / w
      const y =
        h / 2 +
        Math.sin(f * 9 + t * 2.2) * 6 * Math.sin(t * 0.7 + f * 2) +
        Math.sin(f * 23 - t * 3.1) * 2.5
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
  return <canvas ref={ref} width={width} height={height} style={{ width, height }} />
}

/** Step 2 — cycling note readout with cents needle */
const NOTES = ['A3', 'C4', 'G3', 'E4', 'D4', 'B3']
export function NoteReadout() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % NOTES.length), 900)
    return () => clearInterval(id)
  }, [])
  const cents = Math.round(Math.sin(i * 2.1) * 14)
  return (
    <div className="rounded-[4px] bg-display px-4 py-3 shadow-recessed">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[28px] leading-none text-ink-hi">{NOTES[i]}</span>
        <span className="font-mono text-[11px] text-cyan">
          {cents >= 0 ? '+' : ''}
          {cents}¢
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-ink-low">
          CONF 0.{93 + (i % 6)}
        </span>
      </div>
      {/* cents needle */}
      <div className="relative mt-3 h-px bg-line-hair">
        <span className="absolute left-1/2 top-[-3px] h-[7px] w-px bg-line-bright" />
        <span
          className="absolute top-[-3px] h-[7px] w-[2px] bg-magenta transition-[left] duration-300 ease-out-expo"
          style={{ left: `calc(50% + ${cents * 2}px)` }}
        />
      </div>
    </div>
  )
}

/** Step 3 — two wavetable morph lines (cyan + magenta) cycling shapes */
export function WavetableMorph({ width = 220, height = 64 }: { width?: number; height?: number }) {
  const ref = useCanvas((ctx, t, w, h) => {
    const morph = (Math.sin(t * 0.9) + 1) / 2 // 0..1 sine↔saw blend
    const draw = (color: string, phase: number, blend: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let x = 0; x <= w; x += 2) {
        const f = (x / w) * 2 + phase
        const sine = Math.sin(f * Math.PI * 2)
        const saw = 2 * (f % 1) - 1
        const y = h / 2 - (sine * (1 - blend) + saw * blend) * (h / 2 - 4)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    draw(CYAN, 0, morph)
    ctx.globalAlpha = 0.7
    draw(MAGENTA, 0.35, 1 - morph)
    ctx.globalAlpha = 1
  })
  return <canvas ref={ref} width={width} height={height} style={{ width, height }} />
}

/** Step 4 — resonant lowpass curve sweeping */
export function FilterSweep({ width = 220, height = 64 }: { width?: number; height?: number }) {
  const ref = useCanvas((ctx, t, w, h) => {
    // cutoff sweeps 20%..90% on a slow LFO
    const cutoff = 0.2 + ((Math.sin(t * 0.8) + 1) / 2) * 0.7
    ctx.strokeStyle = HAIR
    ctx.lineWidth = 1
    for (const g of [0.25, 0.5, 0.75]) {
      ctx.beginPath()
      ctx.moveTo(g * w, 0)
      ctx.lineTo(g * w, h)
      ctx.stroke()
    }
    ctx.strokeStyle = MAGENTA
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x <= w; x += 2) {
      const f = x / w
      const q = 8 // resonance peak
      const atten = 1 / Math.sqrt(1 + ((f / cutoff) ** 4))
      const peak = 1 + q * 0.12 * Math.exp(-(((f - cutoff) / 0.05) ** 2))
      const y = h - Math.min(1, atten * peak) * (h - 6) - 2
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
  return <canvas ref={ref} width={width} height={height} style={{ width, height }} />
}

/** Step 5 — mod routing lines drawing between chips */
export function RoutingLines() {
  const rows = [
    { src: 'ENV 1', dst: 'CUTOFF', c: MAGENTA },
    { src: 'LFO 1', dst: 'WT POS', c: CYAN },
    { src: 'LOUD', dst: 'DRIVE', c: '#3D9BFF' },
  ]
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.src} className="flex items-center gap-2">
          <span
            className="rounded-[2px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
            style={{ borderColor: r.c, color: r.c }}
          >
            {r.src}
          </span>
          <svg width="60" height="8" className="shrink-0">
            <line
              x1="0"
              y1="4"
              x2="60"
              y2="4"
              stroke={r.c}
              strokeWidth="1"
              strokeDasharray="60"
              strokeDashoffset="60"
              style={{
                animation: `vox-route-draw 2.4s ease-in-out ${i * 0.5}s infinite`,
              }}
            />
          </svg>
          <span className="rounded-[2px] border border-line-bright px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-mid">
            {r.dst}
          </span>
        </div>
      ))}
      <style>{`@keyframes vox-route-draw { 0% { stroke-dashoffset: 60 } 45% { stroke-dashoffset: 0 } 80% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: -60 } }`}</style>
    </div>
  )
}

/** Step 6 — waveform draws, then a file card slides out */
export function WavExport() {
  return (
    <div className="flex items-center gap-3">
      <svg width="120" height="48" viewBox="0 0 120 48">
        <path
          d="M2 24 L10 20 L16 30 L24 12 L32 38 L40 16 L48 28 L56 22 L64 26 L72 14 L80 34 L88 20 L96 26 L104 22 L112 24 L118 24"
          fill="none"
          stroke={CYAN}
          strokeWidth="1.5"
          strokeDasharray="220"
          strokeDashoffset="220"
          style={{ animation: 'vox-wav-draw 3s ease-in-out infinite' }}
        />
        <style>{`@keyframes vox-wav-draw { 0% { stroke-dashoffset: 220 } 50% { stroke-dashoffset: 0 } 90% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0.3 } }`}</style>
      </svg>
      <div
        className="rounded-[2px] border border-line-bright bg-raised px-3 py-2"
        style={{ animation: 'vox-file-slide 3s ease-in-out infinite' }}
      >
        <p className="font-mono text-[10px] text-ink-hi">TAKE_01.WAV</p>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-low">
          48kHz · 32-bit float
        </p>
        <style>{`@keyframes vox-file-slide { 0%, 35% { transform: translateX(8px); opacity: 0 } 55%, 100% { transform: translateX(0); opacity: 1 } }`}</style>
      </div>
    </div>
  )
}
