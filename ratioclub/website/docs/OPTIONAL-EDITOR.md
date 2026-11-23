# Optional Payload editor — separate and disconnected

This is an optional local server application, not a component of the static website or its AWS deployment. Do not install or run it as part of the normal frontend build. No database, users, uploads, environment files or supplied credentials are included. Frontend media overrides remain empty and no browser CMS connection is enabled.

The source is in `optional-payload-editor/media-editor/`, with its own package.json and lockfile. Payload, Next.js and SQLite require a server runtime; S3 cannot execute this application. The development server is bound to loopback at `http://127.0.0.1:5197` and its email adapter deliberately rejects delivery.

If a developer later explicitly chooses to evaluate this editor, copy `optional-payload-editor/media-editor/` into `website/media-editor/` in an isolated local checkout. The frontend's `editor:setup` helper expects that sibling structure: it generates a new local secret, installs the editor's locked dependencies and seeds local fallback media. `editor` starts the local server. These commands are optional, create private local state and must not be part of CI or deployment. The recipient creates their own first administrator; there is no shared login.

Saving editor media settings can write local static snapshots and exported media into that checkout. Leave slots unset to keep source fallbacks, review any generated changes before building, and do not run this workflow against the release copy by accident. Database, `.env`, uploads and caches stay local and excluded from Git/public artifacts. Hosting or connecting the editor remotely would be a separate architecture/security task requiring explicit authorization.

The editor source is unchanged from the prior sanitized handoff. Setup, seeding and new account creation were not rerun for this revision.
