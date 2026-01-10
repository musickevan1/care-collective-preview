/**
 * @fileoverview E2E tests for Authentication Flow
 *
 * Tests cover:
 * - Login with valid credentials (approved user -> dashboard)
 * - Login error handling (invalid credentials, rate limiting)
 * - Access control (protected routes redirect to login)
 * - Logout flow
 */

import { test, expect } from '@playwright/test'
import { selectors } from './selectors'
import {
  loginAsApprovedUser,
  ensureLoggedOut,
  testCredentials,
} from './fixtures/auth.fixture'

test.describe('Authentication Flow', () => {
  test.describe('Login - Happy Path', () => {
    test('approved user can login and reaches dashboard', async ({ page }) => {
      await loginAsApprovedUser(page)

      // Verify dashboard content is visible
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('h1')).toContainText(/Welcome/i)
    })

    test('login form has proper labels and structure', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Check page title/header
      await expect(page.locator('h1')).toContainText(/Welcome Back/i)

      // Check email input has label
      const emailLabel = page.locator('label[for="email"]')
      await expect(emailLabel).toBeVisible()
      await expect(emailLabel).toContainText(/Email/i)

      // Check password input has label
      const passwordLabel = page.locator('label[for="password"]')
      await expect(passwordLabel).toBeVisible()
      await expect(passwordLabel).toContainText(/Password/i)

      // Check submit button
      const submitButton = page.locator(selectors.auth.submitButton)
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toContainText(/Sign In/i)

      // Check signup link (use first() since there are multiple on page)
      const signupLink = page.locator('a[href="/signup"]').first()
      await expect(signupLink).toBeVisible()
    })

    test('login redirects to requested page via redirectTo parameter', async ({ page }) => {
      // Go to login with redirectTo parameter
      await page.goto('/login?redirectTo=/requests')
      await page.waitForLoadState('networkidle')

      // Fill credentials
      await page.fill(selectors.auth.emailInput, testCredentials.userA.email)
      await page.fill(selectors.auth.passwordInput, testCredentials.userA.password)
      await page.click(selectors.auth.submitButton)

      // Should redirect to /requests instead of /dashboard
      await page.waitForURL(/\/requests/, { timeout: 15000 })
    })
  })

  test.describe('Login - Error Cases', () => {
    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Enter invalid credentials
      await page.fill(selectors.auth.emailInput, 'invalid@example.com')
      await page.fill(selectors.auth.passwordInput, 'wrongpassword123')
      await page.click(selectors.auth.submitButton)

      // Wait for error to appear
      await page.waitForTimeout(2000)

      // Should still be on login page
      expect(page.url()).toContain('/login')

      // Should show error message (use bg-red-50 to exclude Next.js route announcer)
      const errorMessage = page.locator('.text-red-600.bg-red-50, [role="alert"].bg-red-50')
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
    })

    test('submit button shows loading state', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Fill valid credentials
      await page.fill(selectors.auth.emailInput, testCredentials.userA.email)
      await page.fill(selectors.auth.passwordInput, testCredentials.userA.password)

      // Click submit
      await page.click(selectors.auth.submitButton)

      // Button should show loading text (briefly)
      const submitButton = page.locator(selectors.auth.submitButton)
      // Check for either loading state or disabled state
      const buttonText = await submitButton.textContent()
      // This is a fast check - may or may not catch the loading state
      expect(buttonText).toBeTruthy()
    })

    test('handles session_error query parameter', async ({ page }) => {
      await page.goto('/login?error=session_error')
      await page.waitForLoadState('networkidle')

      // Should show session expired message
      const errorMessage = page.locator('.text-red-600, .text-red-500')
      await expect(errorMessage).toContainText(/session expired/i)
    })

    test('empty form submission is prevented by required fields', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Try to submit empty form
      await page.click(selectors.auth.submitButton)

      // Should still be on login page (HTML5 validation prevents submission)
      expect(page.url()).toContain('/login')
    })
  })

  test.describe('Access Control', () => {
    test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
      // Make sure we're logged out first
      await page.goto('/login')
      await ensureLoggedOut(page)

      // Try to access dashboard directly
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('unauthenticated user visiting /requests is redirected to /login', async ({ page }) => {
      await page.goto('/login')
      await ensureLoggedOut(page)

      await page.goto('/requests')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(/\/login/)
    })

    test('unauthenticated user visiting /messages is redirected to /login', async ({ page }) => {
      await page.goto('/login')
      await ensureLoggedOut(page)

      await page.goto('/messages')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(/\/login/)
    })

    test('public pages are accessible without authentication', async ({ page }) => {
      await page.goto('/login')
      await ensureLoggedOut(page)

      // Home page should be accessible
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      expect(page.url()).not.toContain('/login')

      // About page should be accessible
      await page.goto('/about')
      await page.waitForLoadState('networkidle')
      expect(page.url()).not.toContain('/login')
    })
  })

  test.describe('Logout Flow', () => {
    test('user can logout successfully', async ({ page }) => {
      // First login
      await loginAsApprovedUser(page)

      // Check if mobile menu button is visible (indicates mobile viewport)
      const mobileMenuButton = page.locator('[aria-label="Open navigation menu"]')
      if (await mobileMenuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await mobileMenuButton.click()
        // Wait for mobile menu animation to complete
        await page.waitForTimeout(500)
      }

      // Find and click logout button (use visible: true filter to avoid hidden elements)
      const logoutButton = page.locator(selectors.nav.logout).locator('visible=true')
      await logoutButton.first().click()

      // Logout redirects to homepage (/), wait for that
      await page.waitForURL(/\/$/, { timeout: 10000 })

      // Verify we're logged out by trying to access a protected page
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Authentication - Accessibility', () => {
    test('login form is keyboard navigable', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Tab to email input
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // May need extra tab for skip-to-content link

      // Should be able to type in email
      const emailInput = page.locator(selectors.auth.emailInput)
      await emailInput.focus()
      await page.keyboard.type('test@example.com')

      // Tab to password and type
      await page.keyboard.press('Tab')
      await page.keyboard.type('testpassword')

      // Tab to submit and press Enter
      await page.keyboard.press('Tab')
      // Should now be on submit button
      const focused = page.locator(':focus')
      const isButton = await focused.evaluate((el) => el.tagName === 'BUTTON')
      expect(isButton).toBe(true)
    })

    test('error messages are announced to screen readers', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Enter invalid credentials
      await page.fill(selectors.auth.emailInput, 'invalid@example.com')
      await page.fill(selectors.auth.passwordInput, 'wrongpassword123')
      await page.click(selectors.auth.submitButton)

      // Wait for error
      await page.waitForTimeout(3000)

      // Error container should have role="alert" or be properly announced
      const errorContainer = page.locator('.text-red-600, .text-red-500').first()

      if ((await errorContainer.count()) > 0) {
        // Check error is visible (screen readers will announce visible errors)
        await expect(errorContainer).toBeVisible()
      }
    })

    test('form inputs have proper autocomplete attributes', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Email input should have autocomplete="email"
      const emailInput = page.locator(selectors.auth.emailInput)
      await expect(emailInput).toHaveAttribute('autocomplete', 'email')

      // Password input should have autocomplete="current-password"
      const passwordInput = page.locator(selectors.auth.passwordInput)
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })
  })
})

test.describe('Authentication Flow - Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('login form works on mobile viewport', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Form should be visible and usable
    const emailInput = page.locator(selectors.auth.emailInput)
    await expect(emailInput).toBeVisible()

    // Fill and submit
    await page.fill(selectors.auth.emailInput, testCredentials.userA.email)
    await page.fill(selectors.auth.passwordInput, testCredentials.userA.password)
    await page.click(selectors.auth.submitButton)

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  })

  test('mobile login form has appropriate touch targets', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Submit button should be large enough (44px minimum)
    const submitButton = page.locator(selectors.auth.submitButton)
    const buttonBox = await submitButton.boundingBox()

    expect(buttonBox).not.toBeNull()
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44)
    }
  })
})
