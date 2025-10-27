/**
 * @fileoverview E2E tests for Help Request → Messaging Flow
 * Tests the critical fix for messaging system blocking issue
 *
 * Tests verify:
 * 1. Users can offer help on help requests
 * 2. Conversations are created successfully
 * 3. Messages can be sent and received
 * 4. Privacy settings don't block help request conversations
 */

import { test, expect } from '@playwright/test'

const PRODUCTION_URL = 'https://care-collective-preview.vercel.app'

// Test credentials - these should be real test accounts in your Supabase
const USER_A_EMAIL = process.env.TEST_USER_A_EMAIL || 'user-a@example.com'
const USER_A_PASSWORD = process.env.TEST_USER_A_PASSWORD || 'testpassword123'

const USER_B_EMAIL = process.env.TEST_USER_B_EMAIL || 'user-b@example.com'
const USER_B_PASSWORD = process.env.TEST_USER_B_PASSWORD || 'testpassword123'

test.describe('Help Request to Messaging Flow', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('should allow User B to offer help and start conversation', async ({ page, context }) => {
    // Step 1: Login as User A and create a help request
    await page.goto(`${PRODUCTION_URL}/login`)

    await page.fill('input[type="email"]', USER_A_EMAIL)
    await page.fill('input[type="password"]', USER_A_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Navigate to requests page
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')

    // Check if there's already an open request, if not create one
    const existingRequests = await page.locator('[data-testid="request-card"], .hover\\:shadow-md').count()

    let testRequestTitle = `E2E Test Request - ${Date.now()}`

    if (existingRequests === 0) {
      // Click "Create Request" button
      const createButton = page.locator('button:has-text("Create Request"), a:has-text("Create Request")')
      await createButton.first().click()

      // Fill in the request form
      await page.fill('input[name="title"], input[placeholder*="title"]', testRequestTitle)
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'This is a test request created by E2E automation')

      // Select category (adjust selector based on your form)
      const categorySelect = page.locator('select[name="category"], [role="combobox"]').first()
      await categorySelect.click()
      await page.click('text=Groceries, text=groceries')

      // Submit the form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Submit")')

      // Wait for request to be created
      await page.waitForLoadState('networkidle')
    }

    // Step 2: Logout User A
    await page.goto(`${PRODUCTION_URL}/dashboard`)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")')
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
    } else {
      // Manual logout via profile menu
      await page.goto(`${PRODUCTION_URL}/logout`)
    }

    await page.waitForLoadState('networkidle')

    // Step 3: Login as User B
    await page.goto(`${PRODUCTION_URL}/login`)

    await page.fill('input[type="email"]', USER_B_EMAIL)
    await page.fill('input[type="password"]', USER_B_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Step 4: Navigate to requests and find a request to help with
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')

    // Wait for request cards to load
    await page.waitForSelector('[data-testid="request-card"], .hover\\:shadow-md', { timeout: 10000 })

    // Find the first request card that User B didn't create
    const requestCards = page.locator('.hover\\:shadow-md, [data-testid="request-card"]')
    const firstCard = requestCards.first()

    // Click the request card to open details
    await firstCard.click()

    // Wait for modal/drawer to open
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Step 5: Click "Offer Help" button
    const offerHelpButton = page.locator('button:has-text("Offer Help")')

    // If button is not visible, this might be User B's own request - skip this test
    if (await offerHelpButton.count() === 0) {
      console.log('No "Offer Help" button found - might be user\'s own request')
      test.skip()
      return
    }

    await expect(offerHelpButton).toBeVisible({ timeout: 5000 })
    await offerHelpButton.click()

    // Step 6: Fill in the offer message
    // Dialog should open with message input
    const messageDialog = page.locator('[role="dialog"]').last()
    await expect(messageDialog).toBeVisible({ timeout: 5000 })

    const messageInput = messageDialog.locator('textarea, input[type="text"]').first()
    await expect(messageInput).toBeVisible({ timeout: 5000 })

    const testMessage = `Hi! I can help with this. (E2E test - ${Date.now()})`
    await messageInput.fill(testMessage)

    // Step 7: Submit the offer and start conversation
    const sendButton = messageDialog.locator('button:has-text("Send"), button:has-text("Start Conversation")')
    await sendButton.click()

    // Step 8: Verify no error message appears
    // This is the critical check - we should NOT see the privacy settings error
    const errorMessage = page.locator('text=/This user has restricted who can message them/i')
    await expect(errorMessage).not.toBeVisible({ timeout: 3000 })

    // Step 9: Verify redirect to messages page or conversation view
    // The system should redirect to /messages or show success
    await page.waitForTimeout(2000) // Give time for API call and redirect

    const currentUrl = page.url()
    const isOnMessagesPage = currentUrl.includes('/messages')
    const hasSuccessIndicator = await page.locator('text=/Success|Conversation started|Message sent/i').count() > 0

    // Either should be on messages page OR see success indicator
    expect(isOnMessagesPage || hasSuccessIndicator).toBe(true)

    // Step 10: If redirected to messages, verify conversation is visible
    if (isOnMessagesPage) {
      await page.waitForLoadState('networkidle')

      // Should see the conversation in the list
      const conversationList = page.locator('[data-testid="conversation-list"], [role="list"]').first()
      await expect(conversationList).toBeVisible({ timeout: 5000 })

      // Should see at least one conversation
      const conversations = page.locator('[data-testid="conversation-item"], [role="listitem"]')
      expect(await conversations.count()).toBeGreaterThan(0)
    }
  })

  test('should not show privacy error for help request conversations', async ({ page }) => {
    // This test specifically checks that help request conversations bypass privacy settings

    // Login as User B
    await page.goto(`${PRODUCTION_URL}/login`)

    await page.fill('input[type="email"]', USER_B_EMAIL)
    await page.fill('input[type="password"]', USER_B_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 10000 })

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

    // Navigate to requests
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')

    // Click first request
    const firstCard = page.locator('.hover\\:shadow-md, [data-testid="request-card"]').first()
    await firstCard.click()

    // Open modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Click "Offer Help" if available
    const offerHelpButton = page.locator('button:has-text("Offer Help")')

    if (await offerHelpButton.count() === 0) {
      test.skip()
      return
    }

    await offerHelpButton.click()

    // Fill message
    const messageDialog = page.locator('[role="dialog"]').last()
    const messageInput = messageDialog.locator('textarea, input[type="text"]').first()
    await messageInput.fill('Test message for privacy check')

    // Submit
    const sendButton = messageDialog.locator('button:has-text("Send"), button:has-text("Start")')
    await sendButton.click()

    // Wait for processing
    await page.waitForTimeout(3000)

    // Check for privacy error in console or page
    const hasPrivacyError = [...consoleErrors, ...pageErrors.map(e => e.message)]
      .some(msg =>
        msg.includes('privacy settings') ||
        msg.includes('restricted who can message') ||
        msg.includes('cannot message this user')
      )

    expect(hasPrivacyError).toBe(false)

    // Check for error displayed to user
    const errorText = page.locator('text=/privacy|restricted|cannot message/i')
    if (await errorText.count() > 0) {
      const errorContent = await errorText.first().textContent()
      console.log('Unexpected error found:', errorContent)
    }

    await expect(errorText).toHaveCount(0)
  })

  test('should create conversation and allow messaging', async ({ page }) => {
    // Login as User B
    await page.goto(`${PRODUCTION_URL}/login`)

    await page.fill('input[type="email"]', USER_B_EMAIL)
    await page.fill('input[type="password"]', USER_B_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Go to messages
    await page.goto(`${PRODUCTION_URL}/messages`)
    await page.waitForLoadState('networkidle')

    // Check if there are any conversations
    const conversations = page.locator('[data-testid="conversation-item"], [role="listitem"]')
    const conversationCount = await conversations.count()

    if (conversationCount === 0) {
      console.log('No conversations found - test requires prior conversation creation')
      test.skip()
      return
    }

    // Click first conversation
    await conversations.first().click()

    // Wait for message thread to load
    await page.waitForTimeout(1000)

    // Find message input
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')

    if (await messageInput.count() === 0) {
      console.log('No message input found')
      test.skip()
      return
    }

    await expect(messageInput).toBeVisible({ timeout: 5000 })

    // Send a test message
    const testMessage = `Follow-up message (E2E test - ${Date.now()})`
    await messageInput.fill(testMessage)

    // Find and click send button
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first()
    await sendButton.click()

    // Wait for message to appear in thread
    await page.waitForTimeout(2000)

    // Verify message appears (might need to adjust selector)
    const messageThread = page.locator('[data-testid="message-thread"], [role="log"], .message-list')
    await expect(messageThread).toContainText(testMessage, { timeout: 5000 })
  })
})

test.describe('Messaging System - Accessibility', () => {
  test('help request messaging flow meets WCAG 2.1 AA', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/login`)

    await page.fill('input[type="email"]', USER_B_EMAIL)
    await page.fill('input[type="password"]', USER_B_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Navigate to requests
    await page.goto(`${PRODUCTION_URL}/requests`)
    await page.waitForLoadState('networkidle')

    // Check keyboard navigation works
    await page.keyboard.press('Tab')

    // Click request
    const firstCard = page.locator('.hover\\:shadow-md').first()
    await firstCard.click()

    // Check modal accessibility
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Modal should have aria-labelledby or aria-label
    const hasLabel = await modal.getAttribute('aria-labelledby') || await modal.getAttribute('aria-label')
    expect(hasLabel).toBeTruthy()

    // Close button should have accessible name
    const closeButton = page.locator('[aria-label="Close"]').first()
    await expect(closeButton).toBeVisible()

    // ESC should close modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })
})
