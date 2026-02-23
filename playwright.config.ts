import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const defaultBaseUrl = "http://127.0.0.1:4173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || defaultBaseUrl;
const useExternalBaseUrl = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        url: defaultBaseUrl,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
