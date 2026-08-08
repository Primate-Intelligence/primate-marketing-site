import { defineConfig } from '@playwright/test';

/**
 * Link-audit / smoke suite for the marketing site.
 *
 * Runs against a DEPLOYED site (no dev server is started):
 *   BASE_URL=https://primateintelligence.ai npx playwright test --project=chromium
 * Defaults to prod when BASE_URL is unset. Use the dev twin to gate before
 * a prod push: BASE_URL=https://dev-www.primateintelligence.ai
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://primateintelligence.ai',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
