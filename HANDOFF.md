# HANDOFF.md

Running log of session-to-session, tool-to-tool state. Every agent — Claude,
Codex, Manus, whatever's next — reads the top entry at the start of a session
and appends a new entry before ending one. Newest entry on top. Never delete
older entries; this is the memory none of these tools share natively.

Keep entries short and factual. This file is context, not a diary.

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
