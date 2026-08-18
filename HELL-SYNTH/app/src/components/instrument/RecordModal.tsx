/** Recorder review modal — waveform trim, audition, normalize, SAVE .WAV.
 *  Takes are master-output captures (48kHz / 32-bit float); no mic involved. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Pause, Play } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import LEDToggle from '@/components/controls/LEDToggle'
import type { RecordedTake, WavExportResult } from '@/audio'
import { useEngine, useTeleFrame } from './engine'
import { fmtSec } from './bits'

/** Waveform review canvas with trim handles + playhead. */
function WaveCanvas({
  take, trim, setTrim, zoom, playing, playStart,
}: {
  take: RecordedTake
  trim: [number, number]
  setTrim: (t: [number, number]) => void
  zoom: number
  playing: boolean
  playStart: number | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const peaks = useRef<Float32Array | null>(null)
  const draw = useRef(0)

  // precompute peaks per pixel-column bucket (max 2000 buckets)
  useEffect(() => {
    const ch = take.channels[0]
    if (!ch || ch.length === 0) {
      peaks.current = null
      return
    }
    const N = 2000
    const p = new Float32Array(N)
    const step = ch.length / N
    for (let i = 0; i < N; i++) {
      let max = 0
      const from = Math.floor(i * step)
      const to = Math.min(ch.length, Math.floor((i + 1) * step) + 1)
      for (let j = from; j < to; j += 16) max = Math.max(max, Math.abs(ch[j]))
      p[i] = max
    }
    peaks.current = p
  }, [take])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const dur = take.durationSec || 0.0001
    const xOf = (sec: number) => (sec / dur) * w

    // dim outside trim
    ctx.fillStyle = 'rgba(8,8,10,0.8)'
    ctx.fillRect(0, 0, xOf(trim[0]), h)
    ctx.fillRect(xOf(trim[1]), 0, w, h)

    // waveform (magenta), draw-in scrub on open
    const reveal = Math.min(1, draw.current)
    ctx.strokeStyle = '#FF2E88'
    ctx.lineWidth = 1
    ctx.beginPath()
    const p = peaks.current
    if (p) {
      for (let x = 0; x < w * reveal; x++) {
        const idx = Math.floor((x / w) * p.length * (1 / zoom))
        const v = p[Math.min(p.length - 1, idx)]
        ctx.moveTo(x + 0.5, h / 2 - v * (h / 2 - 4))
        ctx.lineTo(x + 0.5, h / 2 + v * (h / 2 - 4))
      }
    } else {
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w * reveal, h / 2)
    }
    ctx.stroke()

    // trim handles (hairline brackets)
    const handle = (x: number, side: 'l' | 'r') => {
      ctx.strokeStyle = '#F2F0EB'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      const d = side === 'l' ? 5 : -5
      ctx.moveTo(x, 0)
      ctx.lineTo(x + d, 0)
      ctx.moveTo(x, h)
      ctx.lineTo(x + d, h)
      ctx.stroke()
    }
    handle(xOf(trim[0]), 'l')
    handle(xOf(trim[1]), 'r')

    // playhead
    if (playing && playStart !== null) {
      const elapsed = (performance.now() - playStart) / 1000
      const pos = trim[0] + elapsed
      if (pos <= trim[1]) {
        ctx.strokeStyle = '#FF2E88'
        ctx.lineWidth = 1
        ctx.shadowColor = '#FF2E88'
        ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.moveTo(xOf(pos), 0)
        ctx.lineTo(xOf(pos), h)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }
  }, [take, trim, zoom, playing, playStart])

  // draw-in animation on open (once)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const anim = () => {
      draw.current = Math.min(1, (performance.now() - t0) / 600)
      render()
      if (draw.current < 1) raf = requestAnimationFrame(anim)
    }
    raf = requestAnimationFrame(anim)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take])

  // live redraw (playhead / trim)
  useTeleFrame(() => render())

  const drag = (e: React.PointerEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    const dur = take.durationSec || 0.0001
    const secOf = (clientX: number) => Math.min(dur, Math.max(0, ((clientX - r.left) / r.width) * dur))
    const startSec = secOf(e.clientX)
    // magnetic zero-crossing snap (±8px)
    const ch = take.channels[0]
    const snap = (sec: number) => {
      if (!ch || ch.length === 0) return sec
      const sr = take.sampleRate || 48000
      const center = Math.floor(sec * sr)
      const range = Math.floor((8 / r.width) * dur * sr)
      for (let d = 0; d < range; d++) {
        const i = center + d
        if (i > 0 && i < ch.length && ch[i - 1] <= 0 && ch[i] > 0) return i / sr
        const j = center - d
        if (j > 0 && ch[j - 1] <= 0 && ch[j] > 0) return j / sr
      }
      return sec
    }
    // grab nearest handle (or create drag on closer one)
    const which = Math.abs(startSec - trim[0]) < Math.abs(startSec - trim[1]) ? 0 : 1
    const cur: [number, number] = [...trim]
    const apply = (clientX: number) => {
      const s = snap(secOf(clientX))
      if (which === 0) cur[0] = Math.min(s, cur[1] - 0.05)
      else cur[1] = Math.max(s, cur[0] + 0.05)
      setTrim([Math.max(0, cur[0]), Math.min(dur, cur[1])])
    }
    apply(e.clientX)
    const mv = (ev: PointerEvent) => apply(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-[160px] w-full cursor-ew-resize overflow-hidden rounded-[4px] bg-display shadow-recessed"
      onPointerDown={(e) => {
        e.preventDefault()
        drag(e)
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

export default function RecordModal({
  take, onClose, onReRecord,
}: {
  take: RecordedTake
  onClose: () => void
  onReRecord: () => void
}) {
  const { engine } = useEngine()
  const [name, setName] = useState(take.name)
  const [trim, setTrim] = useState<[number, number]>([0, take.durationSec])
  const [zoom, setZoom] = useState(1)
  const [normalize, setNormalize] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playStart, setPlayStart] = useState<number | null>(null)
  const [rendering, setRendering] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedOnce, setSavedOnce] = useState(false)
  const stopAudition = useRef<(() => void) | null>(null)

  const stopPlay = useCallback(() => {
    stopAudition.current?.()
    stopAudition.current = null
    setPlaying(false)
    setPlayStart(null)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) {
      stopPlay()
      return
    }
    stopAudition.current = engine.audition(take, trim[0], trim[1])
    setPlaying(true)
    setPlayStart(performance.now())
    // auto-stop at trim end
    const ms = Math.max(100, (trim[1] - trim[0]) * 1000)
    window.setTimeout(() => stopPlay(), ms)
  }, [playing, stopPlay, engine, take, trim])

  // spacebar toggles audition
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select')) return
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay])

  useEffect(() => () => stopAudition.current?.(), [])

  const dur = trim[1] - trim[0]
  const sizeBytes = Math.max(0, Math.round(dur * 48000 * 4 * Math.max(1, take.channels.length)))
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1)

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const save = async () => {
    setRendering(true)
    try {
      const res: WavExportResult = await engine.exportWav(take, {
        normalize,
        includeDryStem: false,
        trimStartSec: trim[0],
        trimEndSec: trim[1],
      })
      download(res.wav, `${name}.wav`)
      setSaved(true)
      setSavedOnce(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setRendering(false)
    }
  }

  const discard = () => {
    if (take.durationSec > 10 && !window.confirm(`Discard ${fmtSec(take.durationSec)} of audio?`)) return
    stopPlay()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[720px] max-w-[calc(100vw-32px)] rounded-[6px] border-line-hair bg-panel p-0 sm:max-w-[720px]">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="p-5">
          <div className="mb-3 flex items-baseline justify-between pr-8">
            <DialogTitle className="flex items-baseline gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                aria-label="take name"
                className="w-40 rounded-[2px] border border-transparent bg-transparent font-display text-[20px] font-semibold uppercase text-ink-hi outline-none transition-colors hover:border-line-hair focus:border-line-bright"
              />
              <span className="font-mono text-[10px] text-ink-low">
                {new Date(take.createdAt).toLocaleTimeString()}
              </span>
            </DialogTitle>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'stop audition' : 'play audition'}
              className="flex items-center gap-1.5 rounded-[2px] border border-line-hair px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-hi transition-colors hover:border-line-bright"
            >
              {playing ? <Pause size={11} /> : <Play size={11} />}
              {playing ? 'STOP' : 'PLAY'}
            </button>
          </div>

          <WaveCanvas take={take} trim={trim} setTrim={setTrim} zoom={zoom} playing={playing} playStart={playStart} />

          <div className="mt-2 flex items-center gap-3">
            <span className="micro-label">ZOOM</span>
            <input
              type="range" min={1} max={8} step={0.5} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="waveform zoom"
              className="h-[2px] w-32 cursor-ew-resize appearance-none bg-line-hair accent-[#FF2E88]"
            />
          </div>

          {/* readout chips */}
          <div className="mt-3 flex gap-2">
            {[`DURATION ${fmtSec(dur)}`, 'FORMAT WAV · 48kHz · 32-BIT FLOAT', `SIZE ~${sizeMb} MB`].map((t) => (
              <span key={t} className="rounded-[2px] bg-display px-2.5 py-1.5 font-mono text-[11px] text-ink-hi shadow-recessed">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-6 border-t border-line-hair pt-4">
            <LEDToggle on={normalize} onChange={setNormalize} label="NORMALIZE −1 dBFS" color="var(--accent-cyan)" />
          </div>

          {rendering && (
            <div className="mt-3 h-px w-full overflow-hidden bg-line-hair">
              <motion.div className="h-full w-1/3 bg-cyan" animate={{ x: ['0%', '300%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={discard}
              className="rounded-[2px] px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mid transition-colors hover:text-signal-red">
              ✕ DISCARD
            </button>
            <button type="button" onClick={() => { stopPlay(); onReRecord() }}
              className="rounded-[2px] border border-cyan px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan transition-colors hover:bg-cyan/10">
              RE-RECORD
            </button>
            <button type="button" onClick={() => void save()} disabled={rendering}
              className={`flex items-center gap-2 rounded-[2px] px-5 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                saved ? 'border border-led-green text-led-green' : 'bg-magenta text-abyss hover:opacity-90'
              } disabled:opacity-50`}>
              {saved ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-led-green" style={{ boxShadow: '0 0 6px var(--led-green)' }} />
                  SAVED <Check size={12} />
                </>
              ) : rendering ? (
                'RENDERING…'
              ) : savedOnce ? (
                'SAVE ANOTHER COPY'
              ) : (
                'SAVE .WAV'
              )}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
