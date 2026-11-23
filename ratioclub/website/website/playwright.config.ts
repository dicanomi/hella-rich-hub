import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 2,
  use: { baseURL: "http://127.0.0.1:5191", reducedMotion: "reduce" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 5191 --strictPort",
    url: "http://127.0.0.1:5191",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: { executablePath: process.env.RC_CHROMIUM_PATH },
      },
    },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
        launchOptions: { executablePath: process.env.RC_WEBKIT_PATH },
      },
    },
  ],
});
