const { defineConfig, devices } = require('@playwright/test');

// PW_CHROMIUM_PATH lets sandboxes/CI without the Playwright browser download
// (e.g. restricted networks) run against an already-installed Chromium.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 30000,
  reporter: process.env.CI ? 'html' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath,
          args: executablePath ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
        },
      },
    },
  ],
});
