/** Preset drawer (S11) — factory + localStorage presets, save/export/import. */
import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Search, Upload, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import WaveformThumb from '@/components/controls/WaveformThumb'
import type { Preset } from '@/audio'
import type { WaveformShape } from '@/components/controls/WaveformThumb'
import { useEngine } from './engine'
import {
  FACTORY, exportPresetJson, loadUserPresets, makeUserPreset, parsePresetJson, saveUserPresets,
} from './presets'

const SHAPES: WaveformShape[] = ['sine', 'saw', 'triangle', 'square', 'pulse', 'noise']
const thumbFor = (id: string): WaveformShape => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SHAPES[h % SHAPES.length]
}

function Row({
  preset, current, onLoad, onDelete, flash,
}: {
  preset: Preset
  current: boolean
  onLoad: () => void
  onDelete?: () => void
  flash: boolean
}) {
  return (
    <motion.button
      type="button"
      layout="position"
      onClick={onLoad}
      animate={flash ? { backgroundColor: ['rgba(255,46,136,0.25)', 'rgba(255,46,136,0)'] } : {}}
      transition={{ duration: 0.3 }}
      className={`group flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left transition-colors hover:bg-raised/60 ${
        current ? 'border-magenta bg-raised/40' : 'border-transparent'
      }`}
    >
      <span className="w-5 font-mono text-[9px] text-ink-low">
        {preset.factory ? String(FACTORY.indexOf(preset) + 1).padStart(2, '0') : '··'}
      </span>
      <span className={`flex-1 font-sans text-[14px] font-semibold ${current ? 'text-ink-hi' : 'text-ink-mid group-hover:text-ink-hi'}`}>
        {preset.name}
      </span>
      <span className="rounded-[2px] border border-line-hair px-1 py-px font-mono text-[8px] uppercase tracking-[0.1em] text-ink-low">
        {preset.tag}
      </span>
      <WaveformThumb shape={thumbFor(preset.id)} width={34} height={16} strokeWidth={1}
        color={current ? 'var(--accent-cyan)' : 'var(--ink-low)'} />
      {onDelete && (
        <span
          role="button"
          aria-label={`delete ${preset.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-ink-low opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
        >
          <X size={12} />
        </span>
      )}
    </motion.button>
  )
}

export default function PresetDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, presetName, loadPreset, markSavedPreset } = useEngine()
  const [query, setQuery] = useState('')
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets())
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [flashId, setFlashId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const factory = useMemo(() => FACTORY.filter((p) => !q || p.name.toLowerCase().includes(q)), [q])
  const mine = useMemo(() => userPresets.filter((p) => !q || p.name.toLowerCase().includes(q)), [userPresets, q])

  const load = (p: Preset) => {
    loadPreset(p)
    setFlashId(p.id)
    window.setTimeout(() => setFlashId(null), 400)
  }

  const saveCurrent = () => {
    const p = makeUserPreset(newName || 'UNTITLED', state)
    const list = [...userPresets, p]
    setUserPresets(list)
    saveUserPresets(list)
    markSavedPreset(p)
    setSaving(false)
    setNewName('')
  }

  const deleteUser = (id: string) => {
    const list = userPresets.filter((p) => p.id !== id)
    setUserPresets(list)
    saveUserPresets(list)
  }

  const exportAll = () => {
    const current = [...FACTORY, ...userPresets].find((p) => p.name === presetName)
    exportPresetJson(current ?? makeUserPreset(presetName, state))
  }

  const importFile = async (file: File) => {
    const p = parsePresetJson(await file.text())
    if (!p) {
      window.alert('Not a valid HELL.SYNTH preset file.')
      return
    }
    const list = [...userPresets, p]
    setUserPresets(list)
    saveUserPresets(list)
    load(p)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right"
        className="top-14 flex h-[calc(100%-3.5rem)] w-[400px] max-w-full flex-col border-l border-line-hair bg-raised p-0 sm:max-w-[400px]">
        <div className="flex items-center gap-2 border-b border-line-hair px-4 py-3 pr-10">
          <SheetTitle className="font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-ink-hi">
            PRESETS
          </SheetTitle>
          <div className="ml-auto flex items-center gap-1.5 rounded-[2px] bg-display px-2 py-1 shadow-recessed">
            <Search size={11} className="text-ink-low" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH…"
              aria-label="search presets"
              className="w-28 bg-transparent font-mono text-[10px] uppercase tracking-[0.1em] text-ink-hi outline-none placeholder:text-ink-low"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-1 pt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-low">FACTORY</div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            {factory.map((p) => (
              <motion.div key={p.id} variants={{ hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0 } }}>
                <Row preset={p} current={presetName === p.name} flash={flashId === p.id} onLoad={() => load(p)} />
              </motion.div>
            ))}
          </motion.div>

          <div className="px-4 pb-1 pt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-low">MY PRESETS</div>
          {mine.length === 0 ? (
            <div className="px-4 py-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ink-low">
              NOTHING SAVED YET.
              <br />
              TWIST KNOBS, THEN ↓
            </div>
          ) : (
            mine.map((p) => (
              <Row key={p.id} preset={p} current={presetName === p.name} flash={flashId === p.id}
                onLoad={() => load(p)} onDelete={() => deleteUser(p.id)} />
            ))
          )}
        </div>

        <div className="border-t border-line-hair p-3">
          {saving ? (
            <div className="mb-2 flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCurrent()
                  if (e.key === 'Escape') setSaving(false)
                }}
                placeholder="NAME…"
                aria-label="new preset name"
                maxLength={24}
                className="flex-1 rounded-[2px] border border-line-bright bg-display px-2 py-1.5 font-mono text-[11px] uppercase text-ink-hi outline-none placeholder:text-ink-low"
              />
              <button type="button" onClick={saveCurrent}
                className="rounded-[2px] bg-magenta px-3 py-1.5 font-mono text-[10px] uppercase text-abyss">
                SAVE
              </button>
              <button type="button" onClick={() => setSaving(false)}
                className="font-mono text-[10px] uppercase text-ink-low hover:text-ink-mid">
                CANCEL
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setSaving(true)}
              className="mb-2 w-full rounded-[2px] border border-magenta px-3 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-magenta transition-colors hover:bg-magenta/10">
              SAVE CURRENT AS PRESET
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={exportAll}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-line-hair px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mid transition-colors hover:border-line-bright hover:text-ink-hi">
              <Download size={11} /> EXPORT .JSON
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-line-hair px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mid transition-colors hover:border-line-bright hover:text-ink-hi">
              <Upload size={11} /> IMPORT
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importFile(f)
                e.target.value = ''
              }} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
