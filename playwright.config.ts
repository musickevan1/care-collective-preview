import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Care Collective E2E Testing
 * 
 * Usage:
 *   npx playwright test                    # Run all tests
 *   npx playwright test tests/e2e/         # Run E2E tests only
 *   npx playwright test --headed           # Run with browser visible
 *   npx playwright test --ui               # Run with Playwright UI
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for E2E to maintain state
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Single worker for E2E tests to maintain order */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for tests */
    baseURL: process.env.E2E_BASE_URL || 'https://www.swmocarecollective.org',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'on-first-retry',
    
    /* Timeout for actions */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  /* Global timeout */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
