/**
 * @fileoverview Page object for Messages pages
 *
 * Encapsulates interactions with /messages and conversation threads.
 */

import { Page, expect, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { selectors } from '../selectors'

export class MessagesPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the messages page
   */
  async goto(): Promise<void> {
    await this.page.goto('/messages')
    await this.waitForNetworkIdle()
  }

  /**
   * Get the conversation list container
   */
  getConversationList(): Locator {
    return this.page.locator(selectors.messages.conversationList)
  }

  /**
   * Get all conversation items
   */
  getConversationItems(): Locator {
    return this.page.locator(selectors.messages.conversationItem)
  }

  /**
   * Get count of conversations
   */
  async getConversationCount(): Promise<number> {
    return this.getConversationItems().count()
  }

  /**
   * Select a conversation by index
   */
  async selectConversation(index: number = 0): Promise<void> {
    const conversations = this.getConversationItems()
    await conversations.nth(index).click()

    // Wait for thread to load
    await this.page.waitForTimeout(500)
  }

  /**
   * Get the message thread container
   */
  getMessageThread(): Locator {
    return this.page.locator(selectors.messages.messageThread)
  }

  /**
   * Get the message input field
   */
  getMessageInput(): Locator {
    return this.page.locator(selectors.messages.messageInput)
  }

  /**
   * Get the send button
   */
  getSendButton(): Locator {
    return this.page.locator(selectors.messages.sendButton)
  }

  /**
   * Send a message in the current conversation
   */
  async sendMessage(content: string): Promise<void> {
    const messageInput = this.getMessageInput()
    await expect(messageInput).toBeVisible({ timeout: 5000 })

    await messageInput.fill(content)

    const sendButton = this.getSendButton()
    await sendButton.click()

    // Wait for message to be sent
    await this.page.waitForTimeout(1000)
  }

  /**
   * Check if message input is visible (indicates conversation is selected)
   */
  async isMessageInputVisible(): Promise<boolean> {
    const messageInput = this.getMessageInput()
    return messageInput.isVisible()
  }

  /**
   * Get the back button (mobile navigation)
   */
  getBackButton(): Locator {
    return this.page.locator(selectors.messages.backButton)
  }

  /**
   * Click back button to return to conversation list (mobile)
   */
  async goBackToConversations(): Promise<void> {
    const backButton = this.getBackButton()
    if (await backButton.isVisible()) {
      await backButton.click()
      await this.page.waitForTimeout(300)
    }
  }

  /**
   * Get unread badge element
   */
  getUnreadBadge(): Locator {
    return this.page.locator(selectors.messages.unreadBadge)
  }

  /**
   * Check if there are any unread messages indicated
   */
  async hasUnreadMessages(): Promise<boolean> {
    const badge = this.getUnreadBadge()
    return badge.isVisible()
  }

  /**
   * Check if on messages page
   */
  isOnMessagesPage(): boolean {
    return this.urlMatches('/messages')
  }

  /**
   * Wait for conversations to load
   */
  async waitForConversationsToLoad(): Promise<void> {
    // Wait for either conversations to appear or empty state
    await this.page.waitForTimeout(2000)
  }

  /**
   * Check if the messages page shows empty state
   */
  async isEmptyState(): Promise<boolean> {
    const count = await this.getConversationCount()
    return count === 0
  }

  /**
   * Get message thread content
   */
  async getMessageThreadContent(): Promise<string | null> {
    const thread = this.getMessageThread()
    if (await thread.isVisible()) {
      return thread.textContent()
    }
    return null
  }

  /**
   * Verify a message appears in the thread
   */
  async messageAppearsInThread(messageText: string): Promise<boolean> {
    const thread = this.getMessageThread()
    try {
      await expect(thread).toContainText(messageText, { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  // ===== Tab Navigation Methods =====

  /**
   * Get the Active tab button
   */
  getActiveTab(): Locator {
    return this.page.locator(selectors.messages.activeTab)
  }

  /**
   * Get the Pending tab button
   */
  getPendingTab(): Locator {
    return this.page.locator(selectors.messages.pendingTab)
  }

  /**
   * Click the Active tab
   */
  async clickActiveTab(): Promise<void> {
    await this.getActiveTab().click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Click the Pending tab
   */
  async clickPendingTab(): Promise<void> {
    await this.getPendingTab().click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Get the count from "Active (N)" tab text
   */
  async getActiveTabCount(): Promise<number> {
    const text = await this.getActiveTab().textContent()
    const match = text?.match(/Active \((\d+)\)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Get the count from "Pending (N)" tab text
   */
  async getPendingTabCount(): Promise<number> {
    const text = await this.getPendingTab().textContent()
    const match = text?.match(/Pending \((\d+)\)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Check if Active tab is selected
   */
  async isActiveTabSelected(): Promise<boolean> {
    const selected = await this.getActiveTab().getAttribute('aria-selected')
    return selected === 'true'
  }

  /**
   * Check if Pending tab is selected
   */
  async isPendingTabSelected(): Promise<boolean> {
    const selected = await this.getPendingTab().getAttribute('aria-selected')
    return selected === 'true'
  }

  // ===== CARE Team Welcome Methods =====

  /**
   * Get the CARE Team conversation item
   */
  getCareTeamConversation(): Locator {
    return this.page.locator(selectors.messages.careTeamConversation)
  }

  /**
   * Click the CARE Team conversation
   */
  async selectCareTeamConversation(): Promise<void> {
    await this.getCareTeamConversation().click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Check if welcome message is visible
   */
  async isWelcomeMessageVisible(): Promise<boolean> {
    return this.page.locator(selectors.messages.welcomeMessage).isVisible()
  }

  // ===== Pending Offers Methods =====

  /**
   * Get all pending offer cards
   */
  getPendingOfferCards(): Locator {
    return this.page.locator(selectors.messages.pendingOfferCard)
  }

  /**
   * Get a specific pending offer card by index
   */
  getPendingOfferCard(index: number = 0): Locator {
    return this.getPendingOfferCards().nth(index)
  }

  /**
   * Get the Accept Offer button (first visible one)
   */
  getAcceptOfferButton(): Locator {
    return this.page.locator(selectors.messages.acceptOfferButton)
  }

  /**
   * Click Accept Offer on the first pending offer
   */
  async clickAcceptOffer(index: number = 0): Promise<void> {
    const card = this.getPendingOfferCard(index)
    const acceptButton = card.locator('button:has-text("Accept Offer")')
    await acceptButton.click()
  }

  /**
   * Click Decline on a pending offer
   */
  async clickDeclineOffer(index: number = 0): Promise<void> {
    const card = this.getPendingOfferCard(index)
    const declineButton = card.locator('button:has-text("Decline")')
    await declineButton.click()
  }

  // ===== Viewport Methods =====

  /**
   * Check if send button is visible within the viewport (not cut off)
   */
  async isSendButtonInViewport(): Promise<boolean> {
    const sendButton = this.getSendButton()
    try {
      await expect(sendButton).toBeInViewport({ timeout: 3000 })
      return true
    } catch {
      return false
    }
  }
}
