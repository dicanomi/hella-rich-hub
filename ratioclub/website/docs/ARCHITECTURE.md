# Architecture and stack

## Public website

| Area | Implementation |
|---|---|
| UI | React 19.3.1, React DOM 19.3.1, TypeScript 7 |
| Build | Vite 8 (exact dependency versions locked in package-lock.json), React Vite plugin |
| Styling | Ordinary CSS with shared custom properties; no Tailwind or UI framework dependency |
| Motion | GSAP 3, @gsap/react, ScrollTrigger and small native browser animations |
| 3D shapes | Procedural projected wireframe SVGs; no canvas/WebGL service or remote asset call |
| Quality | Oxlint, TypeScript, Playwright Chromium/WebKit, axe checks in selected specs |
| Runtime navigation | Custom same-origin SPA router using History API; no server routing dependency |
| Deployment artifact | `dist/`: static HTML, JS, CSS, fonts, SVG/image/video assets |
| Runtime services | None required. No mail, analytics, advertising or CMS API is connected |

`src/main.tsx` installs first-click navigation. `src/App.tsx` resolves client routes. `scripts/prerender.mjs` renders route HTML **at build time only**; it is not server-side rendering at request time. Node is needed to build, not to serve the public website.

Routes: `/`, `/solutions`, `/about`, `/contact`, `/privacy-notice`, `/terms-and-conditions`. Unknown client routes use the 404 view. `/contact` is retained but ordinary Contact entry points open an overlay rather than navigating there.

## Optional editor — a separate architecture

Payload 3.94.1 + Next.js 16 + local SQLite + Sharp. This is a server application restricted to loopback `127.0.0.1:5197`, not something S3 can execute. It is excluded from the public build, dependency install, CI and deploy paths. No editor account, DB or local secret is delivered.

The editor writes a static media snapshot and local copies of selected assets. The frontend uses original source assets whenever that snapshot is empty, invalid or a slot is unset. There are no browser CMS fetches, webhooks or publishing integrations.

## Build environment

Node requirement in package.json is >=22.18.0 and <23; `.nvmrc` pins Node 22.23.5; see QA.md for the actual environment used for this revision. Keep npm and lockfiles consistent. Runtime dependency and development dependency versions are exact in the lockfile; install with `npm ci`, not a floating reinstall.

The handoff changes only the default build command/configuration to use the release mode expected by the client pipeline. App content and interactions remain the approved implementation. `build:local` retains local review behavior when needed.
