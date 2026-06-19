import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    headless: false,
    viewport: { width: 480, height: 850 },
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { channel: "chrome" },
    },
  ],
});
