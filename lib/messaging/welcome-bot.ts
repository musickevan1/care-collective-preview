/**
 * @fileoverview Welcome Bot Service for Care Collective Messaging
 * 
 * Provides onboarding for new users through a simulated welcome experience
 * that explains how messaging and help offers work.
 * 
 * Since the conversations_v2 table requires help_request_id (NOT NULL),
 * we use a client-side approach with localStorage to track welcome status
 * and display a welcome banner/message to new users.
 * 
 * This replaces the complex multi-step tour overlay with a more natural,
 * conversation-based onboarding experience.
 */

/**
 * System bot identifier for the Welcome Bot
 * Used for identifying welcome-related UI elements
 */
export const WELCOME_BOT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Display name for the Welcome Bot
 */
export const WELCOME_BOT_NAME = 'CARE Collective Support';

/**
 * LocalStorage key for tracking welcome completion
 */
export const WELCOME_RECEIVED_KEY = 'care-collective-welcome-received';

/**
 * LocalStorage key for tracking if welcome banner has been dismissed
 */
export const WELCOME_BANNER_DISMISSED_KEY = 'care-collective-welcome-banner-dismissed';

/**
 * Welcome message content - explains the help offer flow naturally
 */
export const WELCOME_MESSAGE_CONTENT = `Welcome to CARE Collective messaging! 👋

Here's how helping works:

1️⃣ Browse help requests and click "Offer Help"
2️⃣ Your offer appears in "Pending" until accepted
3️⃣ Once accepted, you can chat directly!

Tips:
• Be specific about how you can help
• Respond promptly to keep things moving
• Check back for new requests regularly

Questions? Visit our Help page anytime!`;

/**
 * Shorter welcome message for the banner
 */
export const WELCOME_BANNER_MESSAGE = `Welcome to messaging! To start a conversation, browse help requests and click "Offer Help". Your offer will appear in Pending until accepted.`;

/**
 * Check if user has received the welcome message (client-side)
 * This is called from client components
 */
export function hasReceivedWelcomeClient(): boolean {
  if (typeof window === 'undefined') return true; // SSR safety
  return localStorage.getItem(WELCOME_RECEIVED_KEY) === 'true';
}

/**
 * Mark the welcome as received (client-side)
 */
export function markWelcomeReceivedClient(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WELCOME_RECEIVED_KEY, 'true');
}

/**
 * Check if welcome banner has been dismissed (client-side)
 */
export function isWelcomeBannerDismissedClient(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(WELCOME_BANNER_DISMISSED_KEY) === 'true';
}

/**
 * Dismiss the welcome banner (client-side)
 */
export function dismissWelcomeBannerClient(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WELCOME_BANNER_DISMISSED_KEY, 'true');
  markWelcomeReceivedClient(); // Also mark as received
}

/**
 * Reset welcome state - useful for testing
 */
export function resetWelcomeStateClient(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WELCOME_RECEIVED_KEY);
  localStorage.removeItem(WELCOME_BANNER_DISMISSED_KEY);
}

/**
 * Check if a conversation participant is the Welcome Bot
 * (For future use if we add database-backed bot conversations)
 */
export function isWelcomeBotUser(userId: string): boolean {
  return userId === WELCOME_BOT_USER_ID;
}

/**
 * Check if a conversation is from the Welcome Bot
 * (For future use if we add database-backed bot conversations)
 */
export function isWelcomeBotConversation(conversation: {
  participants?: Array<{ user_id: string }>;
  created_by?: string;
  helper_id?: string;
  requester_id?: string;
}): boolean {
  if (conversation.helper_id === WELCOME_BOT_USER_ID) return true;
  if (conversation.requester_id === WELCOME_BOT_USER_ID) return true;
  if (conversation.created_by === WELCOME_BOT_USER_ID) return true;
  
  if (conversation.participants?.some(p => p.user_id === WELCOME_BOT_USER_ID)) {
    return true;
  }
  
  return false;
}
