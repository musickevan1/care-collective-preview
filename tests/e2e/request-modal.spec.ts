/**
 * @fileoverview E2E tests for Request Detail Modal
 * Tests the modal/drawer functionality on desktop and mobile
 */

import { test, expect } from '@playwright/test'

const PRODUCTION_URL = 'https://care-collective-preview.vercel.app'

// Test credentials - update with actual test account
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

test.describe('Request Detail Modal - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${PRODUCTION_URL}/login`)

    // Login (if needed - adjust selectors as needed)
    // This might need to be updated based on your actual login flow
    try {
      await page.fill('input[type="email"]', TEST_EMAIL, { timeout: 5000 })
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
    } catch (e) {
      // Might already be logged in
      console.log('Login flow skipped or failed:', e)
    }

    // Navigate to requests page
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')
  })

  test('should open modal when clicking request card', async ({ page }) => {
    // Wait for request cards to load
    await page.waitForSelector('[data-testid="request-card"], .hover\\:shadow-md', { timeout: 10000 })

    // Get initial URL
    const initialUrl = page.url()

    // Click first request card
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for URL to update with ID parameter
    await page.waitForFunction(() => {
      return window.location.search.includes('id=')
    }, { timeout: 5000 })

    // Verify URL changed to include ID
    const newUrl = page.url()
    expect(newUrl).toContain('?id=')
    expect(newUrl).toContain('/requests')

    // Verify modal is visible (Dialog should be present)
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Verify modal contains request details
    await expect(modal).toContainText(/Request|Help|Details/i)
  })

  test('should close modal with close button', async ({ page }) => {
    // Click first request card to open modal
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Find and click close button (X button)
    const closeButton = page.locator('[aria-label="Close"]').first()
    await closeButton.click()

    // Verify modal is hidden
    await expect(modal).not.toBeVisible({ timeout: 3000 })

    // Verify URL parameter is removed
    expect(page.url()).not.toContain('?id=')
  })

  test('should close modal with ESC key', async ({ page }) => {
    // Click first request card to open modal
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Press ESC
    await page.keyboard.press('Escape')

    // Verify modal is hidden
    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('should support direct link with ID parameter', async ({ page }) => {
    // First, get a request ID by clicking a card
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes('id='))
    const urlWithId = page.url()

    // Extract the ID
    const idMatch = urlWithId.match(/id=([^&]+)/)
    expect(idMatch).not.toBeNull()
    const requestId = idMatch![1]

    // Navigate directly to URL with ID
    await page.goto(`${PRODUCTION_URL}/requests?id=${requestId}`)

    // Verify modal opens automatically
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
  })

  test('should navigate back to list when browser back button clicked', async ({ page }) => {
    // Click first request card to open modal
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Click browser back button
    await page.goBack()

    // Verify modal is hidden
    await expect(modal).not.toBeVisible({ timeout: 3000 })

    // Verify URL has no ID parameter
    expect(page.url()).not.toContain('?id=')
  })

  test('should not show React Error #419', async ({ page }) => {
    // Monitor console for errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Monitor page errors
    const pageErrors: Error[] = []
    page.on('pageerror', error => {
      pageErrors.push(error)
    })

    // Click first request card
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000)

    // Check for React Error #419
    const has419Error = [...consoleErrors, ...pageErrors.map(e => e.message)]
      .some(msg => msg.includes('419') || msg.includes('Cannot update component'))

    expect(has419Error).toBe(false)
  })
})

test.describe('Request Detail Modal - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test.beforeEach(async ({ page }) => {
    // Login flow (same as desktop)
    await page.goto(`${PRODUCTION_URL}/login`)

    try {
      await page.fill('input[type="email"]', TEST_EMAIL, { timeout: 5000 })
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
    } catch (e) {
      console.log('Login flow skipped or failed:', e)
    }

    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')
  })

  test('should open drawer when clicking request card on mobile', async ({ page }) => {
    // Click first request card
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes('id='))

    // On mobile, should show drawer (not dialog)
    // Drawer uses vaul which has specific data attributes
    const drawer = page.locator('[vaul-drawer], [role="dialog"]')
    await expect(drawer).toBeVisible({ timeout: 5000 })
  })

  test('should close drawer with close button on mobile', async ({ page }) => {
    // Click first request card
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Wait for drawer
    const drawer = page.locator('[vaul-drawer], [role="dialog"]')
    await expect(drawer).toBeVisible()

    // Click close button
    const closeButton = page.locator('[aria-label="Close"]').first()
    await closeButton.click()

    // Verify drawer is hidden
    await expect(drawer).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Legacy Redirect', () => {
  test('should redirect old /requests/[id] URLs to modal view', async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`)

    try {
      await page.fill('input[type="email"]', TEST_EMAIL, { timeout: 5000 })
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
    } catch (e) {
      console.log('Login flow skipped or failed:', e)
    }

    // Get a valid request ID first
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')

    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    await page.waitForFunction(() => window.location.search.includes('id='))
    const urlWithId = page.url()
    const idMatch = urlWithId.match(/id=([^&]+)/)

    if (!idMatch) {
      test.skip()
      return
    }

    const requestId = idMatch[1]

    // Navigate to old URL format
    await page.goto(`${PRODUCTION_URL}/requests/${requestId}`)

    // Should redirect to new format
    await page.waitForURL(`**/requests?id=${requestId}`, { timeout: 10000 })

    // Modal should be visible
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
  })
})
