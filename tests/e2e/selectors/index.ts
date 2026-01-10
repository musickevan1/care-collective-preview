/**
 * @fileoverview Shared selectors for E2E tests
 *
 * Selector Priority (following project conventions):
 * 1. Role-based selectors (most accessible, most resilient)
 * 2. Test IDs (explicit test hooks)
 * 3. Text content (visible to users)
 * 4. CSS selectors (last resort)
 */

export const selectors = {
  // Navigation
  nav: {
    home: 'a[href="/"]',
    dashboard: 'a[href="/dashboard"]',
    requests: 'a[href="/requests"]',
    messages: 'a[href="/messages"]',
    login: 'a[href="/login"]',
    signup: 'a[href="/signup"]',
    logout: 'button:has-text("Sign Out"), button:has-text("Logout")',
  },

  // Auth forms
  auth: {
    emailInput: 'input#email, input[type="email"], input[placeholder*="email" i]',
    passwordInput: 'input#password, input[type="password"], input[placeholder*="password" i]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"].bg-red-50, .text-red-600.bg-red-50, .text-red-500, .text-destructive',
  },

  // Dashboard
  dashboard: {
    welcomeMessage: 'h1:has-text("Welcome")',
    quickActions: '[data-testid="quick-actions"]',
    statsCards: '[data-testid^="stats-card-"]',
    statsCardRequests: '[data-testid="stats-card-requests"]',
    statsCardMessages: '[data-testid="stats-card-messages"]',
    statsCardImpact: '[data-testid="stats-card-impact"]',
    yourActivity: '[data-testid="your-activity"]',
    communityActivity: '[data-testid="community-activity"]',
    createRequestButton: 'button:has-text("Create Help Request"), a:has-text("Create Help Request") button',
    browseRequestsButton: 'button:has-text("Browse Requests"), a:has-text("Browse Requests") button',
    messagesCard: 'a[href="/messages"]',
  },

  // Help Requests
  requests: {
    list: '[data-testid="requests-list"]',
    card: '[data-testid="request-card"], .hover\\:shadow-md',
    filterPanel: '[data-testid="filter-panel"]',
    searchInput: 'input[placeholder*="Search"], input[type="search"]',
    statusFilter: '[data-testid="status-filter"], select[name="status"]',
    categoryFilter: '[data-testid="category-filter"], select[name="category"]',
    urgencyFilter: '[data-testid="urgency-filter"], select[name="urgency"]',
    modal: '[role="dialog"]',
    drawer: '[vaul-drawer]',
    offerHelpButton: 'button:has-text("Offer Help")',
    closeButton: '[aria-label="Close"], button:has-text("Close")',
  },

  // Create Request Form
  createRequest: {
    titleInput: 'input[name="title"]',
    descriptionInput: 'textarea[name="description"]',
    categorySelect: '[data-testid="category-select"], select[name="category"]',
    urgencySelect: '[data-testid="urgency-select"], select[name="urgency"]',
    locationInput: 'input[name="locationOverride"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"], .text-red-500',
  },

  // Messaging
  messages: {
    conversationList: '[data-testid="conversation-list"], [role="list"]',
    conversationItem: '[data-testid="conversation-item"], [role="listitem"]',
    messageThread: '[data-testid="message-thread"], [role="log"]',
    messageInput: 'textarea[placeholder*="message"], input[placeholder*="message"]',
    sendButton: 'button[type="submit"], button:has-text("Send")',
    backButton: '[aria-label="Back"], button:has-text("Back")',
    unreadBadge: '[data-testid="unread-badge"]',
  },

  // Offer Help Dialog
  offerHelp: {
    dialog: '[role="dialog"]',
    messageInput: 'textarea, input[type="text"]',
    sendButton: 'button:has-text("Send"), button:has-text("Start Conversation")',
  },

  // Common
  common: {
    loadingSpinner: '[data-testid="loading"], .animate-spin',
    toast: '[role="alert"], [data-testid="toast"]',
    errorText: '.text-red-500, .text-destructive',
  },
} as const

export type Selectors = typeof selectors
