/**
 * @fileoverview Conversation fixtures for E2E tests
 *
 * Provides helpers to create test conversations and messages
 * so messaging tests don't skip due to empty state.
 */

import { Page } from '@playwright/test'
import { testCredentials, loginAsUser } from './auth.fixture'

/**
 * Creates a test conversation by having User B offer help on User A's request
 * Uses the app's actual UI flow to ensure realistic test conditions.
 *
 * @param page - Playwright page object (must be logged out initially)
 * @returns The conversation ID if successfully created
 */
export async function createTestConversation(page: Page): Promise<string | null> {
  // Step 1: Login as User A and create a help request
  await loginAsUser(page, testCredentials.userA.email, testCredentials.userA.password)
  await page.waitForURL('**/dashboard', { timeout: 20000 })

  // Navigate to create request
  await page.goto('/requests/new')
  await page.waitForLoadState('networkidle')

  // Fill the form
  const testTitle = `E2E Test Request for Messaging - ${Date.now()}`
  await page.locator('#title').fill(testTitle)
  await page.locator('#category').selectOption('groceries-meals')
  await page.locator('#description').fill('This is a test request for E2E messaging tests')

  // Submit
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(dashboard|requests)/, { timeout: 15000 })

  // Step 2: Logout and login as User B
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Clear any existing session
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
  await page.waitForLoadState('networkidle')

  await loginAsUser(page, testCredentials.userB.email, testCredentials.userB.password)
  await page.waitForURL('**/dashboard', { timeout: 20000 })

  // Step 3: Find and offer help on the request
  await page.goto('/requests')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Wait for request cards to load

  // Look for the test request we just created
  const requestCard = page.locator(`text=${testTitle}`).first()

  if (!(await requestCard.isVisible({ timeout: 10000 }).catch(() => false))) {
    console.log('Test request not found in list')
    return null
  }

  // Click the request to open modal
  await requestCard.click()
  await page.waitForURL(/\?id=/, { timeout: 5000 })

  // Wait for modal
  await page.locator('[role="dialog"], [vaul-drawer]').first().waitFor({ state: 'visible', timeout: 5000 })

  // Click "Offer Help" button inside the modal
  const modal = page.locator('[role="dialog"], [vaul-drawer]').first()
  const offerHelpButton = modal.locator('button:has-text("Offer Help")').first()

  if (!(await offerHelpButton.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('Offer Help button not found')
    return null
  }

  await offerHelpButton.click()

  // Wait for offer dialog
  const offerDialog = page.locator('[role="dialog"]').last()
  await offerDialog.waitFor({ state: 'visible', timeout: 5000 })

  // Fill the message
  const messageInput = offerDialog.locator('textarea, input[type="text"]').first()
  await messageInput.fill('E2E Test: I can help with this!')

  // Submit the offer
  const sendButton = offerDialog.locator('button:has-text("Send"), button:has-text("Start Conversation")')
  await sendButton.click()

  // Wait for success and redirect to messages
  await page.waitForURL(/\/messages/, { timeout: 30000 })

  // Extract conversation ID from URL
  const url = new URL(page.url())
  const conversationId = url.searchParams.get('conversation')

  return conversationId
}

/**
 * Check if test users have any existing conversations
 */
export async function hasExistingConversations(page: Page): Promise<boolean> {
  await page.goto('/messages')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Check for conversation items or empty state
  const conversationItems = page.locator('[data-testid="conversation-item"], [role="listitem"]')
  const count = await conversationItems.count()

  return count > 0
}

/**
 * Ensure test conversations exist before running messaging tests
 * Creates a conversation if none exist.
 */
export async function ensureTestConversationsExist(page: Page): Promise<void> {
  // First check if conversations already exist
  await loginAsUser(page, testCredentials.userA.email, testCredentials.userA.password)
  await page.waitForURL('**/dashboard', { timeout: 20000 })

  const hasConversations = await hasExistingConversations(page)

  if (!hasConversations) {
    console.log('No existing conversations found, creating test conversation...')

    // Logout first
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()

    // Create a test conversation
    const conversationId = await createTestConversation(page)

    if (conversationId) {
      console.log(`Created test conversation: ${conversationId}`)
    } else {
      console.log('Failed to create test conversation')
    }
  } else {
    console.log('Test conversations already exist')
  }
}
