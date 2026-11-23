# Application storage inventory (implementation record, not legal policy)

| Key / mechanism | Purpose | Provider | Duration |
|---|---|---|---|
| `ratioclub_privacy_v1` in localStorage | Necessary preference record: schema version, necessary/analytics/marketing selections, GPC/DNT state, timestamp and expiresAt | First-party app | 180 days logically; expired entries are ignored when read. Browser localStorage has no native expiry timer; it remains until overwritten/cleared by the browser/user. |
| `ratioclub_legal_shape_order` in sessionStorage | Avoid repeating the last decorative legal shape order | First-party app | Current browser tab/session; browser session restoration behavior can vary |
| `history.state.ratioclubScroll` | Restore this history entry's reading position on refresh/back/forward | First-party app | History-entry lifetime |
| Clipboard write after an explicit Contact button click | Copy public business contact | Browser/user device | User/browser clipboard lifecycle; no server transfer |

The public app sets no analytics/ad cookies and installs no tracking integration. Optional preference selections do not activate processing. Hosting/CDN infrastructure must be checked separately for any cookies/scripts outside the application source.

The optional local Payload editor uses separate development authentication/storage only after an administrator creates an account. Its SQLite/auth state and private environment are absent from the package and are never part of the static public-site inventory or upload.
