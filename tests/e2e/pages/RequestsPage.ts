/**
 * @fileoverview Page object for Help Requests pages
 *
 * Encapsulates interactions with /requests, /requests/new, and request modals.
 */

import { Page, expect, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { selectors } from '../selectors'

export interface RequestFormData {
  title: string
  description?: string
  category?: string
  urgency?: 'normal' | 'urgent' | 'critical'
  locationOverride?: string
  exchangeOffer?: string
}

export interface FilterOptions {
  status?: 'open' | 'in_progress' | 'closed'
  category?: string
  urgency?: 'normal' | 'urgent' | 'critical'
  search?: string
}

export class RequestsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the requests list page
   */
  async goto(): Promise<void> {
    await this.page.goto('/requests')
    await this.waitForNetworkIdle()
  }

  /**
   * Navigate to create request page
   */
  async gotoCreate(): Promise<void> {
    await this.page.goto('/requests/new')
    await this.waitForNetworkIdle()
  }

  /**
   * Get all visible request cards
   */
  getRequestCards(): Locator {
    return this.page.locator(selectors.requests.card)
  }

  /**
   * Get count of visible request cards
   */
  async getRequestCount(): Promise<number> {
    return this.getRequestCards().count()
  }

  /**
   * Click a request card to open the detail modal
   */
  async openRequestModal(index: number = 0): Promise<void> {
    const cards = this.getRequestCards()
    await cards.nth(index).click()

    // Wait for URL to update with ID parameter
    await this.page.waitForURL(/\?id=/, { timeout: 5000 })

    // Wait for modal or drawer to appear
    const modal = this.page.locator('[role="dialog"], [vaul-drawer]')
    await expect(modal.first()).toBeVisible({ timeout: 5000 })
  }

  /**
   * Get the request detail modal/drawer
   */
  getModal(): Locator {
    return this.page.locator(selectors.requests.modal)
  }

  /**
   * Get the drawer (mobile view)
   */
  getDrawer(): Locator {
    return this.page.locator(selectors.requests.drawer)
  }

  /**
   * Check if modal or drawer is visible
   */
  async isModalVisible(): Promise<boolean> {
    const modal = this.getModal()
    const drawer = this.getDrawer()

    return (await modal.isVisible()) || (await drawer.isVisible())
  }

  /**
   * Close the modal using the close button
   */
  async closeModal(): Promise<void> {
    const closeButton = this.page.locator(selectors.requests.closeButton).first()
    await closeButton.click()

    // Wait for modal to be hidden
    await expect(this.getModal()).not.toBeVisible({ timeout: 3000 })
  }

  /**
   * Close modal using ESC key
   */
  async closeModalWithEsc(): Promise<void> {
    await this.page.keyboard.press('Escape')
    await expect(this.getModal()).not.toBeVisible({ timeout: 3000 })
  }

  /**
   * Click the "Offer Help" button in the modal (not the card buttons)
   */
  async clickOfferHelp(): Promise<void> {
    // Target the "Offer Help" button inside the modal only, excluding "View Details & Offer Help" card buttons
    const modal = this.page.locator('[role="dialog"], [vaul-drawer]').first()
    const offerHelpButton = modal.locator('button:has-text("Offer Help")').first()
    await expect(offerHelpButton).toBeVisible({ timeout: 5000 })
    await offerHelpButton.click()
  }

  /**
   * Fill and submit the offer help dialog
   */
  async submitOfferHelp(message: string): Promise<void> {
    await this.clickOfferHelp()

    // Wait for the offer dialog to appear (it's a nested dialog)
    const offerDialog = this.page.locator(selectors.offerHelp.dialog).last()
    await expect(offerDialog).toBeVisible({ timeout: 5000 })

    // Fill the message
    const messageInput = offerDialog.locator(selectors.offerHelp.messageInput).first()
    await expect(messageInput).toBeVisible({ timeout: 5000 })
    await messageInput.fill(message)

    // Submit
    const sendButton = offerDialog.locator(selectors.offerHelp.sendButton)
    await sendButton.click()
  }

  /**
   * Apply filters to the request list
   */
  async applyFilters(options: FilterOptions): Promise<void> {
    if (options.search) {
      const searchInput = this.page.locator(selectors.requests.searchInput)
      await searchInput.fill(options.search)
    }

    if (options.status) {
      const statusFilter = this.page.locator(selectors.requests.statusFilter)
      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption(options.status)
      }
    }

    if (options.category) {
      const categoryFilter = this.page.locator(selectors.requests.categoryFilter)
      if (await categoryFilter.count() > 0) {
        await categoryFilter.selectOption(options.category)
      }
    }

    if (options.urgency) {
      const urgencyFilter = this.page.locator(selectors.requests.urgencyFilter)
      if (await urgencyFilter.count() > 0) {
        await urgencyFilter.selectOption(options.urgency)
      }
    }

    // Wait for filters to apply
    await this.waitForNetworkIdle()
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    const searchInput = this.page.locator(selectors.requests.searchInput)
    if (await searchInput.count() > 0) {
      await searchInput.clear()
    }

    // Reset selects to default (usually first option)
    const statusFilter = this.page.locator(selectors.requests.statusFilter)
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('')
    }

    await this.waitForNetworkIdle()
  }

  /**
   * Fill and submit the create request form
   */
  async createRequest(data: RequestFormData): Promise<void> {
    // Fill title (required)
    const titleInput = this.page.locator(selectors.createRequest.titleInput)
    await titleInput.fill(data.title)

    // Fill description (optional)
    if (data.description) {
      const descriptionInput = this.page.locator(selectors.createRequest.descriptionInput)
      await descriptionInput.fill(data.description)
    }

    // Select category
    if (data.category) {
      const categorySelect = this.page.locator(selectors.createRequest.categorySelect)
      if (await categorySelect.count() > 0) {
        await categorySelect.click()
        // Try to click the option
        const option = this.page.locator(`text=${data.category}`)
        await option.first().click()
      }
    }

    // Select urgency
    if (data.urgency) {
      const urgencySelect = this.page.locator(selectors.createRequest.urgencySelect)
      if (await urgencySelect.count() > 0) {
        await urgencySelect.click()
        const option = this.page.locator(`text=${data.urgency}`)
        await option.first().click()
      }
    }

    // Fill location override (optional)
    if (data.locationOverride) {
      const locationInput = this.page.locator(selectors.createRequest.locationInput)
      if (await locationInput.count() > 0) {
        await locationInput.fill(data.locationOverride)
      }
    }

    // Submit form
    const submitButton = this.page.locator(selectors.createRequest.submitButton)
    await submitButton.click()
  }

  /**
   * Get visible validation errors on the form
   */
  async getFormErrors(): Promise<string[]> {
    const errors = this.page.locator(selectors.createRequest.errorMessage)
    const count = await errors.count()
    const errorTexts: string[] = []

    for (let i = 0; i < count; i++) {
      const text = await errors.nth(i).textContent()
      if (text) errorTexts.push(text)
    }

    return errorTexts
  }

  /**
   * Check if on requests list page
   */
  isOnRequestsList(): boolean {
    return this.urlMatches('/requests') && !this.urlMatches('/requests/new')
  }

  /**
   * Check if on create request page
   */
  isOnCreateRequest(): boolean {
    return this.urlMatches('/requests/new')
  }

  /**
   * Extract request ID from current URL
   */
  getRequestIdFromUrl(): string | null {
    const url = new URL(this.page.url())
    return url.searchParams.get('id')
  }
}
