/**
 * @fileoverview Page object for Notification system E2E tests
 *
 * Provides methods for interacting with notification dropdown and settings.
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Get the notification bell button
   */
  getNotificationBell(): Locator {
    return this.page.locator('[aria-label*="Notifications"], [aria-label*="notifications"]')
  }

  /**
   * Get unread count badge
   */
  getUnreadBadge(): Locator {
    return this.page.locator('[aria-label*="Notifications"] .bg-red-500, [aria-label*="Notifications"] .bg-red-600')
  }

  /**
   * Get unread count number
   */
  async getUnreadCount(): Promise<number> {
    const badge = this.getUnreadBadge()
    if (!(await badge.isVisible())) {
      return 0
    }
    const text = await badge.textContent()
    return parseInt(text || '0', 10)
  }

  /**
   * Open notification dropdown
   */
  async openDropdown(): Promise<void> {
    const bell = this.getNotificationBell()
    await bell.click()
    // Wait for dropdown to appear
    await this.page.waitForTimeout(500)
  }

  /**
   * Close notification dropdown
   */
  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape')
    await this.page.waitForTimeout(300)
  }

  /**
   * Check if dropdown is open
   */
  async isDropdownOpen(): Promise<boolean> {
    // Check for common dropdown indicators
    const panels = await this.page.locator('[role="dialog"], [role="menu"], .notification-dropdown').count()
    return panels > 0
  }

  /**
   * Get notification items
   */
  getNotificationItems(): Locator {
    return this.page.locator('.notification-item, [data-notification-id], [role="listitem"]')
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    return this.getNotificationItems().count()
  }

  /**
   * Click a notification item
   */
  async clickNotification(index: number): Promise<void> {
    await this.getNotificationItems().nth(index).click()
  }

  /**
   * Get "Mark all read" button
   */
  getMarkAllReadButton(): Locator {
    return this.page.locator('button[aria-label*="Mark all as read"], button:has-text("Mark all read")')
  }

  /**
   * Click mark all as read
   */
  async markAllAsRead(): Promise<void> {
    const button = this.getMarkAllReadButton()
    if (await button.isVisible()) {
      await button.click()
      await this.page.waitForTimeout(500)
    }
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyState(): Promise<boolean> {
    const emptyIndicators = await this.page.locator('text=/no notifications/i, text=/all caught up/i').count()
    return emptyIndicators > 0
  }

  /**
   * Get "Load more" button
   */
  getLoadMoreButton(): Locator {
    return this.page.locator('button:has-text("Load more"), button:has-text("Show more")')
  }

  /**
   * Navigate to notification settings
   */
  async goToSettings(): Promise<void> {
    await this.page.goto('/settings/notifications')
    await this.waitForNetworkIdle()
  }

  /**
   * Navigate to dashboard (where notifications are accessible)
   */
  async goToDashboard(): Promise<void> {
    await this.page.goto('/dashboard')
    await this.waitForNetworkIdle()
  }

  /**
   * Get email notification toggle
   */
  getEmailToggle(): Locator {
    return this.page.locator('#email-notifications, [name="email_notifications"]')
  }

  /**
   * Get push notification toggle
   */
  getPushToggle(): Locator {
    return this.page.locator('#push-notifications, [name="push_notifications"]')
  }

  /**
   * Get save preferences button
   */
  getSaveButton(): Locator {
    return this.page.locator('button:has-text("Save Preferences"), button:has-text("Save")')
  }

  /**
   * Check if notification bell has proper aria attributes
   */
  async hasProperAriaAttributes(): Promise<boolean> {
    const bell = this.getNotificationBell()
    const ariaLabel = await bell.getAttribute('aria-label')
    return !!ariaLabel && ariaLabel.toLowerCase().includes('notification')
  }
}
