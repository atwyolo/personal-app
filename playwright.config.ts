import { defineConfig, devices } from "@playwright/test";

import { BUILD_COMMIT } from "./e2e/build-commit";

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    env: { VERCEL_GIT_COMMIT_SHA: BUILD_COMMIT, PORT: String(port), CONTENT_ROOT: "e2e/content" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
