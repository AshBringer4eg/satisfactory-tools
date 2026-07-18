import { defineConfig } from "@playwright/test";

const appOrigin = process.env.PLAYWRIGHT_APP_ORIGIN ?? "http://127.0.0.1:4173";
const appBasePath = (process.env.PLAYWRIGHT_APP_BASE_PATH ?? "/satisfactory-tools")
  .replace(/^\/+|\/+$/g, "");
const appBaseUrl = appBasePath ? `${appOrigin}/${appBasePath}/` : appOrigin;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL: appOrigin,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm preview --port 4173 --host 127.0.0.1",
    url: appBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
