# HELLA.SYNTH — Deployment Handoff Package

**HELLA.SYNTH** is a browser-native synthesizer: a dark, hardware-style instrument
UI (React + Tailwind) driving a fully custom Web Audio engine (no audio
libraries — every oscillator, filter, envelope, LFO, effect, and the step
sequencer are hand-written DSP). It ships with a marketing/landing page, a
guide page, and the instrument itself.

This package is built for an automated agent (e.g. OpenAI Codex) to deploy
without guesswork. Read this file, then `docs/DEPLOYMENT.md`.

---

## Package map

```
HELL-SYNTH/
├── README.md                ← you are here
├── docs/
│   ├── DEPLOYMENT.md        ← step-by-step deploy runbook (Vercel / Netlify / Docker / any static host)
│   ├── TECHNOLOGY.md        ← every technology used, with versions and rationale
│   ├── AUDIO_ENGINE.md      ← how the sound engine works (graph, DSP, sequencer, drums, mod matrix)
│   ├── DESIGN_GUIDE.md      ← design system: tokens, colors, typography, components, motion rules
│   └── HANDOFF_NOTES.md     ← quirks, gotchas, incident postmortems, rollback history
└── app/                     ← the project
    ├── src/                 ← all source (React 19 + TypeScript)
    ├── public/              ← static assets (images, logo, demo media)
    ├── dist/                ← PREBUILT production bundle — deployable as-is
    ├── index.html
    ├── package.json / package-lock.json
    ├── vite.config.ts / tailwind.config.js / postcss.config.js / tsconfig*.json
    ├── vercel.json          ← Vercel deploy config
    ├── netlify.toml         ← Netlify deploy config
    ├── Dockerfile           ← container deploy (nginx)
    └── nginx.conf           ← nginx site config used by the Dockerfile
```

## Facts a deployer must know

- **It's a fully static site.** No backend, no database, no secrets, no env
  vars, no API keys. If a platform asks for a server, something is wrong.
- **Build:** `npm ci && npm run build` → output in `dist/`. Node 20.
- **Or skip the build:** `app/dist/` is already the exact production bundle.
  Serve it with any static file server and you're done.
- **Routing uses a HashRouter.** URLs look like `/#/instrument`. That means
  **no SPA rewrite rules are needed** on any host — deep links just work.
- **Asset paths are relative** (`base: './'` in `vite.config.ts`), so the app
  works from any subpath or nested folder, not only the domain root.
- **Audio requires one user gesture** (browser autoplay policy). The engine
  boots silently on page load and resumes on the first click/keypress. This
  is normal and handled in the app.
- **The instrument is desktop-only by design.** Viewports under 1024px wide
  see a polite "come back on a laptop" gate (`src/pages/Instrument.tsx`).

## 60-second deploy (fastest path)

```bash
cd app
npx serve dist        # or: python3 -m http.server -d dist 8080
```

Open the printed URL → click into `#/instrument` → press SPACE.

## Verify a deployment is correct

1. Landing page loads at `/` (dark page, HELLA.SYNTH wordmark).
2. Instrument loads at `/#/instrument` — knob panels, step sequencer,
   keyboard strip at the bottom.
3. Press **SPACE** — the sequencer runs; preset name arrows `‹ ›` switch sounds.
4. Resize the window aggressively — layout must stay stable (see
   `docs/HANDOFF_NOTES.md` for why this is called out).
