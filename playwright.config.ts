import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  // Run `npm run build` first; this only starts the production server.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
