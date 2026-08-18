# HANDOFF.md

Running log of session-to-session, tool-to-tool state. Every agent — Claude,
Codex, Manus, whatever's next — reads the top entry at the start of a session
and appends a new entry before ending one. Newest entry on top. Never delete
older entries; this is the memory none of these tools share natively.

Keep entries short and factual. This file is context, not a diary.
Use the canonical [publishing runbook](README.md#publishing-runbook) instead of
repeating deployment instructions in each entry.

---

## 2026-08-18 11:20 — Codex — HELLA.FM local station prototype added

**Did:**
- Added the local HELLA.FM station simulator as a self-contained static app under `client/public/hella.fm`.
- Added a React wrapper route at `/hella.fm` and registered it in the hub router, redirects, global product nav, homepage product surfaces, and README.
- Included the prototype-bundled HELLA.RICH PSA MP3s, Doto LCD font, tuner asset, and the current Science Beats sample media.
- Ran the Cloudflare production build successfully with Codex's bundled Node runtime.

**Current state:**
- `/radio` remains unchanged.
- `/hella.fm` is ready to publish through the normal GitHub `main` to Cloudflare Pages flow after push.
- Browser-only uploaded folders are not repo assets; permanent station media should be copied from real folders or moved to Cloudflare-hosted audio later.

**Next steps:**
- [ ] Push the commit to GitHub `main` when ready.
- [ ] Verify `https://hella.rich/hella.fm` after Cloudflare Pages deploys.

**Decisions / rationale:**
- Kept HELLA.FM separate from the existing canonical `/radio` product so the local-folder station prototype can evolve without disturbing production radio.

**Watch out for:**
- The committed static app uses `/hella.fm/` asset paths; if the route changes, rebuild the prototype with the matching Vite base.

**Credentials/access needed (pointers only, never actual secrets):**
- Use authenticated GitHub Desktop or shell Git credentials to push if Codex shell credentials are unavailable.

---

## 2026-07-24 17:38 — Codex — Shared publishing runbook added

**Did:**
- Replaced the model-specific README workflow with a concise, tool-neutral publishing runbook.
- Linked this handoff log to the canonical runbook.
- Checked the instructions against the current Cloudflare build config, GitHub `main` integration, and live-route verification flow.

**Current state:**
- Documentation only; no application source or production behavior changed.

**Next steps:**
- [x] Commit and push the documentation update to GitHub `main`.

**Decisions / rationale:**
- README owns the reusable workflow; HANDOFF remains a short chronological log.

**Watch out for:**
- Pushing `main` starts Cloudflare Pages automatically, but this documentation is not part of the served application.

**Credentials/access needed (pointers only, never actual secrets):**
- Use an authenticated GitHub client if shell Git credentials are unavailable.

---

## 2026-07-24 10:19 — Codex — Safari radio tray fallback ready for production

**Did:**
- Added Safari-only browser detection to the redesigned Radio app.
- Hid the nonfunctional waveform and EQ visualization in Safari while preserving the centered transport and volume controls.
- Kept the full audio visualization visible in Chrome, Firefox, and other supported browsers.
- Ran the production build and verified both Safari and Chrome layouts with browser-level checks.

**Current state:**
- The Safari fallback is committed to GitHub `main`.
- Cloudflare Pages serves the updated Radio app at `https://hella.rich/radio`.
- Local review URL: `http://127.0.0.1:3000/radio`.

**Next steps:**
- [x] Push the Safari fallback to GitHub `main`.
- [x] Verify Cloudflare Pages serves the updated Radio app.

**Decisions / rationale:**
- Safari retains audio playback and all controls; only the unsupported decorative analyzer display is removed.
- Tablet and mobile continue using the existing simplified tray.

**Watch out for:**
- Safari detection excludes Chromium, Chrome iOS, Edge, Opera, and Firefox iOS user agents.

**Credentials/access needed (pointers only, never actual secrets):**
- Use the authenticated GitHub Desktop push route if shell Git credentials are unavailable.

---

## 2026-07-23 13:02 — Codex — Happy Human wrapper color and overlay top spacing aligned

**Did:**
- Matched the Happy Human navigation wrapper and iframe fallback to the app background color `#0d0d0d`.
- Aligned the alert, human-check, retraining, and complaint overlay top edges with the main embedded screen.
- Ran the production build and verified the live route before and after refresh.

**Current state:**
- The update is live on GitHub `main` in commit `9dd9b13`.
- Cloudflare Pages serves matching wrapper, iframe, and app backgrounds at `https://hella.rich/happy-human/`.
- All four overlay screens compute to the same top edge as the main screen in hub mode.

**Next steps:**
- [x] Push the Happy Human framing update to GitHub `main`.
- [x] Verify colors, overlay positions, and refresh behavior on Cloudflare Pages.

**Decisions / rationale:**
- Hub-embedded overlays remove only the top inset; side and bottom spacing remain unchanged.
- Standalone Happy Human keeps its original symmetric page inset.

**Watch out for:**
- The direct `/happy-human/` route can resolve through the static refresh fallback, so both wrapper implementations must remain visually synchronized.

**Credentials/access needed (pointers only, never actual secrets):**
- Use the authenticated GitHub Desktop push route if shell Git credentials are unavailable.

---

## 2026-07-23 12:23 — Codex — Homepage product views renamed and Grid made default

**Did:**
- Renamed the homepage product display controls to Grid, Stacked, and List.
- Made the former Featured grid the default homepage display.
- Migrated the saved browser preference key so old selections do not override the new default.
- Ran the production build and verified the live homepage in a clean browser session.

**Current state:**
- The update is live on GitHub `main` in commit `1f32adc`.
- Cloudflare Pages is serving Grid as the default at `https://hella.rich/`.
- Local review URL: `http://127.0.0.1:3000/`.

**Next steps:**
- [x] Push the homepage view update to GitHub `main`.
- [x] Verify the new default and labels on Cloudflare Pages.

**Decisions / rationale:**
- Featured maps to Grid, Gallery maps to Stacked, and Archive maps to List.
- The controls are ordered Grid, Stacked, List to match their visual density.

**Watch out for:**
- New view selections persist under `hella_view_v2`; the old `hella_view` value is intentionally ignored.

**Credentials/access needed (pointers only, never actual secrets):**
- Use the authenticated GitHub Desktop push route if shell Git credentials are unavailable.

---

## Template for a new entry (copy this block, fill it in, paste above the rest)

### [YYYY-MM-DD HH:MM] — [Tool/model name] — [one-line summary]

**Did:**
- [what actually got done this session, concretely]

**Current state:**
- [what's true right now — what's live, what's broken, what's half-done]

**Next steps:**
- [ ] [the next concrete thing to do]
- [ ] [ ]

**Decisions / rationale:**
- [any choice made that a future agent would otherwise redo or second-guess]

**Watch out for:**
- [gotchas, flaky things, anything that looks fine but isn't]

**Credentials/access needed (pointers only, never actual secrets):**
- [e.g. "needs CLOUDFLARE_API_TOKEN in env, see 1Password" — not the token]

---

## 2026-07-23 12:08 — Codex — Happy Human timing, audio, and landing effects ready for production

**Did:**
- Accelerated and synchronized the job-card, REPLACED stamp, progress line, and morphing sculpture transitions.
- Ensured the initial job displays the REPLACED stamp before the first transition.
- Added optional corrupted-assistant voice fragments, a visible volume slider when sound is on, and an overriding FEAR alert voice with a smooth transition bed.
- Made the SOUND label uppercase and added the red/cyan anaglyph effect to the landing HAPPY HUMAN logo.
- Ran the Cloudflare production build successfully.

**Current state:**
- Happy Human changes are live on GitHub `main` in commit `174d31d`.
- Cloudflare Pages is serving the updated app at `https://hella.rich/happy-human/`.
- Local review URL: `http://127.0.0.1:3000/happy-human/`.

**Next steps:**
- [x] Push the production commit to GitHub `main`.
- [x] Verify Cloudflare Pages serves the new commit at `https://hella.rich/happy-human/`.

**Decisions / rationale:**
- Alert speech cancels the ambient assistant voice so FEAR ALERT always takes priority.
- The volume control appears only while sound is enabled.
- The landing logo uses the same crimson/cyan channel colors as the morphing sculpture.

**Watch out for:**
- Browser speech voices vary by operating system; volume, rate, and pitch are intentionally normalized in the page.
- Cloudflare Pages deploys automatically from GitHub `main`.

**Credentials/access needed (pointers only, never actual secrets):**
- Use the authenticated GitHub Desktop push route if shell Git credentials are unavailable.

---

## 2026-07-23 10:14 — Codex — Radio uses shared global nav locally, deploy blocked by GitHub/Cloudflare auth

**Did:**
- Confirmed real local repo is `/Users/design/Documents/GitHub/hella-rich-hub`.
- Confirmed GitHub repo is `dicanomi/hella-rich-hub`.
- Confirmed production domain is `https://hella.rich`.
- Confirmed Cloudflare Pages deploys from GitHub `main`.
- Made local commit `04510fb` (`Use shared global nav on radio`).
- Made local commit `c4a0a31` (`Add shared project handoff`).
- Changed Radio to use the shared React `HellaRichNav` instead of its old embedded static dropdown.
- Added `?hub=1` to the Radio iframe source and hid the old embedded Radio nav from the React wrapper, leaving the static bundle unchanged.
- Ran the Cloudflare production build successfully with `vite build --config vite.config.cloudflare.ts`.

**Current state:**
- Local `main` is ahead of `origin/main` by 2 commits: `04510fb` and `c4a0a31`.
- `HANDOFF.md` exists in the repo root and is committed locally.
- Local review URL: `http://127.0.0.1:3000/radio`.
- GitHub/Cloudflare live deploy is not complete.

**Next steps:**
- [ ] Resolve GitHub write access inside Codex or local Git.
- [ ] Push local `main` to `origin/main`; Cloudflare Pages should deploy automatically.
- [ ] Or provide `CLOUDFLARE_API_TOKEN` for direct Wrangler deploy to Cloudflare Pages.

**Decisions / rationale:**
- `client/src/components/HellaRichNav.tsx` is the source of truth for product dropdown links.
- Do not patch per-product dropdowns when the issue is global navigation.
- Do not keep duplicate static product dropdown lists unless a product is intentionally standalone.
- Always provide a local review URL after app changes.

**Watch out for:**
- `git push origin main` failed because this shell has no HTTPS GitHub credential.
- SSH push to `git@github.com:dicanomi/hella-rich-hub.git` failed because no GitHub public key auth is configured.
- GitHub connector permission was raised to full access, but repo write attempts still returned `403 Resource not accessible by integration`; this indicates the GitHub App installation/scope lacks contents write on `dicanomi/hella-rich-hub`.
- Direct Wrangler deploy failed because non-interactive Wrangler requires `CLOUDFLARE_API_TOKEN`.
- `pnpm check` may fail on an unrelated existing TypeScript issue in `client/src/pages/machine-exe/TheMachine.tsx` involving an SVG `textTransform` prop.
- Do not tell the user to open a terminal as the first deployment response. Exhaust authenticated Codex/GitHub/Cloudflare options and clearly name the blocked credential path if all are unavailable.

**Credentials/access needed (pointers only, never actual secrets):**
- GitHub write access for `dicanomi/hella-rich-hub` through Codex connector or local Git credentials.
- Cloudflare direct deploy requires Cloudflare credentials only if bypassing GitHub.

---

## [2026-07-23 — placeholder] — Claude (Cowork) — repo setup, no code changes yet

**Did:**
- Set up AGENTS.md / CLAUDE.md / HANDOFF.md as a shared cross-model
  continuity system, before any repo access existed.

**Current state:**
- No GitHub connector available yet in this account; repo access still
  pending. Cloudflare account is connected and already has two Workers
  deployed: `hella-presence` and `hellaradio`.

**Next steps:**
- [ ] Get repo access sorted (GitHub connector, public repo link, or desktop
      device bridge) so an agent can actually read/write code.
- [ ] Drop these three files into the real repo root once access exists.
- [ ] Fill in the placeholders in AGENTS.md with the actual stack/commands.

**Decisions / rationale:**
- Chose AGENTS.md as the static-instructions file because it's the
  cross-tool standard as of 2026 (Codex, Cursor, Copilot, Gemini CLI,
  Windsurf, Aider, Devin, and 15+ others read it natively). Claude Code
  doesn't read it directly, so CLAUDE.md imports it via `@AGENTS.md` instead
  of duplicating content.
- Kept session handoff (HANDOFF.md) separate from static conventions
  (AGENTS.md) because they change at completely different rates and get
  read for different reasons.

**Watch out for:**
- Never let any tool write real secrets into either file — both get checked
  into git and read by every agent with repo access.
