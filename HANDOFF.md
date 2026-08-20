# HANDOFF.md

Running log of session-to-session, tool-to-tool state. Every agent — Claude,
Codex, Manus, whatever's next — reads the top entry at the start of a session
and appends a new entry before ending one. Newest entry on top. Never delete
older entries; this is the memory none of these tools share natively.

Keep entries short and factual. This file is context, not a diary.
Use the canonical [publishing runbook](README.md#publishing-runbook) instead of
repeating deployment instructions in each entry.

---

## 2026-08-20 11:23 — Codex — Homepage line-card mode published live

**Did:**
- Published homepage 3D line-card media mode to GitHub `main` in commit `90ddabd`.
- Included per-product line sculptures, the default line/image pill toggle, brand-orange selected view buttons, Space Drone dot-travel treatment, HELLA•4 independent reel circles, and ORB nested concentric circles.
- Preserved the previous static card images behind the pill switch.
- Verified Cloudflare production switched to live bundle `/assets/index-DRzXctfY.js`.
- Verified `https://hella.rich/?v=90ddabd-final` returns 200 and the live bundle contains the new card-mode strings/colors.
- Verified `https://hella.rich/hella.fm/?v=90ddabd-final` still serves the HELLA.FM static app and its JS asset returns 200.

**Current state:**
- Production `hella.rich` is updated.
- Local `main` has the app publish commit plus this handoff note pending as documentation-only continuity.

**Watch out for:**
- Existing unrelated TypeScript check issue remains in `client/src/pages/machine-exe/TheMachine.tsx` at the SVG `textTransform` prop.
- Untracked local HELLA.FM media folders remain intentionally out of scope and uncommitted.

---

## 2026-08-20 10:51 — Codex — Homepage 3D line-card mode local branch

**Did:**
- Created local branch `agent/homepage-line-card-mode-20260820` from the current checkout for a reversible homepage visual pass.
- Added a Three.js-powered card media mode that draws red/cyan/white offset line sculptures per product story while preserving the existing static image mode.
- Made the line-card mode the default locally and added a minimal pill/dot switch next to the GRID / STACKED / LIST controls.
- Kept the change scoped to homepage card media surfaces and left existing product routes and HELLA.FM media folders untouched.
- Ran `pnpm exec vite build --config vite.config.cloudflare.ts` successfully and started local preview at `http://127.0.0.1:5176/`.
- Pre-publish sanity check passed for the production Cloudflare/Vite build, local homepage, HELLA.FM static entry/assets, and production-like preview at `http://127.0.0.1:4176/`.
- Optimized the line-card renderer to update existing geometry buffers instead of reallocating geometry every frame.

**Current state:**
- This is local-only and not pushed to GitHub.
- The previous homepage image design remains available by switching the pill back to image mode or by returning to `main`.

**Next steps:**
- [ ] User reviews the local preview.
- [ ] If approved, decide whether to promote this as the homepage default and preserve the previous homepage as a timestamped versioned route/file.
- [ ] Do not push or publish until the user approves the visual direction.

**Watch out for:**
- `pnpm exec tsc --noEmit --incremental false` still reports an unrelated existing `textTransform` SVG prop error in `client/src/pages/machine-exe/TheMachine.tsx`.
- Local Vite preview serves bare `/hella.fm` as the hub shell, but `/hella.fm/` and `/hella.fm/index.html` serve the radio app; Cloudflare has both `_redirects` and `functions/hella.fm.js` for the live bare dotted route.
- Existing untracked `client/public/hella.fm/media/*` folders remain out of scope.

---

## 2026-08-19 22:13 — Codex — HELLA.DECK local integration branch

**Did:**
- Read the Kimi AI Hella Deck handoff ZIP as implementation guidance only; did not commit the ZIP or its standalone repo scaffold.
- Built the standalone Hella Deck app from the unpacked handoff and copied the production bundle into `client/public/hella-deck-app`.
- Added a hub wrapper route at `/deck`, registered HELLA•4 in the router, homepage product surfaces, shared product switcher, and README.
- Replaced the temporary screenshot card with the approved generated jog-wheel/record-light PNG, and moved HELLA•4 into the first homepage slot.
- Applied the thin device-logo text treatment to HELLA•4 across homepage views.
- Ran the local Cloudflare build successfully and verified the integrated `/deck` route renders through the hub preview.
- Created this work on local branch `agent/add-hella-deck` so `main` is not pushed and Cloudflare production is not triggered.
- Kept the existing untracked HELLA.FM media folders out of scope and out of staging.

**Current state:**
- HELLA•4 is a local branch integration awaiting user review and additional hella.rich environment adjustments.
- The recorder remains isolated as a static app so mic capture, IndexedDB takes, and reel physics do not alter other hub products.

**Next steps:**
- [x] Run the Cloudflare build locally and review `/deck`.
- [ ] Review the local branch with the user and make remaining environment adjustments.
- [ ] Do not push to `main` or publish to Cloudflare until the user approves.

**Decisions / rationale:**
- Used the existing HELLA.SYNTH-style static-app wrapper pattern rather than adding a new architecture.
- Used `/deck` as the reliable route; no dotted route is needed for this product.

**Watch out for:**
- Hella Deck microphone recording requires a secure context for real mic capture; local visual review can still load the interface over HTTP.
- Preserve the Kimi handoff's interaction contract if rebuilding the standalone app later.

---

## 2026-08-18 19:20 — Codex — HELLA.FM direct route corrected after HELLA.SYNTH merge

**Did:**
- Fast-forwarded local `main` to include the completed HELLA.SYNTH branch work.
- Corrected HELLA.FM routing so `/hella.fm` redirects to the standalone `/hella.fm/` app instead of rendering the older hub iframe/wrapper.
- Updated the React HELLA.FM page to hand off to the standalone app for client-side navigation too.
- Added a tiny Cloudflare Pages Function for the dotted `/hella.fm` route because Pages treats dotted no-slash paths as file-like before normal static routing.
- Added a public-safe `media/stations.json` based on the approved local `5174` experience: HELLA.RICH station MP3s are split into multiple named stations across the dial, while large third-party-looking music folders remain local-only.
- Rebuilt the static HELLA.FM app from the approved `5174` source so public media loads from `/hella-fm-media/` instead of `/hella.fm/media/`; Cloudflare was serving the app shell for the dotted media path.
- Kept the large untracked HELLA.FM media folders out of staging.

**Current state:**
- Local `main` includes HELLA.SYNTH and the HELLA.FM route fix.
- HELLA.FM live should use the same app behavior as the approved `5174` build, with committed HELLA.RICH station audio plus generated browser-voice channels.
- Public HELLA.FM audio/manifest assets live at `client/public/hella-fm-media`.
- HELLA.FM still needs the Cloudflare/R2-style audio hosting plan before publishing the full local music library.

**Next steps:**
- [ ] Push `main`.
- [ ] Verify `https://hella.rich/hella.fm` and `https://hella.rich/hella.fm/` both show the approved standalone HELLA.FM build after Cloudflare deploys.
- [ ] Spot-check `/synth` after deploy so the HELLA.SYNTH work was not disturbed.

**Decisions / rationale:**
- Direct `/hella.fm` should not use the hub wrapper; the approved local build is the standalone static HELLA.FM app.
- Do not commit commercial-looking `client/public/hella.fm/media/*` folders until the public audio-hosting/rights approach is decided.

**Watch out for:**
- Avoid broad `git add -A`; stage specific HELLA.FM routing files and the approved HELLA.RICH station assets only.

---

## 2026-08-18 17:55 — Codex — HELLA.SYNTH isolated product branch

**Did:**
- Started from latest `origin/main` (`c8e92d8`) after confirming the canonical checkout only had unrelated untracked HELLA.FM media folders.
- Added HELLA.SYNTH as an isolated static app under `client/public/hella-synth-app` with a new `HellaSynthPage.tsx` wrapper route at `/synth`.
- Added the approved modular-synth card image as `client/public/card-hella-synth-v1.webp`.
- Registered HELLA.SYNTH in the app router, shared nav, homepage product surfaces, and README.

**Current state:**
- Work is isolated on `agent/add-hella-synth-isolated`; production `main` is unchanged.
- HELLA.FM, radio, Happy Human, and their asset/media folders were not edited.

**Next steps:**
- [x] Cloudflare build passed with `pnpm exec vite build --config vite.config.cloudflare.ts`.
- [ ] Commit the focused branch, push it, and verify the Cloudflare branch preview.

**Decisions / rationale:**
- Used `/synth` as the reliable public route because Cloudflare treats no-slash `/hella.synth` like a dotted file path and redirects it to `/`; kept slash-required `/hella.synth/` as an alias while serving the embedded static bundle from `client/public/hella-synth-app`.
- Kept the large untracked `client/public/hella.fm/media/*` folders out of scope and out of staging.

**Watch out for:**
- Do not stage `client/public/hella.fm/media/*`; those local folders are intentionally untracked.

**Credentials/access needed (pointers only, never actual secrets):**
- Use authenticated Git/GitHub Desktop for branch push if shell credentials are blocked.

## 2026-08-18 18:45 — Codex — HELLA.FM promoted on homepage and live-ready copy updated

**Did:**
- Made HELLA.FM the first homepage product card and swapped in the generated HELLA.FM tower card art.
- Updated HELLA.FM positioning from user-upload/private-folder language to a curated/preprogrammed local-frequency simulator.
- Kept the large local station MP3 folders out of Git for this pass; the live bundle should use committed starter media plus browser voice/generated stations until the Cloudflare-hosted audio plan is ready.
- Removed the hidden upload input from the HELLA.FM static app markup.

**Current state:**
- `/hella.fm` is the featured first-card product on the hub homepage.
- User-facing upload is not part of this phase.

**Next steps:**
- [ ] Add real station libraries through the agreed Cloudflare/R2-style audio hosting plan before treating HELLA.FM as a full public radio catalog.
- [ ] Verify `https://hella.rich/` and `https://hella.rich/hella.fm` after Cloudflare Pages deploys from `main`.

**Decisions / rationale:**
- Do not commit the 2.5GB local media folders to GitHub/Pages; preserve them locally while keeping the live app light and reversible.

**Watch out for:**
- If a future build uses `media/stations.json` generated from local folders, do not ship that manifest without also shipping or hosting the referenced audio files.

**Credentials/access needed (pointers only, never actual secrets):**
- Use authenticated Git/GitHub Desktop for push if shell credentials are blocked.

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
