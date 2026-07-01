/**
 * vite.config.cloudflare.ts
 *
 * Clean Vite config for Cloudflare Pages deployment.
 * - No Manus runtime plugins
 * - No debug collector
 * - No storage proxy
 * - Output: dist/public (matches Cloudflare Pages bucket)
 * - SPA routing handled by client/public/_redirects
 * - Code splitting: vendor chunks + per-product lazy chunks
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core vendor splits
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer";
          }
          if (id.includes("node_modules/tone")) {
            return "vendor-tone";
          }
          if (id.includes("node_modules/wouter")) {
            return "vendor-router";
          }
          // Product chunks — each product gets its own chunk
          if (id.includes("/pages/OrbPage") || id.includes("/components/OrbCanvas") || id.includes("/lib/orbMoods") || id.includes("/lib/orbAudio") || id.includes("/lib/orbRenderer")) {
            return "product-orb";
          }
          if (id.includes("/pages/DeadAirPage") || id.includes("/components/DeadAir") || id.includes("/hooks/useDeadAirAudio") || id.includes("/lib/deadAir")) {
            return "product-dead-air";
          }
          if (id.includes("/pages/FourcastPage")) {
            return "product-fourcast";
          }
          if (id.includes("/pages/AetherPage") || id.includes("/components/aether") || id.includes("/hooks/useAetherAudio") || id.includes("/hooks/useTripHopBeast")) {
            return "product-aether";
          }
          if (id.includes("/pages/TheEyePage") || id.includes("/components/TheEye") || id.includes("/hooks/usePerhapsAudio") || id.includes("/lib/fortunes")) {
            return "product-the-eye";
          }
          if (id.includes("/pages/LowBatteryPage") || id.includes("/components/FlyCanvas") || id.includes("/hooks/useAudioEngine") || id.includes("/hooks/useFlySystem")) {
            return "product-low-battery";
          }
          if (id.includes("/pages/SpaceDronePage") || id.includes("/lib/droneEngine") || id.includes("/components/DroneKnob") || id.includes("/components/DroneViz") || id.includes("/components/SpaceBackground") || id.includes("/components/PlanetRockModal")) {
            return "product-space-drone";
          }
          if (id.includes("/pages/machine-exe")) {
            return "product-machine-exe";
          }
        },
      },
    },
  },
});
