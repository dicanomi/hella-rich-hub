# DEPLOYMENT.md — Runbook for an automated deployer

Target artifact: a **static website**. No server code, no database,
no environment variables, no secrets.

## Inputs

| What | Where | Notes |
|---|---|---|
| Source | `app/` | React 19 + TS + Vite 7 |
| Lockfile | `app/package-lock.json` | use `npm ci`, never hand-resolve |
| Prebuilt bundle | `app/dist/` | exactly what production should serve |

## Option A — Deploy the prebuilt bundle (recommended, zero build)

Any static file server works. Requirements for the server: none beyond
serving files (hash routing = no rewrite rules).

```bash
cd app
# pick ONE:
npx serve dist                      # Node
python3 -m http.server -d dist 80   # Python
caddy file-server --root dist       # Caddy
```

Object storage / CDN: upload `dist/` contents to S3 + CloudFront,
Cloudflare Pages (direct upload), GitHub Pages, Netlify Drop, etc.
Set `index.html` as the index document. Done.

## Option B — Vercel

`app/vercel.json` is already configured (framework: vite, build:
`npm run build`, output: `dist`).

```bash
cd app && npx vercel deploy --prod
```

or import the repo in the Vercel dashboard — it auto-detects Vite.

## Option C — Netlify

`app/netlify.toml` is already configured (build: `npm run build`,
publish: `dist`).

```bash
cd app && npx netlify deploy --prod
```

## Option D — Docker / VPS

`app/Dockerfile` builds the app and serves it with nginx
(`app/nginx.conf`, long-cache headers for hashed assets).

```bash
cd app
docker build -t hellsynth .
docker run -p 8080:80 hellsynth
# → http://localhost:8080/#/instrument
```

## Option E — Rebuild from source, then serve

```bash
cd app
npm ci          # Node 20 required
npm run build   # = tsc -b && vite build → dist/
# serve dist/ per Option A
```

## Post-deploy checklist

- [ ] `/` loads (landing page, dark, animated hero)
- [ ] `/#/instrument` loads the synth
- [ ] `/#/guide` loads the guide
- [ ] Press SPACE in the instrument — transport starts (browser requires
      one click/keypress first; the app handles this automatically)
- [ ] Assets under `/assets/` return 200 and are content-hashed
- [ ] Resize the browser window across wide/narrow — layout stays stable

## If something fails

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, 404s on assets | served from wrong root | serve `dist/` itself, not the project root |
| Blank page at a deep URL | host rewrites broke | shouldn't happen (hash routing) — check you didn't add rewrite rules that strip `#` |
| No sound | browser autoplay policy | click anywhere once; expected behavior |
| White screen on mobile-width window | intentional | instrument requires ≥1024px viewport |
