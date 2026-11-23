# CloudFront response headers — review with infrastructure owner

Apply via the existing CloudFront response headers policy, not the Cloudflare `_headers` file. Preserve the existing stricter policy where compatible.

- Strict-Transport-Security: max-age=31536000; includeSubDomains (use includeSubDomains only if all applicable subdomains support HTTPS).
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
- CSP baseline for review: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'

Inline style allowance supports current CSS/GSAP/React styling. No third-party script/iframe origins are needed. Test native animations, local videos, clipboard and policy routes after policy association. HSTS/DNS/certificate/origin access are infrastructure responsibilities and are not installed by this document.
