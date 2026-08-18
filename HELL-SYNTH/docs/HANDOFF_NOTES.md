# HANDOFF_NOTES.md — Quirks, gotchas, incident history

Read this before modifying anything. These are the things that bit us.

## The Melt (postmortem — the one bug you must not reintroduce)

**Symptom:** on window resize, containers grew vertically without bound
(16,000px+ observed) and deflated only slowly — "the UI is melting."

**Root cause:** `FilterPanel`'s response-curve `<canvas>` was in normal
flow with CSS `height: 100%`. Each animation frame the code set
`canvas.width/height` (backing store) from the measured box. A canvas's
backing-store size is also its *intrinsic* size, so the intrinsic size fed
the container's height, which changed the measured box — a layout feedback
loop (one-way ratchet), pumped by every resize event.

**Fix (shipped):** canvas is `absolute inset-0 h-full w-full` (out of
flow); the container keeps `min-h-[96px] flex-1 self-stretch`. Rule:
**any canvas inside a flexible/auto-height container must be absolutely
positioned.** The XY pad trail canvas already followed this rule and never
melted.

**Regression test:** drag the window width across 1500→900→1600px
repeatedly with the transport playing; grid height must stay ≈ constant
(≈1,270–1,290px at 1493×940). We ran this with Playwright:

```js
// core probe — evaluate on #/instrument
document.querySelector('main .grid').getBoundingClientRect().height
// sample during/after viewport changes; must be stable, not growing
```

## Container motion (user requirement)

The user explicitly rejected mount choreography ("why are containers
scaling... at all"). The instrument must render statically: no boot
stagger, no TopBar slide-in. If you add entrance animation, expect it to
be rejected. Overlays the user summons (drawers, modals) may animate.

## Scrollbar stability

`main` uses `scrollbar-gutter: stable`. Removing it reintroduces layout
shifts when content crosses the overflow boundary (the aspect-square XY
pad height depends on column width, which depends on scrollbar presence —
another potential feedback loop).

## Audio autoplay

Browsers gate `AudioContext` behind a user gesture. The engine boots
suspended and resumes on first `pointerdown`/`keydown`
(`Instrument.tsx`). "No sound until I clicked" is expected behavior, not
a bug.

## Routing

HashRouter on purpose: the app survives static hosting with zero rewrite
rules. Correct instrument URL: `/#/instrument` (not `/#/app`).

Static assets must use relative URLs such as `./logo.svg`. Root-absolute
paths break when the prebuilt app is served below a host path such as
`/hell-synth-app/`; this package was corrected during hella.rich preview QA.

## Feature state of this package

This snapshot = the user's approved production state:

- ✅ XY pad DRIFT (auto-glide: off/slow/med/fast + BPM sync)
- ✅ HUMAN modulation source (random-wander, rate + sync, own tab + trace)
- ✅ Sketch drums (kick/hat/clap + level/echo bus)
- ✅ Tamed factory presets + click-free preset switching that preserves
  master volume / drums / drift settings
- ✅ Master volume defaults to 65%
- ✅ Melt fix + static interface + scrollbar stability
- ❌ Sequencer pattern library (10 patterns + dice) — built, then removed
  at user request. If asked to restore: it lived in
  `src/audio/seqPatterns.ts` + a PATTERNS row in `StepSequencer.tsx`
  (git tag `05a436a` in the original repo).

## Version history (original repo)

| ID | State |
|---|---|
| `f87d41c` | this package (pre-patterns + melt fix) |
| `2601b9d` | patterns + static interface + overflow fixes |
| `05a436a` | patterns library added |
| `1af851c` | phase 4 final (drift/HUMAN/drums/preservation) |
| `f32f6d8` | pre-phase-4 rollback point |

## Development workflow that produced this

Built with the Kimi agent stack: Vite/React/Tailwind scaffold, custom
Web Audio engine, Playwright-driven geometry regression probes (the
technique above), and cloudflared tunnels for live user previews. No
backend was ever involved.

## Known cosmetic notes (non-blocking)

- `vite build` chunk-size warnings (>500 kB) — Three.js on the landing
  page. Consider `React.lazy` for the landing if you care.
- `plugin-inspect-react-code` adds `code-path` attributes to DOM nodes.
  Dev aid; remove from `vite.config.ts` plugins if unwanted.
- At 1024–1280px (compact), FX/XY live in a drawer (header button).

## Release-readiness notes

- The received lockfile used 26 package tarball URLs on the unavailable
  `npm.mirrors.msh.team` host. They were changed to the standard npm registry;
  `npm ci`, TypeScript, and the Vite production build then passed.
- The 2026-08-18 dependency audit reported 12 build-tool advisories and one
  production-tree advisory through `recharts → lodash`. Recharts is only
  imported by the unused shadcn chart component and is tree-shaken from the
  current JavaScript bundle, but the dependency set should be pruned or updated
  before production publication.
- The optional Docker image uses a floating `nginx:alpine` tag and the default
  root nginx user. Pin and harden the image before using the container path in
  production; this does not affect the static hella.rich preview.
