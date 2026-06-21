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

## Editing workflow (via Claude)

1. Claude edits source files and commits to `main` (or a preview branch for big changes).
2. Cloudflare Pages rebuilds automatically.
3. Changes appear on hella.rich within a couple of minutes.

Small, explained commits. Preserve existing design, copy, routing, audio, animation, navigation, and responsive behavior. Never overwrite the whole project.

## Related infrastructure

- **`hella-presence`** Cloudflare Worker — counts concurrent visitors on `/radio` (the listener indicator). Free tier, in-memory.
