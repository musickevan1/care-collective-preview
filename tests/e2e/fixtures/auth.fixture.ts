/**
 * @fileoverview Authentication fixtures for E2E tests
 *
 * Provides reusable authentication helpers that all test suites depend on.
 * Uses environment variables for test credentials.
 */

import { Page, expect } from '@playwright/test'
import { selectors } from '../selectors'

// Test credentials from environment variables
export const testCredentials = {
  userA: {
    email: process.env.TEST_USER_A_EMAIL || 'test-user-a@example.com',
    password: process.env.TEST_USER_A_PASSWORD || 'testpassword123',
  },
  userB: {
    email: process.env.TEST_USER_B_EMAIL || 'test-user-b@example.com',
    password: process.env.TEST_USER_B_PASSWORD || 'testpassword123',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'adminpassword123',
  },
}

/**
 * Login with the provided credentials
 *
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @returns Promise that resolves when login is complete (may redirect to various pages)
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Wait for form to be ready and visible
  const emailInput = page.locator('#email')
  const passwordInput = page.locator('#password')

  await emailInput.waitFor({ state: 'visible', timeout: 10000 })

  // Clear and fill email
  await emailInput.click()
  await emailInput.fill(email)

  // Clear and fill password
  await passwordInput.click()
  await passwordInput.fill(password)

  // Submit form
  await page.locator('button[type="submit"]').click()

  // Wait for either navigation OR error message
  try {
    await page.waitForURL(/\/(dashboard|waitlist|access-denied)/, {
      timeout: 15000,
    })
  } catch (error) {
    // Check if there's an error message on the page (look for specific error container, not empty alerts)
    const errorMessage = page.locator('.text-red-600, .text-red-500').first()
    if (await errorMessage.isVisible({ timeout: 1000 })) {
      const errorText = await errorMessage.textContent()
      if (errorText && errorText.trim()) {
        throw new Error(`Login failed: ${errorText}`)
      }
    }

    // Check if still on login page (credentials may be wrong)
    if (page.url().includes('/login')) {
      throw new Error(
        `Login timeout: User "${email}" may not exist or credentials are invalid. ` +
        `Set TEST_USER_A_EMAIL and TEST_USER_A_PASSWORD env vars with valid test credentials.`
      )
    }

    throw error
  }
}

/**
 * Login as the primary test user (User A - approved)
 * Expects redirect to dashboard after login
 */
export async function loginAsApprovedUser(page: Page): Promise<void> {
  await loginAsUser(page, testCredentials.userA.email, testCredentials.userA.password)

  // Verify we're on the dashboard (user is approved)
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

/**
 * Login as the secondary test user (User B - approved)
 * Useful for two-user interaction tests
 */
export async function loginAsSecondaryUser(page: Page): Promise<void> {
  await loginAsUser(page, testCredentials.userB.email, testCredentials.userB.password)

  // Verify we're on the dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsUser(page, testCredentials.admin.email, testCredentials.admin.password)

  // Verify we're on the dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

/**
 * Ensure the user is logged out
 * Useful for cleanup between tests or ensuring clean state
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  try {
    // Check if mobile menu button is visible (indicates mobile viewport)
    const mobileMenuButton = page.locator('[aria-label="Open navigation menu"]')
    if (await mobileMenuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await mobileMenuButton.click()
      // Wait for mobile menu to open - use short timeout in case user isn't logged in
      await page.waitForTimeout(500)
    }

    // Try to find and click logout button (use visible filter)
    const logoutButton = page.locator(selectors.nav.logout).locator('visible=true')

    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
      // Wait for navigation to homepage
      await page.waitForURL(/\/$/, { timeout: 5000 }).catch(() => {})
    }
  } catch {
    // User might not be logged in, continue
  }

  // Verify we're logged out by checking we can access login page
  await page.goto('/login')
  await expect(page.locator(selectors.auth.emailInput)).toBeVisible()
}

/**
 * Wait for successful authentication redirect to dashboard
 */
export async function waitForDashboard(page: Page): Promise<void> {
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  // Verify dashboard content is visible
  const welcomeMessage = page.locator(selectors.dashboard.welcomeMessage)
  await expect(welcomeMessage).toBeVisible({ timeout: 5000 })
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Navigate to dashboard and check if we stay there
  const currentUrl = page.url()

  if (!currentUrl.includes('/dashboard')) {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  }

  // If we're still on dashboard, we're authenticated
  return page.url().includes('/dashboard')
}

/**
 * Get current authentication status
 */
export async function getAuthState(
  page: Page
): Promise<'authenticated' | 'pending' | 'rejected' | 'unauthenticated'> {
  const currentUrl = page.url()

  if (currentUrl.includes('/dashboard')) {
    return 'authenticated'
  } else if (currentUrl.includes('/waitlist')) {
    return 'pending'
  } else if (currentUrl.includes('/access-denied')) {
    return 'rejected'
  } else {
    return 'unauthenticated'
  }
}

/**
 * Attempt login and expect failure
 * Useful for testing error cases
 */
export async function attemptInvalidLogin(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill(selectors.auth.emailInput, email)
  await page.fill(selectors.auth.passwordInput, password)

  await page.click(selectors.auth.submitButton)

  // Wait for error message to appear
  await page.waitForTimeout(2000) // Allow time for API response

  // Should still be on login page
  expect(page.url()).toContain('/login')
}
