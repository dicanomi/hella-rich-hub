# HELL.SYNTH

Browser-native synthesizer. React 19 + TypeScript + Vite + Tailwind UI
driving a fully hand-written Web Audio engine (no audio libraries).

## Commands

```bash
npm ci          # install (Node 20)
npm run dev     # dev server on :3000
npm run build   # type-check + production build → dist/
npm run preview # serve the build locally
```

## Routes

- `/#/` — landing page
- `/#/instrument` — the synth (desktop, ≥1024px)
- `/#/guide` — guide / control reference

## Documentation

See `../docs/`: DEPLOYMENT (deploy runbook), TECHNOLOGY (stack),
AUDIO_ENGINE (sound architecture), DESIGN_GUIDE (design system),
HANDOFF_NOTES (quirks + postmortems — read before editing).

`dist/` is a ready-to-serve production build of this exact source.
