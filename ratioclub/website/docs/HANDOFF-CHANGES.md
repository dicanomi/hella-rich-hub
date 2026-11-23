# Packaging changes relative to the approved application

No website copy, button geometry, approved motion or business contact has been altered for packaging.

- Rebuilt with the client origin and root base path; personal review origin/path removed.
- Default `npm run build` now invokes release mode; release origin defaults to the client HTTPS domain. `build:local` retains the former development/review build. Indexing remains disabled by default.
- Original source/fallback assets retained; container metadata cleaned without altering visual content.
- Local Payload source separated from the public website and delivered without state/credentials. Optional setup uses its committed lockfile via npm ci.
- Personal history, host configuration, runtime account data and unrelated projects excluded.
- Release-check helper restores the client-domain release instead of a loopback review build.
- Old README/implementation notes replaced with current neutral documentation. All historical test source retained separately; reviewed current acceptance specs are active by default.
- AWS deployment/CI examples updated to current SHA-pinned Actions. Cache policy, known-route metadata mapping and account-specific configuration are explicitly marked as client PR/infrastructure review work. No AWS deployment has been performed.

Use the file manifest to identify the package snapshot. Do not infer that matching the visual application means this artifact has been deployed to the client domain.
