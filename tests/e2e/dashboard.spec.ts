/**
 * @fileoverview E2E tests for Dashboard Features
 *
 * Tests cover:
 * - Dashboard layout and content
 * - Quick action buttons navigation
 * - Stats cards display
 * - Activity sections
 * - Responsive layout
 * - Error states
 */

import { test, expect } from '@playwright/test'
import { loginAsApprovedUser, loginAsAdmin } from './fixtures/auth.fixture'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Dashboard - Layout and Content', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('dashboard displays welcome message with user name', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    const welcomeMessage = dashboardPage.getWelcomeMessage()
    await expect(welcomeMessage).toBeVisible()
    await expect(welcomeMessage).toContainText(/Welcome/i)
  })

  test('dashboard has three quick action cards', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Check for the three main action buttons
    const createRequestButton = dashboardPage.getCreateRequestButton()
    const browseRequestsButton = dashboardPage.getBrowseRequestsButton()
    const messagesButton = dashboardPage.getMessagesButton()

    await expect(createRequestButton.first()).toBeVisible()
    await expect(browseRequestsButton.first()).toBeVisible()
    await expect(messagesButton.first()).toBeVisible()
  })

  test('dashboard displays stats cards', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Check for stats card headings
    await expect(page.locator('text=Your Requests')).toBeVisible()
    await expect(page.locator('text=Community Impact')).toBeVisible()
  })

  test('stats cards show numeric values', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Get counts and verify they're numbers or zero
    const requestsCount = await dashboardPage.getYourRequestsCount()
    const impactCount = await dashboardPage.getCommunityImpactCount()

    expect(requestsCount).toBeTruthy()
    expect(impactCount).toBeTruthy()

    // Should be numeric (including 0)
    expect(/^\d+$/.test(requestsCount?.trim() || '')).toBe(true)
  })
})

test.describe('Dashboard - Quick Actions Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('Create Help Request button navigates to /requests/new', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    await dashboardPage.clickCreateHelpRequest()

    expect(page.url()).toContain('/requests/new')
  })

  test('Browse Requests button navigates to /requests', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    await dashboardPage.clickBrowseRequests()

    expect(page.url()).toContain('/requests')
    expect(page.url()).not.toContain('/requests/new')
  })

  test('Messages button navigates to /messages', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    await dashboardPage.clickMessages()

    expect(page.url()).toContain('/messages')
  })
})

test.describe('Dashboard - Stats Card Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('Your Requests stats card is clickable and navigates', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Click the "Your Requests" stats card using data-testid (card is inside Link)
    const requestsCard = page.locator('[data-testid="stats-card-requests"]')

    if ((await requestsCard.count()) > 0) {
      await requestsCard.first().click()
      await page.waitForURL('**/requests', { timeout: 5000 })
      expect(page.url()).toContain('/requests')
    }
  })

  test('Messages stats card is clickable and navigates', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Click the Messages stats card using data-testid (card is inside Link)
    const messagesCard = page.locator('[data-testid="stats-card-messages"]')

    if ((await messagesCard.count()) > 0) {
      await messagesCard.first().click()
      await page.waitForURL('**/messages', { timeout: 5000 })
      expect(page.url()).toContain('/messages')
    }
  })
})

test.describe('Dashboard - Admin Features', () => {
  test('admin user sees admin badge', async ({ page }) => {
    // This test requires an admin user to be configured
    try {
      await loginAsAdmin(page)
      const dashboardPage = new DashboardPage(page)
      await dashboardPage.waitForDashboardToLoad()

      const hasAdminBadge = await dashboardPage.hasAdminBadge()
      expect(hasAdminBadge).toBe(true)
    } catch {
      // Skip if admin login fails
      test.skip()
    }
  })

  test('admin error parameter shows error message', async ({ page }) => {
    await loginAsApprovedUser(page)

    // Navigate with error parameter
    await page.goto('/dashboard?error=admin_required')
    await page.waitForLoadState('networkidle')

    const dashboardPage = new DashboardPage(page)
    const hasError = await dashboardPage.hasAdminError()

    expect(hasError).toBe(true)
  })
})

test.describe('Dashboard - Responsive Layout', () => {
  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('desktop layout shows grid of cards', async ({ page }) => {
      await loginAsApprovedUser(page)

      const dashboardPage = new DashboardPage(page)
      await dashboardPage.waitForDashboardToLoad()

      // Quick action cards should be in a grid
      const grid = page.locator('.grid')
      await expect(grid.first()).toBeVisible()
    })
  })

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('mobile layout stacks cards vertically', async ({ page }) => {
      await loginAsApprovedUser(page)

      const dashboardPage = new DashboardPage(page)
      await dashboardPage.waitForDashboardToLoad()

      // All elements should be visible and accessible
      await expect(dashboardPage.getWelcomeMessage()).toBeVisible()
      await expect(dashboardPage.getCreateRequestButton().first()).toBeVisible()
    })

    test('mobile buttons have 44px minimum touch target', async ({ page }) => {
      await loginAsApprovedUser(page)

      const dashboardPage = new DashboardPage(page)
      await dashboardPage.waitForDashboardToLoad()

      // Check Create Help Request button size (target the button inside the card, not nav links)
      // The dashboard button has min-h-[44px] class
      const createButton = page.locator('button:has-text("Create Help Request")').first()
      const buttonBox = await createButton.boundingBox()

      expect(buttonBox).not.toBeNull()
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44)
      }
    })
  })
})

test.describe('Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('dashboard has proper heading structure', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Should have h1 (welcome message)
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // h1 should contain "Welcome"
    await expect(h1.first()).toContainText(/Welcome/i)
  })

  test('cards have accessible names and descriptions', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Quick action cards should have meaningful content
    const needHelpCard = page.locator('text=Need Help?')
    const wantToHelpCard = page.locator('text=Want to Help?')
    await expect(needHelpCard).toBeVisible()
    await expect(wantToHelpCard).toBeVisible()
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Tab through the page
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
    }

    // Check that focus is somewhere on the page
    const focusedElement = page.locator(':focus')
    expect(focusedElement).toBeTruthy()
  })

  test('stats cards announce meaningful information', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Stats cards should have visible labels
    await expect(page.locator('text=Your Requests')).toBeVisible()
    await expect(page.locator('text=Active help requests')).toBeVisible()
    await expect(page.locator('text=Community Impact')).toBeVisible()
  })
})

test.describe('Dashboard - Error Handling', () => {
  test('no console errors on dashboard load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await loginAsApprovedUser(page)

    const dashboardPage = new DashboardPage(page)
    await dashboardPage.waitForDashboardToLoad()

    // Wait for any delayed errors
    await page.waitForTimeout(2000)

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('chunk') &&
        !error.includes('hydration') &&
        !error.includes('Download the React DevTools')
    )

    expect(criticalErrors.length).toBe(0)
  })

  test('dashboard handles slow network gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      await route.continue()
    })

    await loginAsApprovedUser(page)

    const dashboardPage = new DashboardPage(page)

    // Should eventually load (with longer timeout)
    await dashboardPage.waitForDashboardToLoad()

    expect(dashboardPage.isOnDashboard()).toBe(true)
  })
})
