# RatioClub website — developer handoff

Prepared 23 November 2026. This package contains the approved website implementation, its local media editor separately, and client deployment guidance. It is not an authorization to deploy to the client production domain.

For a ready-to-paste Codex setup and review task, use `BUILD-PROMPT.md`.

See `docs/LATEST-CHANGES.md` for this latest revision and `DEVELOPER-MESSAGE.md` for the short handoff note.

## Start here

1. Read `docs/ENGINEERING-CHECKLIST.md` and `docs/AWS-DEPLOYMENT.md` before changing the client repository or infrastructure.
2. The **contents of `website/`** belong at the root of `the-ratio-club/ratioclub-website` on a new branch. Preserve unrelated repository files and review the workflow changes in the same pull request. Never copy the enclosing handoff folder as the repository root.
3. Install Node 22.23.5 (see `.nvmrc`), then run `npm ci`, `npm run dev` in `website/`. Local site: http://127.0.0.1:5190.
4. `npm run build` creates a static, client-domain release in `website/dist/`. `npm run preview -- --port 5191` serves that release locally. The build is intentionally **noindex** by default until the owner approves public indexing.
5. Run `npm run lint`, `npm test`; install the matching Playwright browsers first with `npx playwright install chromium webkit`.

## Contents

- `website/`: complete frontend source, bundled fallback assets, lockfile, current tests, and reviewed AWS/CI templates. `dist/` is included after verification for an immediate static preview; regenerate it before a later deployment.
- `optional-payload-editor/`: separate local server application, source and its own lockfile only. No database, accounts, uploads, environment files, or credentials are included.
- `reference/test-sources/`: the complete historical test source set. Some assertions describe superseded designs and must not be treated as the current acceptance suite.
- `docs/`: architecture, engineering checklist, AWS migration, UI/behavior map, optional editor, QA, privacy and package integrity documentation.
- `FILE-MANIFEST.json`: checksums of the delivered files. The adjacent ZIP SHA-256 can verify transport integrity.

## Current product state

Email delivery, runtime CMS calls and tracking are disconnected. The public business contact is `hello@ratioclub.com`; the Contact overlay copies it to the clipboard. Privacy Notice and Terms & Conditions contain the supplied replacement copy dated November 23, 2026; preserve that text. No legal compliance certification is claimed.

The static build is regenerated for `https://www.ratioclub.com/`, not copied byte-for-byte from a review-host deployment. Visual source/content is preserved; public origin configuration, packaging and metadata sanitation account for build differences. Personal hosting configuration and Git history are deliberately absent.

Keep required third-party software/font licenses. Rights and final content approval remain release responsibilities.
