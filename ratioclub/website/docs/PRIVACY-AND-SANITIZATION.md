# Privacy, sanitization and exclusions

## Included on purpose

Approved RatioClub business content, public business email `hello@ratioclub.com`, public organization GitHub/LinkedIn destinations, source assets, library/package authors in required license notices, and loopback development addresses. Reserved example/test email addresses and a deliberately invalid local sender address are also retained for functional tests/configuration. These are not personal account credentials. Third-party attribution/licenses must remain intact.

The package contains technical configuration names such as PAYLOAD_SECRET and AWS_ROLE_ARN, but no supplied secret values. The local editor generates a fresh secret on the recipient's own machine. No initial login/password is seeded; create a new first local administrator.

## Excluded

Personal usernames/contact addresses, personal review-host origin, home-directory paths, Git remotes/history/authorship, OS account metadata, GitHub/AWS credentials, private .env files, editor database/accounts/uploads, caches, node_modules, browser state/cookies, screenshots of personal tools, private deployment IDs/account IDs, local backups, work instructions and unrelated hosting-repository projects.

Container metadata in copied image/video/vector assets is cleaned where present, without re-encoding the visual media stream/pixels. The metadata cleanup manifest lists affected relative files, not any removed values. Filesystem owner names and ZIP comments/extra fields are not stored in the archive. No source maps are included in the static build.

## Coverage and limits

Static content, filenames and binary text are screened for known personal markers and credential formats; generated output and ZIP are rechecked. This is a targeted privacy/secret screen, not a guarantee about arbitrary unknown secrets or a full vulnerability assessment. No Git history is delivered, and no claim is made about unrelated repository history.

No personal infrastructure is necessary for the client to build or host the website. Therefore none is included. The client-domain static build intentionally differs from the former hosted preview in canonical/base URLs and sanitized metadata; source design/copy/behavior is preserved.

The legal pages contain the supplied replacement text dated November 23, 2026. Corporate contact details and the named data-protection contact in that text are intentional client content, not personal creator information. Preference switches are preference storage, not proof of legal compliance. Tracking, editor runtime access and email delivery are disconnected.
