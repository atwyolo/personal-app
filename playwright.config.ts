import { defineConfig, devices } from "@playwright/test";

import { BUILD_COMMIT } from "./e2e/build-commit";

// Not 3000: a running `next dev` there would be reused and the tests would skip the production build.
const port = 3100;
const baseURL = `http://localhost:${port}`;

/**
 * End-to-end tests against a production build, as the Next.js testing guide recommends:
 * caching and prerendering behave as in production only after `next build`.
 */
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
    // The design's mobile frame is 390 px wide.
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    // As on Vercel, so the app version tag is tested with its commit.
    env: { VERCEL_GIT_COMMIT_SHA: BUILD_COMMIT },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
