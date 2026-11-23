import {llmsText} from './scripts/discovery.mjs';
import { isIP } from "node:net";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { publicPaths } from "./src/content/indexing.ts";
import { pageMetadata } from "./src/content/page-metadata.ts";
import { renderMetadata } from "./scripts/metadata-html.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = {...loadEnv(mode, process.cwd(), ''), ...process.env};
  const release = mode === 'release';
  const base = env.VITE_SITE_URL || (release ? 'https://www.ratioclub.com' : 'http://127.0.0.1:5190');
  const origin = new URL(base);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password)
    throw new Error('VITE_SITE_URL must be an origin with no path, query or credentials. Put a deployment subpath in VITE_BASE_PATH instead.');
  if (release && (origin.protocol !== 'https:' || (isIP(origin.hostname.replace(/^\[|\]$/g,'')) !== 0 || origin.hostname === 'localhost' || origin.hostname.endsWith('.localhost') || origin.hostname.endsWith('.local'))))
    throw new Error('Release builds require a public HTTPS VITE_SITE_URL.');
  const mount=env.VITE_BASE_PATH||'/';
  if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(mount))throw new Error('VITE_BASE_PATH must be a safe absolute path ending in /.');
  const siteBase=new URL(mount,origin).href;
  const allowIndexing = release && env.VITE_ALLOW_INDEXING === 'true';
  return {
  base:mount,
  define: {
    'import.meta.env.VITE_ENABLE_REVIEWS': JSON.stringify(release ? 'false' : 'true'),
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteBase),
    'import.meta.env.VITE_ALLOW_INDEXING': JSON.stringify(String(allowIndexing)),
  },
  plugins: [
    react(),
    {
      name: "route-social-metadata",
      transformIndexHtml: {
        order: "post",
        handler(html, context) {
          const path = (context.originalUrl || "/").split("?")[0].replace(/\/$/, "") || "/";
          return renderMetadata(html, path, siteBase, allowIndexing);
        },
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = (request.url || "/").split("?")[0].replace(/\/$/, "") || "/";
          if (!['GET','HEAD'].includes(request.method || '') || (path.includes('.') && path !== '/404.html')) return next();
          if (!release && ['/hero-options','/hero-particle-review','/hero-image-review','/about-wireframe-review','/motion-review','/wireframe-review','/graph-review'].includes(path)) {
            response.setHeader('Content-Type','text/html; charset=utf-8');
            return response.end(request.method === 'HEAD' ? undefined : readFileSync('dist/_review-shell.html','utf8'));
          }
          const known = Object.hasOwn(pageMetadata, path);
          const file = known && path !== '/404' ? (path === '/' ? 'dist/index.html' : `dist${path}.html`) : 'dist/404.html';
          response.statusCode = known && path !== "/404" ? 200 : 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(request.method === 'HEAD' ? undefined : readFileSync(file, 'utf8'));
        });
      },
      async closeBundle() {
        if (command !== "build") return;
        const template = readFileSync("dist/index.html", "utf8");
        if (!release) writeFileSync("dist/_review-shell.html", template);
        writeFileSync('dist/robots.txt', allowIndexing
          ? `User-agent: *\nAllow: /\nDisallow: /terms-and-conditions\nDisallow: /privacy-notice\nSitemap: ${new URL('sitemap.xml', siteBase).href}\n`
          : 'User-agent: *\nDisallow: /\n');
        writeFileSync('dist/llms.txt', llmsText(siteBase));
        writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allowIndexing ? publicPaths.map(path => `<url><loc>${new URL(path.slice(1), siteBase).href}</loc></url>`).join('') : ''}</urlset>`);
        const { prerender } = await import("./scripts/prerender.mjs");
        const pages = await prerender(mode, siteBase, allowIndexing, mount);
        for (const path of Object.keys(pageMetadata)) {
          const html = renderMetadata(template, path, siteBase, allowIndexing).replace(/ blocking="render"/g, "").replace('<div id="root"></div>', `<div id="root">${pages[path]}</div>`).replace(/<noscript>[\s\S]*?<\/noscript>/, "");
          if (path === "/404") writeFileSync("dist/404.html", html);
          else if (path === "/") writeFileSync("dist/index.html", html);
          else writeFileSync(`dist${path}.html`, html);
        }
      },
    },
    {
      name: "render-ready-entry",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          // Vite rebuilds module tags; retain render blocking on the app entry.
          return html.replace(/<script(?=[^>]*type="module")(?=[^>]*src="(?!\/@vite\/client)[^"]+")(?![^>]*blocking=)/g, '<script blocking="render"');
        },
      },
    },
    {
      name: "font-license-notices",
      generateBundle() {
        const notices = [
          "roboto-OFL.txt",
          "roboto-slab-LICENSE.txt",
          "RobotoMono-OFL.txt",
        ]
          .map((name) =>
            readFileSync(
              new URL(`./src/assets/${name}`, import.meta.url),
              "utf8",
            ),
          )
          .join("\n\n");
        this.emitFile({
          type: "asset",
          name: "font-licenses.txt",
          source: notices,
        });
      },
    },
  ],
  build: { assetsInlineLimit: 0, manifest: true },
  server: { host: "127.0.0.1", port: 5190, strictPort: true },
};
});
