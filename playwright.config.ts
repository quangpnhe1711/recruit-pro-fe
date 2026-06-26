import { defineConfig, devices } from "@playwright/test";

// E2E for the ownership + status contract (E2E-OWN-001/002/003). These tests are deterministic:
// they seed an authenticated session into localStorage and mock every /api/** response via route
// interception, so no live backend is required. See docs/testing/e2e-ownership-manual-checklist.md.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
