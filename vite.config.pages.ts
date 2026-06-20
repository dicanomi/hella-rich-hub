/**
 * vite.config.pages.ts
 *
 * GitHub Pages STAGING build (https://dicanomi.github.io/hella-rich-hub/).
 * - Identical to the Cloudflare config EXCEPT it sets base: "/hella-rich-hub/"
 * - Does NOT affect the live Cloudflare site, which uses vite.config.cloudflare.ts.
 * - Emits a 404.html (copy of index.html) so client-side routes deep-link correctly.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "node:fs";

const BASE = "/hella-rich-hub/";

export default defineConfig({
  base: BASE,
  define: {
    "import.meta.env.VITE_ROUTER_BASE": JSON.stringify("/hella-rich-hub"),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-404-fallback",
      closeBundle() {
        const out = path.resolve(import.meta.dirname, "dist/public");
        const idx = path.join(out, "index.html");
        const notFound = path.join(out, "404.html");
        if (fs.existsSync(idx)) fs.copyFileSync(idx, notFound);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
  },
});
