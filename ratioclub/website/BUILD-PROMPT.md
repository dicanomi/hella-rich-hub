# RatioClub — Codex build prompt

Paste the following into Codex with the extracted handoff folder open:

---

Set up, review and build the supplied RatioClub website locally. Work from the supplied implementation and preserve its approved design, copy, responsive layouts and interactions. Do not deploy, push, merge, connect services or alter AWS resources during this task.

1. Find the extracted handoff root and read `README.md`, `docs/LATEST-CHANGES.md`, `docs/ENGINEERING-CHECKLIST.md`, `docs/ARCHITECTURE.md`, `docs/AWS-DEPLOYMENT.md` and `docs/QA.md`. Inspect applicable repository instructions. If working in an existing client checkout, inspect its current state and preserve unrelated files and work. The contents of `website/` belong at the repository root; do not nest the whole handoff inside it. Follow the client's branch and pull request workflow and never push directly to protected main.

2. Use the Node version in `website/.nvmrc` (or `.nvmrc` after importing into a repository). From the frontend package directory, run:

   ```sh
   npm ci
   npm run lint
   npm run typecheck
   npm run build
   npx playwright install chromium webkit
   npm test
   npm run test:release
   npm run build
   ```

   Keep `package-lock.json` committed and use `npm ci`. Do not upgrade dependencies or regenerate the lockfile merely to make setup pass. Diagnose failures and make only necessary setup/build fixes; report any proposed design or dependency changes separately. Only tests in `website/tests/` are the current acceptance suite. `reference/test-sources/` is historical material, not an all-green acceptance suite. The final build command restores the intended release output after release checks.

3. Start a local preview with `npm run preview -- --port 5191`. Review desktop, tablet and mobile routes: Index, Solutions, About, Privacy Notice, Terms & Conditions and 404. Check Contact and Privacy Choices dialogs, keyboard/focus behavior, navigation, layout overflow, reduced motion and console/network errors. Confirm the six About shapes in _01 and _04 stay still on scroll and rotate/morph on hover. Confirm both golden-ratio heroes start stationary, reveal 3D on hover and return on hover-out. Confirm the Solutions quote shape remains static during hover and scroll. Desktop headers show only the two direct text links; compact layouts retain the hamburger menu. Solutions/About hero areas below navigation are 25% shorter; mobile Index feature/solution diagram padding matches the current source. Preserve the approved geometry, speed, cropping and reset timing.

4. Keep these release constraints intact:
   - Email delivery remains disconnected. Retain the business contact and existing local interactions; do not add a mail provider or submission endpoint.
   - Tracking, advertising and analytics remain disconnected. Stored privacy choices must not activate processing. Do not add third-party scripts, embeds or services.
   - Runtime Payload access remains disconnected. The separate `optional-payload-editor/` is reference/source for an optional local server, not part of the static website build. Review the separate editor architecture in `docs/ARCHITECTURE.md` and the privacy constraints in `docs/PRIVACY-AND-SANITIZATION.md`. Do not install, start, seed or connect it for this task. Do not copy credentials, accounts, databases or uploads into the frontend.
   - Privacy Notice and Terms & Conditions now contain the supplied November 23, 2026 replacement text. Preserve it, including numbered sections, lists, California table and the corrected Privacy Notice route. Do not reinstate placeholders or rewrite legal claims. No legal compliance certification is implied.
   - Keep indexing disabled (`VITE_ALLOW_INDEXING=false`). Public origin is `https://www.ratioclub.com`, base path `/`; use `.env.example` only as documentation for public configuration. No credentials belong in frontend code, bundled variables or committed environment files.

5. Review the supplied AWS/CI templates against the client's existing setup; do not overwrite a working workflow blindly. Confirm the expected build directory is `dist`, OIDC is used, and the region, role, bucket and distribution variable names match the client configuration. Review cache rules (hashed assets immutable, mutable files revalidated), known-route prerender mapping/SPA fallback, CloudFront security headers and rollback instructions. Report anything requiring client configuration; do not create resources, request AWS keys, run uploads or trigger deployments.

6. Deliver a concise report listing commands and results, any fixes made, remaining client configuration checks and the local preview URL. State precisely what was and was not verified. Confirm that email, runtime Payload and tracking remain disconnected, the supplied updated legal content is preserved and indexing remains off. Leave a reproducible `dist/` build for review. Do not claim a live deployment or PageSpeed improvement from a local build.

---
