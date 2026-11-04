import { defineConfig, mergeConfig } from "vite";
import cloudflareConfig from "./vite.config.cloudflare";

export default mergeConfig(
  cloudflareConfig,
  defineConfig({ base: "/hella-rich-hub/" }),
);
