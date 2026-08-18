/** Modulation panel — ENV / LFO tabs + 12-row routing MATRIX. */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import ModuleSection from '@/components/controls/ModuleSection'
import LEDToggle from '@/components/controls/LEDToggle'
import type { ModDestId, ModSourceId } from '@/audio'
import { useEngine } from './engine'
import { BipolarSlider, DarkSelect } from './bits'
import { MOD_DESTS, MOD_DEST_LABELS, MOD_SOURCE_META, MOD_SOURCES, SourceChip } from './modMeta'
import EnvEditor from './EnvEditor'
import LfoTab from './LfoTab'
import HumanTab from './HumanTab'

type Tab = 'env1' | 'env2' | 'lfo1' | 'lfo2' | 'lfo3' | 'human' | 'matrix'
const TAB_ORDER: Tab[] = ['env1', 'env2', 'lfo1', 'lfo2', 'lfo3', 'human', 'matrix']
const TAB_SOURCE: Partial<Record<Tab, ModSourceId>> = {
  env1: 'env1', env2: 'env2', lfo1: 'lfo1', lfo2: 'lfo2', lfo3: 'lfo3', human: 'human',
}

function Matrix() {
  const { state, addRoute, updateRoute, removeRoute } = useEngine()
  return (
    <div>
      <div className="mb-1 grid grid-cols-[16px_110px_1fr_150px_40px_20px] items-center gap-3 px-1">
        {['#', 'SOURCE', 'AMOUNT', 'DESTINATION', '', ''].map((h, i) => (
          <span key={i} className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink-low">{h}</span>
        ))}
      </div>
      <div className="flex max-h-[248px] flex-col gap-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {state.matrix.map((r, i) => {
            const meta = MOD_SOURCE_META[r.source]
            return (
              <motion.div
                key={r.id}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className={`grid grid-cols-[16px_110px_1fr_150px_40px_20px] items-center gap-3 overflow-hidden rounded-[2px] border px-1 py-1 ${
                  r.enabled ? 'border-line-hair bg-display/60' : 'border-line-hair/50 opacity-50'
                }`}
              >
                <span className="text-center font-mono text-[9px] text-ink-low">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex items-center gap-1">
                  <SourceChip source={r.source} small />
                  <select
                    aria-label="change source"
                    value={r.source}
                    onChange={(e) => updateRoute(r.id, { source: e.target.value as ModSourceId })}
                    className="w-[14px] cursor-pointer appearance-none border-none bg-transparent font-mono text-[8px] text-ink-low outline-none"
                  >
                    {MOD_SOURCES.map((s) => (
                      <option key={s} value={s} className="bg-raised">▾ {MOD_SOURCE_META[s].label}</option>
                    ))}
                  </select>
                </div>
                <BipolarSlider value={r.amount} color={meta.color}
                  onChange={(v) => updateRoute(r.id, { amount: Math.round(v * 100) / 100 })} />
                <DarkSelect<ModDestId>
                  ariaLabel="destination"
                  value={r.dest}
                  options={MOD_DESTS}
                  labelFn={(d) => MOD_DEST_LABELS[d]}
                  onChange={(d) => updateRoute(r.id, { dest: d })}
                  className="w-full"
                />
                <LEDToggle on={r.enabled} onChange={(on) => updateRoute(r.id, { enabled: on })}
                  color={meta.color} />
                <button type="button" aria-label="delete routing" onClick={() => removeRoute(r.id)}
                  className="text-ink-low transition-colors hover:text-signal-red">
                  <X size={12} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {state.matrix.length === 0 && (
          <div className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-low">
            NO ROUTINGS — DRAG A SOURCE CHIP ONTO ANY KNOB
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={state.matrix.length >= 12}
        onClick={() => addRoute('env1', 'cutoff', 0.25)}
        className="mt-2 flex items-center gap-1.5 rounded-[2px] border border-dashed border-cyan-dim px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan transition-colors hover:border-cyan hover:bg-cyan/5 disabled:opacity-30"
      >
        <Plus size={11} /> ADD ROUTING {state.matrix.length > 0 && `(${state.matrix.length}/12)`}
      </button>
    </div>
  )
}

export default function ModPanel() {
  const [tab, setTab] = useState<Tab>('env1')
  return (
    <ModuleSection
      title="MODULATION"
      headerRight={
        <div className="flex items-end gap-1" role="tablist">
          {TAB_ORDER.map((t) => {
            const src = TAB_SOURCE[t]
            const meta = src ? MOD_SOURCE_META[src] : null
            const active = tab === t
            return (
              <button key={t} type="button" role="tab" aria-selected={active} onClick={() => setTab(t)}
                className={`flex items-center gap-1 border-t-2 px-2 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active ? 'text-ink-hi' : 'text-ink-mid hover:text-ink-hi'
                }`}
                style={{ borderTopColor: active ? (meta?.color ?? 'var(--accent-cyan)') : 'transparent' }}
              >
                {meta && (
                  <span draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-voxform-mod-source', src!)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    title={`Drag ${meta.label} onto any knob to route`}
                    className="h-1.5 w-1.5 cursor-grab rounded-full active:cursor-grabbing"
                    style={{ backgroundColor: meta.color, boxShadow: `0 0 4px ${meta.color}` }}
                  />
                )}
                {t === 'matrix' ? 'MATRIX' : meta?.label}
              </button>
            )
          })}
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'env1' && <EnvEditor group="env1" color="var(--env-1)" />}
          {tab === 'env2' && <EnvEditor group="env2" color="var(--env-2)" />}
          {tab === 'lfo1' && <LfoTab group="lfo1" source="lfo1" />}
          {tab === 'lfo2' && <LfoTab group="lfo2" source="lfo2" />}
          {tab === 'lfo3' && <LfoTab group="lfo3" source="lfo3" />}
          {tab === 'human' && <HumanTab />}
          {tab === 'matrix' && <Matrix />}
        </motion.div>
      </AnimatePresence>
    </ModuleSection>
  )
}
