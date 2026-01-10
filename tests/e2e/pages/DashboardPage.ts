/**
 * @fileoverview Page object for Dashboard page
 *
 * Encapsulates interactions with /dashboard.
 */

import { Page, expect, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { selectors } from '../selectors'

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard')
    await this.waitForNetworkIdle()
  }

  /**
   * Get the welcome message heading
   */
  getWelcomeMessage(): Locator {
    return this.page.locator('h1:has-text("Welcome")')
  }

  /**
   * Get the welcome message text
   */
  async getWelcomeText(): Promise<string | null> {
    const heading = this.getWelcomeMessage()
    return heading.textContent()
  }

  /**
   * Check if admin badge is displayed
   */
  async hasAdminBadge(): Promise<boolean> {
    const adminBadge = this.page.locator('h1:has-text("Welcome") >> text=Admin')
    return adminBadge.isVisible()
  }

  /**
   * Get all quick action cards
   */
  getQuickActionCards(): Locator {
    // Quick action cards are the first grid of cards after welcome
    return this.page.locator('.grid >> .hover\\:shadow-md').first()
  }

  /**
   * Get the "Create Help Request" button
   */
  getCreateRequestButton(): Locator {
    return this.page.locator(selectors.dashboard.createRequestButton)
  }

  /**
   * Get the "Browse Requests" button
   */
  getBrowseRequestsButton(): Locator {
    return this.page.locator(selectors.dashboard.browseRequestsButton)
  }

  /**
   * Get the "Open Messages" button/link
   */
  getMessagesButton(): Locator {
    return this.page.locator('a[href="/messages"] >> button, a[href="/messages"]')
  }

  /**
   * Click Create Help Request
   */
  async clickCreateHelpRequest(): Promise<void> {
    await this.getCreateRequestButton().first().click()
    await this.page.waitForURL('**/requests/new')
  }

  /**
   * Click Browse Requests
   */
  async clickBrowseRequests(): Promise<void> {
    await this.getBrowseRequestsButton().first().click()
    await this.page.waitForURL('**/requests')
  }

  /**
   * Click Messages
   */
  async clickMessages(): Promise<void> {
    await this.getMessagesButton().first().click()
    await this.page.waitForURL('**/messages')
  }

  /**
   * Get stats cards (Your Requests, Messages, Community Impact)
   */
  getStatsCards(): Locator {
    return this.page.locator(selectors.dashboard.statsCards)
  }

  /**
   * Get the "Your Requests" count
   */
  async getYourRequestsCount(): Promise<string | null> {
    const card = this.page.locator(selectors.dashboard.statsCardRequests)
    const countElement = card.locator('.text-4xl')
    return countElement.textContent()
  }

  /**
   * Get the unread messages count from dashboard
   */
  async getUnreadMessagesCount(): Promise<string | null> {
    const card = this.page.locator(selectors.dashboard.statsCardMessages)
    const countElement = card.locator('.text-4xl')

    if (await countElement.count() > 0) {
      return countElement.first().textContent()
    }
    return null
  }

  /**
   * Get the community impact count
   */
  async getCommunityImpactCount(): Promise<string | null> {
    const card = this.page.locator(selectors.dashboard.statsCardImpact)
    const countElement = card.locator('.text-4xl')
    return countElement.textContent()
  }

  /**
   * Get "Your Activity" section items
   */
  getYourActivityItems(): Locator {
    // Activity section shows user's own requests
    return this.page.locator('h2:has-text("Your Activity")').locator('..').locator('li, [role="listitem"]')
  }

  /**
   * Get "Recent Community Activity" section items
   */
  getCommunityActivityItems(): Locator {
    return this.page.locator('h2:has-text("Community")').locator('..').locator('li, [role="listitem"]')
  }

  /**
   * Check if error message is displayed
   */
  async hasAdminError(): Promise<boolean> {
    const errorMessage = this.page.locator('text=Access Denied')
    return errorMessage.isVisible()
  }

  /**
   * Check if on dashboard page
   */
  isOnDashboard(): boolean {
    return this.urlMatches('/dashboard')
  }

  /**
   * Wait for dashboard content to load
   */
  async waitForDashboardToLoad(): Promise<void> {
    await expect(this.getWelcomeMessage()).toBeVisible({ timeout: 10000 })
  }

  /**
   * Check if unread badge is shown on messages card
   */
  async hasUnreadBadge(): Promise<boolean> {
    // Look for unread badge in Messages quick action card
    const badge = this.page.locator('text=Messages >> .. >> .bg-destructive, [class*="Badge"]')
    return badge.isVisible()
  }
}
