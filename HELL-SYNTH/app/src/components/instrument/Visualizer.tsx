/** Visualizer strip (S3) — SCOPE / SPECTRUM / RIBBON canvas + telemetry overlay. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'
import { useEngine, useTele, useTeleFrame } from './engine'

type Mode = 'SCOPE' | 'SPECTRUM' | 'RIBBON'
const MODES: Mode[] = ['SCOPE', 'SPECTRUM', 'RIBBON']

const MAGENTA = '#FF2E88'
const INK_LOW = '#55555E'

/** Left telemetry column — note being played, Hz, output level. */
function Telemetry() {
  const playing = useTele((t) => t.pitch.freq > 0)
  const note = useTele((t) => (t.pitch.freq > 0 ? `${t.pitch.noteName}${t.pitch.octave}` : '—'))
  const freq = useTele((t) => t.pitch.freq, (a, b) => Math.abs(a - b) < 0.2)
  const locked = useTele((t) => t.pitch.locked)
  const levelRef = useRef<HTMLDivElement>(null)
  useTeleFrame((t) => {
    if (levelRef.current) {
      const db = t.info.outputPeakDb
      const v = db === -Infinity ? 0 : Math.min(1, Math.max(0, (db + 60) / 60))
      levelRef.current.style.width = `${v * 100}%`
    }
  })
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[200px] flex-col justify-center gap-1.5 px-4"
      style={{ background: 'linear-gradient(90deg, #08080A 0%, rgba(8,8,10,0.85) 60%, transparent 100%)' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={note}
          initial={{ scale: 1.08, color: MAGENTA }}
          animate={{ scale: 1, color: '#F2F0EB' }}
          transition={{ duration: 0.12 }}
          className="font-display text-[28px] font-semibold leading-none"
        >
          {note}
        </motion.div>
      </AnimatePresence>
      <div className="font-mono text-[10px] text-ink-mid">
        {playing ? `${freq.toFixed(1)} Hz` : '—'}
        {playing && (
          <span className="ml-2 text-cyan">{locked ? 'TRACKED' : 'MANUAL'}</span>
        )}
      </div>
      {/* output level */}
      <div className="mt-1 h-[3px] w-[120px] overflow-hidden rounded-[1px] bg-line-hair">
        <div ref={levelRef} className="h-full bg-cyan/70" style={{ width: '0%' }} />
      </div>
    </div>
  )
}

function drawIdle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.clearRect(0, 0, w, h)
  const breathe = Math.sin((time / 1000) * Math.PI) * 2 // ±2px on a 2s sine
  ctx.strokeStyle = 'rgba(0,229,199,0.25)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, h / 2 + breathe)
  ctx.lineTo(w, h / 2 + breathe)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,46,136,0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, h / 2 - breathe)
  ctx.lineTo(w, h / 2 - breathe)
  ctx.stroke()
  ctx.fillStyle = INK_LOW
  ctx.font = '11px "Fragment Mono", monospace'
  ctx.textAlign = 'center'
  const cursor = Math.floor(time / 530) % 2 === 0 ? '_' : ' '
  ctx.fillText(`AWAITING SIGNAL ${cursor}`, w / 2, h / 2 - 14)
}

function VizCanvas({ mode, height }: { mode: Mode; height: number }) {
  const { engine } = useEngine()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const ribbon = useRef<{ out: number[] }>({ out: [] })
  const silentSince = useRef<number | null>(null)
  const fade = useRef(1) // mode crossfade/idle blend

  useTeleFrame(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = parent.clientWidth
    const h = height
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const outAn = engine.getOutputAnalyser()
    const now = performance.now()

    if (!outAn) {
      drawIdle(ctx, w, h, now)
      return
    }

    // time-domain buffer (output only — HELLA.SYNTH has no input path)
    let peak = 0
    const read = (an: AnalyserNode | null) => {
      if (!an) return null
      const buf = new Float32Array(an.fftSize)
      an.getFloatTimeDomainData(buf)
      return buf
    }
    const outBuf = read(outAn)
    const scan = outBuf ?? new Float32Array(2048)
    for (let i = 0; i < scan.length; i += 4) peak = Math.max(peak, Math.abs(scan[i]))

    // silence > 3s → ease to idle breathe
    if (peak < 0.003) {
      if (silentSince.current === null) silentSince.current = now
      if (now - silentSince.current > 3000) {
        fade.current = Math.max(0, fade.current - 0.016 / 0.6)
      }
    } else {
      silentSince.current = null
      fade.current = Math.min(1, fade.current + 0.05)
    }
    if (fade.current <= 0) {
      drawIdle(ctx, w, h, now)
      return
    }

    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = fade.current
    const m = modeRef.current

    if (m === 'SCOPE') {
      const trace = (buf: Float32Array | null, color: string, width: number, glow: boolean) => {
        if (!buf) return
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.shadowColor = glow ? color : 'transparent'
        ctx.shadowBlur = glow ? 4 : 0
        ctx.beginPath()
        const n = Math.min(buf.length, 1024)
        for (let i = 0; i < n; i++) {
          const x = (i / n) * w
          const y = h / 2 - buf[i] * h * 0.45
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      trace(outBuf, MAGENTA, 2, true)
    } else if (m === 'SPECTRUM') {
      const fd = (an: AnalyserNode | null) => {
        if (!an) return null
        const b = new Uint8Array(an.frequencyBinCount)
        an.getByteFrequencyData(b)
        return b
      }
      const outF = fd(outAn)
      const BARS = 96
      const bw = w / BARS
      const peaks: number[] = []
      if (outF) {
        for (let i = 0; i < BARS; i++) {
          const bin = Math.floor(Math.pow(outF.length, i / BARS))
          peaks.push(outF[Math.min(outF.length - 1, bin)] / 255)
        }
      }
      const top8 = [...peaks].sort((a, b) => b - a)[7] ?? 1
      for (let i = 0; i < BARS; i++) {
        const x = i * bw
        if (outF && peaks[i] > 0.03) {
          ctx.fillStyle = 'rgba(0,229,199,0.7)'
          ctx.fillRect(x + 1, h - peaks[i] * (h - 14), bw - 2, peaks[i] * (h - 14))
        }
        if (outF && peaks[i] >= top8 && peaks[i] > 0.05) {
          ctx.fillStyle = MAGENTA
          ctx.fillRect(x + 1, h - peaks[i] * (h - 14), bw - 2, 2)
        }
      }
      // log axis ticks
      ctx.fillStyle = INK_LOW
      ctx.font = '9px "Fragment Mono", monospace'
      ctx.textAlign = 'center'
      const sr = 48000
      ;[100, 1000, 10000].forEach((f) => {
        const x = (Math.log(f / 30) / Math.log(sr / 2 / 30)) * w
        ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x, h - 3)
      })
    } else {
      // RIBBON — 8s scrolling history
      const rms = (buf: Float32Array | null) => {
        if (!buf) return 0
        let s = 0
        for (let i = 0; i < buf.length; i += 8) s += buf[i] * buf[i]
        return Math.sqrt(s / (buf.length / 8))
      }
      const hist = ribbon.current
      hist.out.push(rms(outBuf))
      const CAP = 480 // 8s at 60fps
      if (hist.out.length > CAP) hist.out.shift()
      const step = w / CAP
      const off = CAP - hist.out.length
      // output RMS band
      ctx.fillStyle = 'rgba(0,229,199,0.18)'
      ctx.beginPath()
      ctx.moveTo(off * step, h / 2)
      hist.out.forEach((v, i) => ctx.lineTo((off + i) * step, h / 2 - v * h * 1.2))
      for (let i = hist.out.length - 1; i >= 0; i--) ctx.lineTo((off + i) * step, h / 2 + hist.out[i] * h * 1.2)
      ctx.closePath()
      ctx.fill()
      // output line
      ctx.strokeStyle = MAGENTA
      ctx.lineWidth = 1.5
      ctx.shadowColor = MAGENTA
      ctx.shadowBlur = 3
      ctx.beginPath()
      hist.out.forEach((v, i) => {
        const x = (off + i) * step
        const y = h / 2 - v * h * 1.4
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1
  })

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
}

export default function Visualizer() {
  const [mode, setMode] = useState<Mode>('SCOPE')
  const [fullscreen, setFullscreen] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const cycleMode = () => setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length])

  const well = (h: number, fs: boolean) => (
    <div
      className={`relative overflow-hidden rounded-[4px] bg-display shadow-recessed ${fs ? 'h-full w-full' : ''}`}
      style={fs ? undefined : { height: h }}
      onClick={() => !fs && setFullscreen(true)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        cycleMode()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      aria-label="visualizer — click for fullscreen, double-click to cycle mode"
      tabIndex={0}
    >
      <VizCanvas mode={mode} height={fs ? (typeof window !== 'undefined' ? window.innerHeight : 600) : h} />
      <Telemetry />
      {/* mode tabs */}
      <div className="absolute right-3 top-2 z-10 flex gap-3" onClick={(e) => e.stopPropagation()}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`pb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              m === mode ? 'border-b border-cyan text-ink-hi' : 'border-b border-transparent text-ink-mid hover:text-ink-hi'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      {/* fullscreen hint */}
      <AnimatePresence>
        {hover && !fs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-[208px] top-2 z-10 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-low"
          >
            <Maximize2 size={9} /> FULLSCREEN
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.35 }}
        className="shrink-0 px-4"
        data-module="visualizer"
      >
        {well(176, false)}
      </motion.div>
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] bg-abyss"
          >
            {well(0, true)}
            <button
              type="button"
              aria-label="exit fullscreen"
              onClick={() => setFullscreen(false)}
              className="absolute right-4 top-4 z-20 rounded-[2px] border border-line-hair bg-panel p-2 text-ink-mid transition-colors hover:text-ink-hi"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-low">
              PERFORMANCE MODE — ESC TO EXIT
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
