# AUDIO_ENGINE.md — How the sound works

Everything lives in `app/src/audio/`. No audio libraries — the engine is
~hand-rolled Web Audio. `contract.ts` defines `EngineState`: the complete,
serializable description of the instrument. The UI never touches AudioNodes
directly; it edits state, and the engine applies it.

## Files

| File | Responsibility |
|---|---|
| `contract.ts` | Types: `EngineState`, osc/filter/env/lfo/mod/fx/sequencer/xy/human/drums shapes, `ModSourceId`, `ModDestId` |
| `defaults.ts` | Factory default state (INIT PATCH). Master level defaults to 0.65 |
| `engine.ts` | The engine: graph construction, voice allocation, transport, pump loop, `setState` |
| `dsp.ts` | DSP primitives incl. `makeReverbIR` (generated impulse response) |
| `voice.ts` | Per-note voice: oscillators → ladder filter → envelope |
| `wavetables.ts` | Wavetable generation for osc A/B morphing |
| `fx.ts` | FX modules: saturator, chorus, delay, reverb, width, compressor |
| `presets.ts` | Factory preset library (named patches) |
| `wav.ts` | WAV encoder for the REC feature |
| `worklet.ts` | AudioWorklet (scope/telemetry tap) |

## Signal flow

```
KEYS / SEQUENCER / MIDI
  → voices (OSC A + OSC B + SUB + NOISE → ladder filter → amp env)
  → MOD MATRIX (15 sources × N destinations)
  → FX RACK (saturator → chorus → delay → reverb → width → compressor,
             user-reorderable by drag)
  → master gain → destination
DRUM BUS (kick/hat/clap one-shots) → drum delay → drum reverb → master gain
```

## Key subsystems

### Voices
Polyphonic; each voice = wavetable osc A + osc B (octave/semi/fine/detune/
unison up to N voices, warp), sub, noise, into a 4-pole ladder filter model
(LP24/LP12/BP/HP) with cutoff/resonance/drive/key-track/env-amount, then a
5-stage envelope (ATK/HOLD/DEC/SUS/REL, LIN/EXP/LOG curves).

### Modulation matrix
Up to 12 routings: source × amount(±) × destination × enable.
Sources: ENV 1–2, LFO 1–3 (rate/sync divisions/waveforms), **HUMAN**
(slow random wander — new target every 1/rate seconds, one-pole glide;
syncable to BPM), velocity, aftertouch, keytrack, XY pad X/Y, follower, macros.
UI: drag a source chip onto any knob to create a routing (`ModTarget`).

### Transport & step sequencer
Sample-accurate scheduler (`transportTickFn`): 16 steps (adjustable length),
per-step gate/pitch/velocity, swing, BPM 30–300. SPACE toggles play with a
short fade (no clicks). ← → cycle presets.

### Drums ("sketch" feature)
Optional kick / hat / clap one-shots with their own 16-step patterns
(kick 0/4/8/12, hat offbeats, clap 4/12), independent LEVEL and ECHO
(dotted-8th delay into a generated reverb). Deliberately a sketch tool:
"what would this patch sound like with a beat under it."

### XY pad + DRIFT
X and Y each map to any of ~21 destinations. **DRIFT** auto-glides the node
to random targets: OFF/SLOW/MED/FAST (6s/3s/1.2s segments), with SYNC to
BPM (8/4/2 beats). HOLD freezes the node on release.

### Preset switching without jumpscares
`engine.setState(state, { preservePerformance: true })` (used by preset
loads and the showcase auto-advance) preserves the user's *performance*
settings — master volume, drums on/off, XY drift — while loading the patch.
A 60 ms master dip (0.25 → 1 over 0.24 s) masks any click when switching
mid-playback. Factory presets are gain-staged/tamed so none start harsh.

### Recording
REC captures the master bus; stop → WAV via the custom encoder, with a
modal to save or re-record.

### Telemetry
A control-rate `pump()` computes mod values; a per-frame callback
(`useTeleFrame`) feeds visualizers (scope/spectrum/ribbon, envelope curve,
filter curve, XY trail, HUMAN wander trace, GR meter, keyboard strip) —
all draw to canvas; none of it touches React state at frame rate.

## Extending the engine — the rules

1. New parameter → add to `EngineState` in `contract.ts` + default in
   `defaults.ts` + apply in `engine.ts` (`applyGroup`) + UI control.
2. Keep React out of the audio path: state → engine, telemetry ← engine.
3. Every continuous control change must be click-free (smoothed gains /
   short ramps, never hard `value =` jumps on audible params).
