# AWS deployment and migration

## Import through a pull request

Copy `website/` contents to the client repository root on a new branch. Preserve unrelated repository files, infrastructure and mail/DNS resources. Review source, assets, package-lock.json, deployment and CI workflow changes in the same PR. Do not push directly to main. No client repository write or AWS deployment was performed for this handoff.

## Configuration

Set these non-secret GitHub repository variables using the equivalent values already in the client's existing workflow:

| Variable | Existing setting to reuse |
|---|---|
| `AWS_REGION` | S3/CloudFront deployment region |
| `AWS_ROLE_ARN` | Existing GitHub OIDC deploy role |
| `AWS_S3_BUCKET` | Existing private website bucket |
| `AWS_DISTRIBUTION_ID` | Existing distribution |
| `VITE_ALLOW_INDEXING` | Leave `false` until launch approval |

The template's public origin is `https://www.ratioclub.com`; base path is `/`. The role ARN and infrastructure identifiers are not browser secrets, but none are bundled in this archive. No AWS access key or token is necessary. Confirm OIDC audience and repository/branch or environment subject with the AWS maintainer. Permissions should cover only the target bucket/object upload and intended distribution invalidation.

## Build and upload

`npm ci` → `npm run lint` → `npm run build` → upload hashed assets → upload mutable files → upload index.html last → invalidate CloudFront. Main-only manual dispatch is supported. Current Actions are SHA-pinned; app runtime remains Node 22 despite the Action's own runtime.

Only `dist` is a public artifact. Do not upload source, `.env`, the optional editor, node_modules, reference files or docs. The template excludes Vite's internal manifest and Cloudflare-specific files from S3.

### Caching differs intentionally from the old blanket rule

`assets/*`: `public,max-age=31536000,immutable`. Other fixed-name files: `no-cache` (store but revalidate), including index.html and per-route HTML. This is necessary for route metadata and mutable fixed URLs. It is a reviewable workflow change, not a change already made to client infrastructure. If policy truly requires every non-index file to be immutable, first redesign/hash the mutable URLs and route delivery; do not apply that policy unchanged to this output.

Old hashed assets are retained for open browser tabs. Agree a cleanup policy based on retention and release manifests. There is no blanket `--delete` against the client bucket.

### Routing and metadata

Generated files: index.html, solutions.html, about.html, contact.html, privacy-notice.html, terms-and-conditions.html, 404.html. The supplied optional `cloudfront/clean-routes.js` viewer-request function maps known clean paths to these objects. Review and associate it with the intended cache behavior; a ZIP does not install it. Query strings are preserved because only `request.uri` changes.

The existing SPA index fallback permits navigation without this function, but raw deep-link responses/social crawlers can receive Index metadata. Confirm known paths, trailing slash behavior and missing assets after deployment. Unknown routes should follow the client's agreed 404/SPA policy; the sample deliberately does not rewrite asset URLs or change unknown-path policy.

### Headers

CloudFront must provide HTTPS/HSTS, X-Content-Type-Options, anti-framing, Referrer-Policy and the approved CSP/Permissions-Policy. `public/_headers` is a static-host reference and has no effect on CloudFront. See `cloudfront/HEADERS.md`. Confirm CSP permits the site's native animation styles and local media while allowing no unnecessary remote script/frame origins.

## Production verification

Check clean entry URLs on desktop and mobile; navigation/back/forward/refresh; real clipboard success/failure; both modal close controls, desktop outside clicks and focus return; saved privacy preferences/GPC/DNT; reduced motion; first-click navigation in Safari; media playback/one video request; no third-party tracking or form POST; MIME types and caching; production canonical/social URLs and sitemap; known 404 behavior. Review the supplied updated legal text and the site-status copy before public launch/indexing.

## Failure and rollback

Read the first failed Actions step. Sanitize logs before sharing. Build failure precedes uploads; transfer failures can be partial. Revert the bad PR and merge to redeploy. Administrators can use versioned S3 object recovery if configured. An atomic multi-file rollback is not provided by direct S3 sync. For stronger atomicity, agree release prefixes and controlled origin switching as a separate infrastructure change.
