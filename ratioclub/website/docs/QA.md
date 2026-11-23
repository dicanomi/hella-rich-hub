# Handoff verification — 23 November 2026

The active acceptance suite is in website/tests. Historical tests in reference/test-sources may describe superseded designs and are not the current acceptance suite.

Reproduce from website/: install the pinned Node version, run npm ci, npx playwright install chromium webkit, npm run lint, npm run build, npm test, npm run test:release, then npm run build to restore the official-origin release artifact.

Current results are recorded after checking this revision. WebKit automation does not certify physical iPhone hardware. Client AWS/OIDC permissions, protected branches, cache policies, routing and headers require review in the client account; no client deployment is performed by this package.

The optional Payload editor is unchanged from the earlier sanitized handoff. Its earlier clean-install and TypeScript results are historical; local setup/seeding are not rerun unless stated. No accounts, DB, uploads, credentials or connection are supplied. No PageSpeed or Lighthouse improvement is claimed.

## Results for this revision

- Clean locked website install, lint, TypeScript and official-origin production build passed.
- Fourteen acceptance checks passed across Chromium and WebKit, covering phone/tablet/desktop routes, no page overflow, navigation, updated legal dates/section counts/table, contact/privacy behavior, no external requests or POSTs, local New Year rollover, hover-only About shapes, static Solutions quote and modal close morphing.
- All 122 non-asset runtime source files match the current approved implementation. Previously sanitized media is retained, with source assets intact and no original PDF metadata added.
- Website validation used Node 26.7.0 and npm 11.19.0 on macOS. The package pins Node 22.23.5 for the client's CI; rerun validation on that Node version/Linux runner before production merge. The local engine warning is documented rather than presented as Node 22 validation.
- The build still reports the pre-existing GSAP static/dynamic import warning. No unrelated dependency or animation refactor was included.
- Optional editor remains source-only and disconnected; its previous validation results are historical. No fresh editor install, database, seeding or login was created.
- Review the stale Privacy Choices helper sentence identified in LATEST-CHANGES.md. The supplied legal documents describe processing practices but do not enable integrations.

Release configuration checks also passed: invalid origins rejected, review mode protected, release routes/indexing verified, and the final dist output restored for https://www.ratioclub.com/ with indexing disabled.
