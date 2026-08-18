# TECHNOLOGY.md — Full stack inventory

## Core

| Layer | Technology | Version | Used for |
|---|---|---|---|
| Language | TypeScript | ~5.9.3 | all source |
| UI library | React | 19.2 | all UI |
| Bundler | Vite | 7.3.0 | dev server + production build (`base: './'`) |
| Router | react-router (HashRouter) | 7.6.1 | routes: `/#/` landing, `/#/instrument`, `/#/guide` |
| Styling | Tailwind CSS | 3.4.19 | all styling; design tokens as CSS custom properties |
| Component primitives | shadcn/ui over Radix UI | (see package.json) | drawer, tooltip, dialog, select primitives |
| Icons | lucide-react | 0.562 | all icons |
| Node | Node.js | 20 | build toolchain only (no server code) |

## Motion & visual effects

| Library | Where | Purpose |
|---|---|---|
| framer-motion 12 | instrument + guide | mount choreography, drawer slide, preset-name roll, matrix row add/remove |
| GSAP 3.15 + @gsap/react | landing page only | scroll-triggered hero/section animation |
| lenis | landing page only | smooth scrolling |
| three + @react-three/fiber | landing page only | `WireformCanvas` 3D wireform visual |

## Audio — zero libraries

The entire sound engine is hand-written Web Audio API + custom DSP
(`app/src/audio/`). No Tone.js, no external synth/DSP dependency.
See `docs/AUDIO_ENGINE.md` for the architecture.

- `AudioContext` graph built in `engine.ts`
- Custom wavetable oscillators (`wavetables.ts`), ladder-filter model,
  envelopes, LFOs, follower — all in `dsp.ts` / `voice.ts`
- FX (saturator, chorus, delay, reverb, width, compressor) in `fx.ts`
  with a generated impulse response for the reverb (`makeReverbIR`)
- Recording to WAV via a custom encoder (`wav.ts`)
- Typing at the boundary in `contract.ts` (`EngineState` is the single
  source of truth for every parameter)

## Testing / verification tooling used during development

- Playwright (Chromium + WebKit) for geometry/layout regression probes —
  not shipped in the repo; see `docs/HANDOFF_NOTES.md` for the technique.

## Notable config details

- `vite.config.ts` sets `base: './'` → relative asset URLs → deployable
  under any subpath.
- `vite.config.ts` includes `plugin-inspect-react-code` (dev-time
  `code-path` DOM attributes). Harmless in production; safe to remove from
  `plugins` if you want cleaner DOM output.
- `tailwind.config.js` mirrors every design token from `src/index.css`
  into Tailwind color names — change a token in **one** place
  (`src/index.css` `:root`) and the whole app follows.
- TypeScript strict build: `npm run build` runs `tsc -b` first — a build
  with type errors fails loudly.

## Bundle size note

`vite build` warns that chunks exceed 500 kB (Three.js on the landing
page is the main contributor). This is a warning, not an error. If you
want to slim it: lazy-load `WireformCanvas` / the landing page via
`React.lazy` so the instrument loads without Three.js.
