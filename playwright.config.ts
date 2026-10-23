import { defineConfig, devices } from "@playwright/test";

// Testes visuais e de navegação sobre o export estático (rode `npm run build` antes).
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  webServer: { command: "npm run serve -- 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
});
