# Client engineering checklist

Legend: **verified** = inspected/tested in this handoff; **client check** = requires client repository/AWS state; **review change** = proposed template modification for the pull request. No AWS resources or client-production repository settings were changed while preparing the archive.

## Overview

- [x] **Verified:** React SPA builds entirely to static files; Vite, TypeScript, ordinary CSS and GSAP.
- [x] **Verified:** No public-site database, API route or server runtime. Build-time prerendering is not runtime SSR.
- [ ] **Client check:** https://www.ratioclub.com remains the intended production origin; verify apex redirect, DNS, certificate and private S3/CloudFront origin access configuration. This package does not provision them.
- [ ] **Client check:** use the private repository https://github.com/the-ratio-club/ratioclub-website, grant only necessary contributor access and preserve repository privacy.

## How deploys work

- [x] **Prepared:** `.github/workflows/deploy.yml` runs on main pushes after merges, or manual dispatch on main. It runs `npm ci`, lint, `npm run build`, assumes an AWS role via OIDC, uploads `dist`, then invalidates CloudFront.
- [x] **Prepared:** no long-lived AWS key. `id-token: write` is scoped to the deployment job; role/bucket/distribution/region are non-secret repository variables, not embedded browser settings.
- [ ] **Client check:** merge the template with the existing workflow and map its four existing AWS settings into the named variables. Confirm the OIDC trust policy is restricted to the intended repository and branch/environment.
- [ ] **Client check:** confirm Actions > Deploy website > Run workflow and a normal approved PR merge both succeed. The template has not deployed to client AWS.

## Expectations 1–9

1. [x] **Documented:** create a branch and pull request; never directly push or force-push protected main. [ ] **Client check:** actual branch protection, approval/merge permissions and required checks are enforced in GitHub. Follow the maintainer's configured rules; a delivered ZIP cannot prove them.
2. [x] **Verified:** package-lock.json is included; clean `npm ci` and build are covered in the QA record. The optional editor has its own lockfile and is not part of the website install.
3. [x] **Verified:** `npm run build` emits `dist`; `BUILD_DIR: dist` remains correct. The handoff default build uses release mode with the client origin, not a loopback metadata origin or an experimental review bundle.
4. [x] **Verified:** client-side routing requires no server. [ ] **Client check:** configure/retain the CloudFront SPA fallback. [ ] **Review change:** known clean URLs should map to the generated `route.html` files to serve the correct prerendered page and social metadata; an optional viewer-request function is supplied. Existing index fallback still permits JS navigation but initially serves Index metadata for deep links.
5. [x] **Verified:** application JS/CSS and imported media/fonts use hashed filenames. [ ] **Review change:** cache only `assets/*` as year-long immutable. Route HTML, robots.txt, sitemap.xml, llms.txt, favicon.svg and the fixed social-card URL are mutable names and must revalidate. The proposed workflow makes this explicit. Keeping the original blanket one-year rule would produce stale browser content; CDN invalidation cannot clear browser caches.
6. [x] **Verified:** no newly connected third-party script, tracker, calendar, map or embed. [ ] **Client check:** apply the required CloudFront response headers policy (including HSTS and anti-framing); the retained Cloudflare `_headers` file is not an AWS configuration. Ask before adding new third parties; do not iframe this site on other domains.
7. [x] **Verified:** no supplied account credentials, private environment files, editor DB, accounts or uploads. Public build configuration only. [ ] **Client check:** run the organization's secret scanner on the PR and repository history; package scanning cannot certify unrelated historical commits.
8. [x] **Prepared:** current official Action releases checked 22 November 2026: checkout v7.0.1, setup-node v7.1.0, configure-aws-credentials v6.3.0. Templates pin the verified full commit IDs and label the versions. [ ] **Client check:** review runner compatibility and dependency updates on the normal maintenance schedule. No broad dependency upgrade was applied to the app.
9. [x] **Documented:** inspect failing Actions step logs and share a sanitized log. Build/validation fails before uploading, preserving live files. **Important limit:** direct S3 uploads are not atomic—an upload failure can leave a partial mixture. Do not describe every failure as automatically retaining a complete last-good site. Use the documented rollback or adopt an atomic release-prefix strategy separately.

## Rollbacks

- [x] **Documented:** revert the bad PR on a new branch, review and merge; this rebuilds/deploys the prior source.
- [ ] **Client check:** verify S3 versioning and retention; restoration of individual object versions is an administrator operation.
- [x] **Prepared:** workflow keeps old hashed assets during deploy so existing tabs can load their chunks. Agree an explicit retention/cleanup policy; it does not delete arbitrary bucket contents.

## Product gates

- [x] Email delivery, Payload runtime access and tracking remain disconnected.
- [x] The supplied Privacy Notice and Terms & Conditions text is included, dated November 23, 2026. This handoff does not certify legal compliance.
- [x] Default release indexing remains off. Enabling indexing/public launch requires content/legal/brand approval and client verification.
