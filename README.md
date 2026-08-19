# HELLA.RICH — hella-rich-hub

The single source of truth for **hella.rich** and all its products. One repo, one app, one deploy.

## Source of truth & deploy flow

```
Edit  →  commit to GitHub (main)  →  Cloudflare Pages builds & deploys  →  hella.rich updates
```

- **GitHub** (`dicanomi/hella-rich-hub`, branch `main`) is canonical. Nothing is authored on the live server.
- **Cloudflare Pages** is connected to this repo via Git integration and auto-deploys every push to `main`.
- Non-`main` branches get their own Cloudflare **preview URL** — use a branch for anything risky, confirm the preview, then merge to `main` for production.

## Stack

- Vite + React 19 + TypeScript
- Routing: wouter (single `client/src/App.tsx`)
- Styling: Tailwind CSS v4 (tokens in `client/src/index.css`)
- Motion: framer-motion · Audio: Tone.js + Web Audio
- Package manager: pnpm

## Cloudflare Pages build settings

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `pnpm install && pnpm exec vite build --config vite.config.cloudflare.ts` |
| Build output directory | `dist/public` |
| SPA routing | `client/public/_redirects` |

`vite.config.cloudflare.ts` is the production build config (clean, no dev/runtime plugins; per-product code-splitting).

## Products (all internal routes, one app)

| Route | Page source |
| --- | --- |
| `/` | `client/src/pages/Landing.tsx` (homepage) |
| `/the-eye` | `TheEyePage.tsx` |
| `/low-battery` | `LowBatteryPage.tsx` |
| `/space-drone` | `SpaceDronePage.tsx` |
| `/aether` | `AetherPage.tsx` |
| `/orb` | `OrbPage.tsx` |
| `/dead-air` | `DeadAirPage.tsx` |
| `/fourcast` | `FourcastPage.tsx` |
| `/radio` | `RadioPage.tsx` (HELLA_RADIO — canonical home; served in-app) |
| `/hella.fm` | `HellaFmPage.tsx` (curated station simulator prototype; served in-app) |
| `/hella.synth` | `HellaSynthPage.tsx` (browser-native synth instrument; served in-app from `client/public/hella-synth-app`) |

Routes are registered in `client/src/App.tsx`. Heavy products are lazy-loaded.

## Repo layout

```
client/
  index.html
  public/        # static assets served at site root (_redirects, og images, radio app, fonts)
  src/
    pages/       # one file per product + Landing + NotFound
    components/  # shared UI, per-product components, HellaRichNav, modals
    hooks/  lib/  contexts/
    App.tsx  main.tsx  index.css
vite.config.cloudflare.ts   # production build config (Cloudflare Pages)
```

## Publishing runbook

Use this sequence for every production update, regardless of tool or model:

1. **Confirm scope.** Start on `main` and inspect `git status --short --branch` plus the full diff. Preserve unrelated work; never reset or overwrite changes outside the request.
2. **Validate locally.** Run the smallest relevant checks and review the affected local route. For deployment-impacting changes, run `pnpm exec vite build --config vite.config.cloudflare.ts`, which matches the Cloudflare build config without reinstalling dependencies.
3. **Commit only the approved change.** Run `git diff --check`, stage explicit paths, review the staged diff, and create one clear commit. Do not include incidental lockfile or generated-file changes.
4. **Publish through GitHub.** Push the commit to `origin/main`. If shell credentials are unavailable, use an already authenticated GitHub client rather than asking the user to repeat the work manually.
5. **Wait for Cloudflare Pages.** A push to `main` automatically starts the production build. Do not run a separate direct Cloudflare deployment unless the Git integration is intentionally being bypassed.
6. **Verify production.** Confirm GitHub `main` contains the commit, then test the affected `https://hella.rich/<route>` with a cache-busting query. Check the changed behavior, direct load, and refresh; do not treat a successful push as proof of a successful deployment.
7. **Close cleanly.** Confirm local `main` matches `origin/main`, the worktree is clean, and add a short factual entry to `HANDOFF.md` with the commit, live route, verification result, and any blocker.

For risky work, use a non-`main` branch and its Cloudflare preview first. Keep commits small and preserve existing design, copy, routing, audio, animation, navigation, and responsive behavior.

## Related infrastructure

- **`hella-presence`** Cloudflare Worker — counts concurrent visitors on `/radio` (the listener indicator). Free tier, in-memory.
