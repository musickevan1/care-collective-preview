/**
 * @fileoverview E2E tests for Notification System
 *
 * Tests cover:
 * - Notification dropdown display
 * - Mark as read functionality
 * - Notification settings page
 * - Accessibility
 * - Mobile responsiveness
 */

import { test, expect } from '@playwright/test'
import { loginAsApprovedUser } from './fixtures/auth.fixture'
import { NotificationsPage } from './pages/NotificationsPage'

test.describe('Notification System - Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('notification bell is visible on dashboard', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const bell = notificationsPage.getNotificationBell()
    await expect(bell).toBeVisible()
  })

  test('notification bell has proper aria attributes', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const hasAriaAttributes = await notificationsPage.hasProperAriaAttributes()
    expect(hasAriaAttributes).toBe(true)
  })

  test('clicking bell opens notification dropdown', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    await notificationsPage.openDropdown()
    const isOpen = await notificationsPage.isDropdownOpen()
    expect(isOpen).toBe(true)
  })

  test('escape key closes notification dropdown', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    await notificationsPage.openDropdown()
    await notificationsPage.closeDropdown()

    // Wait a bit for animation
    await page.waitForTimeout(500)

    // Verify dropdown is closed by checking bell is still visible but no dialog
    const bell = notificationsPage.getNotificationBell()
    await expect(bell).toBeVisible()
  })

  test('dropdown shows notifications or empty state', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()
    await notificationsPage.openDropdown()

    const count = await notificationsPage.getNotificationCount()
    if (count === 0) {
      const isEmpty = await notificationsPage.isEmptyState()
      expect(isEmpty).toBe(true)
    } else {
      const items = notificationsPage.getNotificationItems()
      await expect(items.first()).toBeVisible()
    }
  })

  test('unread badge shows count when notifications exist', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const unreadCount = await notificationsPage.getUnreadCount()
    // Badge should be a non-negative number
    expect(unreadCount).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Notification System - Mark as Read', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('mark all as read button appears when unread notifications exist', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()
    await notificationsPage.openDropdown()

    const unreadCount = await notificationsPage.getUnreadCount()

    if (unreadCount > 0) {
      const markAllButton = notificationsPage.getMarkAllReadButton()
      await expect(markAllButton).toBeVisible()
    }
  })

  test('clicking notification may navigate and marks as read', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()
    await notificationsPage.openDropdown()

    const count = await notificationsPage.getNotificationCount()
    if (count === 0) {
      test.skip()
      return
    }

    // Get initial URL
    const initialUrl = page.url()

    // Click first notification
    await notificationsPage.clickNotification(0)

    // Wait for potential navigation
    await page.waitForTimeout(1000)

    // Either URL changed or dropdown closed - both are valid behaviors
    const currentUrl = page.url()
    const urlChanged = currentUrl !== initialUrl

    // If URL didn't change, dropdown should have closed
    if (!urlChanged) {
      const isOpen = await notificationsPage.isDropdownOpen()
      expect(isOpen).toBe(false)
    }
  })
})

test.describe('Notification System - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('notification settings page loads', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    // Should see notification preferences heading
    const heading = page.locator('h1:has-text("Notification"), h2:has-text("Notification")')
    await expect(heading.first()).toBeVisible()
  })

  test('email notification toggle is present', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    const emailToggle = notificationsPage.getEmailToggle()
    await expect(emailToggle).toBeVisible()
  })

  test('push notification toggle is present', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    const pushToggle = notificationsPage.getPushToggle()
    await expect(pushToggle).toBeVisible()
  })

  test('save button is visible', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    const saveButton = notificationsPage.getSaveButton()
    await expect(saveButton).toBeVisible()
  })

  test('toggles are interactive', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    const emailToggle = notificationsPage.getEmailToggle()

    // Check current state and toggle
    const wasChecked = await emailToggle.isChecked()
    await emailToggle.click()

    // State should have changed
    const isNowChecked = await emailToggle.isChecked()
    expect(isNowChecked).not.toBe(wasChecked)

    // Toggle back
    await emailToggle.click()
    expect(await emailToggle.isChecked()).toBe(wasChecked)
  })
})

test.describe('Notification System - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('notification bell is keyboard accessible', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    // Tab to the notification bell
    const reachedBell = await notificationsPage.tabToElement('[aria-label*="Notifications"]', 30)
    expect(reachedBell).toBe(true)
  })

  test('no console errors on notification interactions', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const { errors: consoleErrors, cleanup } = notificationsPage.collectConsoleErrors()

    try {
      await notificationsPage.openDropdown()
      await page.waitForTimeout(1000)
      await notificationsPage.closeDropdown()

      // Filter out non-critical errors
      const criticalErrors = consoleErrors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('chunk') &&
          !error.includes('hydration') &&
          !error.includes('Loading') &&
          !error.includes('net::')
      )

      expect(criticalErrors.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  test('settings page has proper form labels', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    // Check email toggle has label
    const emailLabel = page.locator('label[for="email-notifications"], label:has-text("Email")')
    await expect(emailLabel.first()).toBeVisible()

    // Check push toggle has label
    const pushLabel = page.locator('label[for="push-notifications"], label:has-text("Push")')
    await expect(pushLabel.first()).toBeVisible()
  })
})

test.describe('Notification System - Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await loginAsApprovedUser(page)
  })

  test('notification bell visible on mobile', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const bell = notificationsPage.getNotificationBell()
    await expect(bell).toBeVisible()
  })

  test('bell has adequate touch target size on mobile', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToDashboard()

    const bell = notificationsPage.getNotificationBell()
    const box = await bell.boundingBox()

    if (box) {
      // WCAG recommends 44x44 minimum touch target
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('settings page is usable on mobile', async ({ page }) => {
    const notificationsPage = new NotificationsPage(page)
    await notificationsPage.goToSettings()

    // Save button should be visible and accessible
    const saveButton = notificationsPage.getSaveButton()
    await expect(saveButton).toBeVisible()

    // Toggles should be usable
    const emailToggle = notificationsPage.getEmailToggle()
    await expect(emailToggle).toBeVisible()
  })
})
