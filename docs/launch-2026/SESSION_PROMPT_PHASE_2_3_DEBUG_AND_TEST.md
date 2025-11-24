# Phase 2.3 Testing Session: Debug UI Blocker & Complete E2E Testing

**Session Type:** Debug + E2E Testing with Playwright MCP + Accessibility MCP
**Target:** Phase 2.3 Messaging Visual Design Polish
**Status:** Backend deployed ✅ | Frontend blocked 🚫
**Priority:** CRITICAL - Resolve blocker, complete testing before Phase 3.1
**Estimated Duration:** 4-6 hours

---

## 🎯 Session Objectives

### Part 1: Debug & Fix UI Blocker (1-2 hours)
**CRITICAL BLOCKER:** Messages page shows "No conversations yet" despite valid database data.

Systematically investigate and resolve:
1. React Query cache invalidation issues
2. Service Worker cache poisoning
3. API/RPC call failures
4. Frontend/backend data mismatches

### Part 2: Resume E2E Testing (2-4 hours)
Once conversations display correctly, validate all Phase 2.3 features:
1. Avatar display with fallback to initials
2. Message bubble visual polish (shadows, tails, animations)
3. Read receipt status icons
4. Typing indicator wave animation
5. Mobile UX and viewport handling
6. WCAG 2.1 AA accessibility compliance
7. Performance (CLS, FPS)
8. Visual regression baselines

---

## 📋 Pre-Session Context

### What We Know ✅
- ✅ Database migration applied successfully
- ✅ `profiles.avatar_url` column exists and accepts NULL/URLs
- ✅ Test data created (2 users, 1 conversation, 10 messages)
- ✅ Production deployment completed (commit `2d11621`)
- ✅ RPC function `list_conversations_v2()` returns correct data
- ✅ Dashboard shows "5 unread messages" and "1 active conversation"

### The Blocker 🚫
**Symptom:** `/messages` page displays empty state despite valid data
**Impact:** All 8 test suites blocked (0% testing complete)

**Evidence:**
```
✅ Database query works:
SELECT list_conversations_v2(
  p_user_id := 'e3456ab4-bb49-4fbe-946c-34827f63068f'::uuid,
  p_status := 'active'::text
);
-- Returns: {"count":1,"success":true,"conversations":[...]}

🚫 UI shows empty:
<EmptyState title="No conversations yet" />
```

**Console Errors:**
```
[ERROR] Failed to load resource: net::ERR_QUIC_PROTOCOL_ERROR.QUIC_PACKET_WRITE_ERROR
[WARNING] TypeError: Failed to update a ServiceWorker
```

### Test Users & Data 🧪
- **Demo User:** user@demo.org / TestPass123! (ID: e3456ab4-bb49-4fbe-946c-34827f63068f)
  - Has avatar: `https://i.pravatar.cc/150?img=1`
  - Approved, Beta Tester
  - Location: Springfield, MO

- **Diane Musick:** Production user (ID: 76b69ea2-e3f1-4e3f-a746-3be5ffcf82d9)
  - No avatar (should show "DM" initials)
  - Approved, Beta Tester
  - Location: Springfield, MO

- **Test Conversation:** ID `00000000-2323-4000-8000-000000000002`
  - Table: `conversations_v2`
  - Status: active
  - 10 messages with varying lengths

---

## 🔍 Part 1: Debug UI Blocker

### Step 1.1: Authenticate & Navigate
**Goal:** Access messaging page as test user

```bash
# Use Playwright MCP to navigate and login
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/auth/login"
})

# Wait for page load
mcp__playwright__browser_wait_for({ time: 2 })

# Take initial screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/debug/01-login-page.png"
})

# Get snapshot to find login form
mcp__playwright__browser_snapshot()

# Fill login form
mcp__playwright__browser_fill_form({
  fields: [
    {
      name: "Email",
      type: "textbox",
      ref: "input[type='email']",
      value: "user@demo.org"
    },
    {
      name: "Password",
      type: "textbox",
      ref: "input[type='password']",
      value: "TestPass123!"
    }
  ]
})

# Click login button
mcp__playwright__browser_click({
  element: "Sign In button",
  ref: "button[type='submit']"
})

# Wait for redirect
mcp__playwright__browser_wait_for({ time: 3 })

# Navigate to messages
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for page load
mcp__playwright__browser_wait_for({ time: 2 })

# Take screenshot of messages page (likely shows empty state)
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/debug/02-messages-empty.png"
})
```

### Step 1.2: Check Network Activity
**Goal:** Verify API calls are being made

```bash
# Get network requests since page load
mcp__playwright__browser_network_requests()
```

**What to look for:**
- ✅ Is there a call to `/rest/v1/rpc/list_conversations_v2`?
- ✅ What is the response status? (200, 401, 500?)
- ✅ What is the response body? (Does it contain conversation data?)
- ❌ Is the request missing entirely? (React Query not triggering)

### Step 1.3: Check Console Errors
**Goal:** Identify JavaScript errors

```bash
# Get console messages
mcp__playwright__browser_console_messages({ onlyErrors: true })
```

**What to look for:**
- React Query errors
- Supabase client errors
- Service Worker errors
- Network failures

### Step 1.4: Inspect React Query Cache
**Goal:** Check if data is cached but not rendering

```bash
# Use evaluate to inspect React Query DevTools data
mcp__playwright__browser_evaluate({
  function: `() => {
    // Access React Query cache
    const root = document.querySelector('#__next');
    if (!root) return { error: 'No React root found' };

    // Try to access window.__REACT_QUERY_STATE__ if exposed
    // Or check localStorage for cached queries
    const reactQueryCache = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');

    return {
      localStorage: Object.keys(localStorage),
      reactQueryCache: reactQueryCache ? JSON.parse(reactQueryCache) : null,
      sessionStorage: Object.keys(sessionStorage)
    };
  }`
})
```

### Step 1.5: Check Service Worker Cache
**Goal:** Verify SW isn't serving stale data

```bash
# Evaluate service worker state
mcp__playwright__browser_evaluate({
  function: `async () => {
    if (!('serviceWorker' in navigator)) {
      return { error: 'Service Worker not supported' };
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    const caches = await window.caches.keys();

    return {
      registrations: registrations.map(r => ({
        scope: r.scope,
        active: !!r.active,
        installing: !!r.installing,
        waiting: !!r.waiting
      })),
      cacheNames: caches
    };
  }`
})
```

**Expected finding:** Old cache version serving empty state

**Resolution:**
```bash
# Clear service worker cache
mcp__playwright__browser_evaluate({
  function: `async () => {
    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
    }

    // Clear all caches
    const cacheNames = await window.caches.keys();
    for (let cacheName of cacheNames) {
      await window.caches.delete(cacheName);
    }

    return { unregistered: registrations.length, cachesDeleted: cacheNames.length };
  }`
})

# Hard reload the page
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for fresh load
mcp__playwright__browser_wait_for({ time: 3 })

# Take screenshot after cache clear
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/debug/03-after-cache-clear.png"
})

# Check if conversations now visible
mcp__playwright__browser_snapshot()
```

### Step 1.6: Inspect Conversation List Component
**Goal:** Verify component is rendering correctly

```bash
# Check if conversations exist in DOM
mcp__playwright__browser_evaluate({
  function: `() => {
    const conversationList = document.querySelector('[role="list"]');
    const conversationItems = document.querySelectorAll('[role="option"]');
    const emptyState = document.querySelector('[data-empty-state]') ||
                       document.querySelector('div:has(> h3:contains("No conversations"))');

    return {
      listExists: !!conversationList,
      conversationCount: conversationItems.length,
      emptyStateVisible: !!emptyState,
      bodyText: document.body.innerText.substring(0, 500)
    };
  }`
})
```

### Step 1.7: Manual RPC Test via Browser Console
**Goal:** Verify we can fetch data directly

```bash
# Test Supabase client directly
mcp__playwright__browser_evaluate({
  function: `async () => {
    // Get Supabase client from window (if exposed)
    // Or manually create client
    const { createClient } = window.supabase || {};

    if (!createClient) {
      return { error: 'Supabase client not available' };
    }

    const supabase = createClient(
      'https://kecureoyekeqhrxkmjuh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Anon key
    );

    const { data, error } = await supabase.rpc('list_conversations_v2', {
      p_user_id: 'e3456ab4-bb49-4fbe-946c-34827f63068f',
      p_status: 'active'
    });

    return { data, error, success: !error };
  }`
})
```

### Step 1.8: Check for Route Mismatch
**Goal:** Verify messaging routes exist

```bash
# Try navigating to conversation directly
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages/00000000-2323-4000-8000-000000000002"
})

# Wait for page load
mcp__playwright__browser_wait_for({ time: 2 })

# Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/debug/04-direct-conversation-url.png"
})

# Check if 404 or conversation loads
mcp__playwright__browser_snapshot()
```

**Expected:** If route doesn't exist, this indicates frontend routing issue

### Step 1.9: Check React Query Query Keys
**Goal:** Verify query keys match between components

**ACTION REQUIRED:** Read the messaging components to verify query keys

```bash
# Read the ConversationList component
Read /home/evan/Projects/Care-Collective/CARE-Collective-Main/components/messaging/ConversationList.tsx

# Read the messaging hooks
Read /home/evan/Projects/Care-Collective/CARE-Collective-Main/hooks/useRealTimeMessages.ts
Read /home/evan/Projects/Care-Collective/CARE-Collective-Main/hooks/useConversations.ts
```

**Look for:**
- Query key format: `['conversations', userId, status]`
- RPC function name: `list_conversations_v2`
- Data transformation logic
- Error handling

### Step 1.10: Fix Implementation (If Issue Found)

**Possible fixes based on findings:**

**Fix A: React Query Cache Invalidation**
```typescript
// If query key mismatch found, update components to use:
queryKey: ['conversations', userId, 'active']

// Ensure invalidation after actions:
await queryClient.invalidateQueries({ queryKey: ['conversations'] });
```

**Fix B: Service Worker Update**
```bash
# Update service worker cache version
Read /home/evan/Projects/Care-Collective/CARE-Collective-Main/public/sw.js

# Increment CACHE_VERSION
Edit sw.js to bump version number

# Rebuild and deploy
npm run build && git add . && git commit -m "fix: Update service worker cache version" && git push origin main
```

**Fix C: RPC Function Name Mismatch**
```typescript
// If components are calling wrong RPC, update to:
await supabase.rpc('list_conversations_v2', { p_user_id, p_status })
```

**Fix D: Missing Error Handling**
```typescript
// Add error boundary or better error handling:
try {
  const { data, error } = await fetchConversations();
  if (error) {
    console.error('Failed to fetch conversations:', error);
    toast.error('Failed to load conversations');
  }
} catch (err) {
  console.error('Unexpected error:', err);
}
```

### Step 1.11: Verify Fix Deployed
**Goal:** Confirm conversations now load

```bash
# After fix deployed, navigate to messages again
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for load
mcp__playwright__browser_wait_for({ time: 3 })

# Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/debug/05-after-fix.png"
})

# Snapshot to verify conversations visible
mcp__playwright__browser_snapshot()

# Count conversations
mcp__playwright__browser_evaluate({
  function: `() => {
    const conversations = document.querySelectorAll('[role="option"]');
    return {
      conversationCount: conversations.length,
      success: conversations.length > 0
    };
  }`
})
```

**Expected:** `conversationCount: 1` (the test conversation)

---

## 🧪 Part 2: Resume E2E Testing

**Prerequisites:**
- ✅ Conversations display on messages page
- ✅ Can click into conversation detail
- ✅ Messages render in thread

### Test Suite 1: Avatar Display & Fallback (30 min)

#### Test 1.1: Avatar in MessageBubble
**Goal:** Verify avatars display next to messages

```bash
# Navigate to messages if not already there
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for load
mcp__playwright__browser_wait_for({ time: 2 })

# Snapshot to find conversation
mcp__playwright__browser_snapshot()

# Click on first conversation (Demo User <-> Diane Musick)
mcp__playwright__browser_click({
  element: "First conversation in list",
  ref: "[role='option']:first-of-type"
})

# Wait for messages to load
mcp__playwright__browser_wait_for({ time: 2 })

# Take screenshot of message thread
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/01-message-avatars.png"
})

# Snapshot to verify avatar elements
mcp__playwright__browser_snapshot()

# Evaluate avatar presence
mcp__playwright__browser_evaluate({
  function: `() => {
    const messages = document.querySelectorAll('[role="article"]');
    const avatars = document.querySelectorAll('[data-component="avatar"], img[alt*="avatar"], div[class*="avatar"]');

    const messageData = Array.from(messages).map((msg, i) => {
      const avatar = msg.querySelector('[data-component="avatar"], img[alt*="avatar"]');
      return {
        messageIndex: i,
        hasAvatar: !!avatar,
        avatarType: avatar?.tagName === 'IMG' ? 'image' : 'initials',
        avatarSrc: avatar?.src || null,
        avatarText: avatar?.textContent || null
      };
    });

    return {
      totalMessages: messages.length,
      totalAvatars: avatars.length,
      messageAvatars: messageData,
      allMessagesHaveAvatars: messageData.every(m => m.hasAvatar)
    };
  }`
})
```

**Expected Results:**
- ✅ `totalMessages: 10` (the test messages)
- ✅ `allMessagesHaveAvatars: true`
- ✅ Demo User messages have image avatars (src: pravatar.cc)
- ✅ Diane Musick messages have initials "DM"

#### Test 1.2: Avatar Fallback to Initials
**Goal:** Verify initials display for user without avatar

```bash
# Look for Diane's messages specifically
mcp__playwright__browser_evaluate({
  function: `() => {
    const messages = document.querySelectorAll('[role="article"]');
    const dianeMessages = Array.from(messages).filter(msg =>
      msg.textContent.includes('Diane') ||
      msg.querySelector('[aria-label*="Diane"]')
    );

    if (dianeMessages.length === 0) {
      // Find messages from "other" user (not Demo User)
      return {
        error: 'Could not identify Diane messages',
        hint: 'Check message structure'
      };
    }

    const firstDianeMsg = dianeMessages[0];
    const avatar = firstDianeMsg.querySelector('[data-component="avatar"]');

    if (!avatar) return { error: 'No avatar found' };

    const styles = window.getComputedStyle(avatar);
    const hasImage = avatar.querySelector('img');
    const initialsDiv = avatar.querySelector('div');

    return {
      hasImage: !!hasImage,
      hasInitials: !!initialsDiv,
      initialsText: initialsDiv?.textContent || null,
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      expectedInitials: 'DM'
    };
  }`
})
```

**Expected Results:**
- ✅ `hasImage: false`
- ✅ `hasInitials: true`
- ✅ `initialsText: "DM"`
- ✅ `backgroundColor: rgb(216, 168, 160)` (dusty-rose #D8A8A0)
- ✅ `color: rgb(255, 255, 255)` (white text)

#### Test 1.3: Avatar in ConversationList
**Goal:** Verify large avatars in conversation list

```bash
# Go back to conversation list
mcp__playwright__browser_navigate_back()

# Wait for list
mcp__playwright__browser_wait_for({ time: 2 })

# Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/02-conversation-list-avatars.png"
})

# Snapshot
mcp__playwright__browser_snapshot()

# Check avatar sizes
mcp__playwright__browser_evaluate({
  function: `() => {
    const conversations = document.querySelectorAll('[role="option"]');

    const avatarData = Array.from(conversations).map((conv, i) => {
      const avatar = conv.querySelector('[data-component="avatar"]');
      if (!avatar) return { index: i, found: false };

      const rect = avatar.getBoundingClientRect();
      const styles = window.getComputedStyle(avatar);

      return {
        index: i,
        found: true,
        width: rect.width,
        height: rect.height,
        expectedSize: 48, // large size
        meetsSize: rect.width === 48 && rect.height === 48
      };
    });

    return {
      totalConversations: conversations.length,
      avatars: avatarData,
      allMeetSize: avatarData.every(a => a.found && a.meetsSize)
    };
  }`
})
```

**Expected Results:**
- ✅ `totalConversations: 1`
- ✅ `allMeetSize: true`
- ✅ Avatar is 48px x 48px (large size for list view)

#### Test 1.4: Avatar in ConversationHeader
**Goal:** Verify avatar in header with participant name

```bash
# Click back into conversation
mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

# Wait for load
mcp__playwright__browser_wait_for({ time: 2 })

# Snapshot header
mcp__playwright__browser_snapshot()

# Take screenshot of header
mcp__playwright__browser_take_screenshot({
  element: "Conversation header",
  ref: "header",
  filename: "docs/testing/phase-2-3/03-header-avatar.png"
})

# Check header avatar
mcp__playwright__browser_evaluate({
  function: `() => {
    const header = document.querySelector('header') ||
                   document.querySelector('[data-component="conversation-header"]');

    if (!header) return { error: 'No header found' };

    const avatar = header.querySelector('[data-component="avatar"]');
    if (!avatar) return { error: 'No avatar in header' };

    const rect = avatar.getBoundingClientRect();
    const participantName = header.querySelector('h1, h2, [data-participant-name]');

    return {
      avatarSize: { width: rect.width, height: rect.height },
      expectedSize: 32, // medium size
      meetsSize: rect.width === 32 && rect.height === 32,
      participantName: participantName?.textContent || null
    };
  }`
})
```

**Expected Results:**
- ✅ `meetsSize: true`
- ✅ `avatarSize: { width: 32, height: 32 }` (medium size)
- ✅ `participantName: "Diane Musick"` (or other participant)

---

### Test Suite 2: Message Bubble Visual Polish (30 min)

#### Test 2.1: Message Bubble Styling
**Goal:** Verify modern chat UI styling

```bash
# Already in conversation, evaluate styling
mcp__playwright__browser_evaluate({
  function: `() => {
    const bubbles = document.querySelectorAll('[role="article"]');
    if (bubbles.length === 0) return { error: 'No message bubbles found' };

    const firstBubble = bubbles[0];
    const bubbleContent = firstBubble.querySelector('.rounded-2xl') ||
                          firstBubble.querySelector('[data-message-content]');

    if (!bubbleContent) return { error: 'No bubble content found' };

    const styles = window.getComputedStyle(bubbleContent);
    const rect = bubbleContent.getBoundingClientRect();
    const containerWidth = bubbleContent.parentElement.getBoundingClientRect().width;

    return {
      bubbleCount: bubbles.length,
      borderRadius: styles.borderRadius,
      boxShadow: styles.boxShadow,
      maxWidth: styles.maxWidth,
      actualWidth: rect.width,
      containerWidth: containerWidth,
      widthPercent: ((rect.width / containerWidth) * 100).toFixed(1) + '%',
      hasAnimation: bubbleContent.classList.contains('animate-in') ||
                    bubbleContent.classList.contains('fade-in')
    };
  }`
})
```

**Expected Results:**
- ✅ `bubbleCount: 10`
- ✅ `borderRadius: "16px"` (rounded-2xl)
- ✅ `boxShadow: "0 4px 6px..."` (shadow-md present)
- ✅ `widthPercent: "70%"` or less
- ✅ `hasAnimation: true`

#### Test 2.2: Message Tail Effect
**Goal:** Verify directional rounded corners

```bash
# Check own vs other message styling
mcp__playwright__browser_evaluate({
  function: `() => {
    // Find messages aligned right (own messages)
    const ownMessages = document.querySelectorAll('.justify-end [role="article"]');
    // Find messages aligned left (other messages)
    const otherMessages = document.querySelectorAll('.justify-start [role="article"]');

    if (ownMessages.length === 0 || otherMessages.length === 0) {
      return {
        error: 'Missing message types',
        ownCount: ownMessages.length,
        otherCount: otherMessages.length
      };
    }

    const ownBubble = ownMessages[0].querySelector('.rounded-2xl');
    const otherBubble = otherMessages[0].querySelector('.rounded-2xl');

    return {
      ownHasRoundedTrNone: ownBubble?.classList.contains('rounded-tr-none'),
      otherHasRoundedTlNone: otherBubble?.classList.contains('rounded-tl-none'),
      ownClasses: ownBubble?.className || 'not found',
      otherClasses: otherBubble?.className || 'not found'
    };
  }`
})
```

**Expected Results:**
- ✅ `ownHasRoundedTrNone: true` (tail on top-right)
- ✅ `otherHasRoundedTlNone: true` (tail on top-left)

#### Test 2.3: Hover Effects
**Goal:** Verify shadow enhancement on hover

```bash
# Hover over a message bubble
mcp__playwright__browser_hover({
  element: "First message bubble",
  ref: "[role='article']:first-of-type"
})

# Wait for transition
mcp__playwright__browser_wait_for({ time: 0.5 })

# Take screenshot during hover
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/04-bubble-hover.png"
})

# Evaluate hover state
mcp__playwright__browser_evaluate({
  function: `() => {
    const bubbles = document.querySelectorAll('[role="article"]');
    const firstBubble = bubbles[0];
    const content = firstBubble.querySelector('.rounded-2xl');

    if (!content) return { error: 'No bubble content' };

    const styles = window.getComputedStyle(content);

    return {
      boxShadow: styles.boxShadow,
      transition: styles.transition,
      hasHoverClass: content.classList.contains('hover:shadow-lg')
    };
  }`
})
```

**Expected Results:**
- ✅ Shadow increases on hover
- ✅ Transition is smooth (check for transition property)
- ✅ No layout shift

---

### Test Suite 3: Read Receipt Validation (20 min)

#### Test 3.1: Read Receipt Display
**Goal:** Verify read receipt icons are visible and correct

```bash
# Find own messages and check receipts
mcp__playwright__browser_evaluate({
  function: `() => {
    const ownMessages = document.querySelectorAll('.justify-end [role="article"]');
    const receipts = [];

    ownMessages.forEach((msg, index) => {
      const receiptIcon = msg.querySelector('[aria-label*="Read"], [aria-label*="Delivered"], [aria-label*="Sent"]') ||
                          msg.querySelector('svg[data-lucide="check"], svg[data-lucide="check-check"]');

      if (receiptIcon) {
        const styles = window.getComputedStyle(receiptIcon);
        receipts.push({
          messageIndex: index,
          ariaLabel: receiptIcon.getAttribute('aria-label'),
          color: styles.color,
          width: receiptIcon.getBoundingClientRect().width,
          height: receiptIcon.getBoundingClientRect().height
        });
      }
    });

    return {
      totalOwn: ownMessages.length,
      receipts: receipts,
      allHaveReceipts: receipts.length === ownMessages.length
    };
  }`
})
```

**Expected Results:**
- ✅ `allHaveReceipts: true`
- ✅ Icons are ~16px (w-4 h-4)
- ✅ Read messages: sage color (rgb(122, 158, 153))
- ✅ Delivered/Sent: gray color

#### Test 3.2: Read Receipt Positioning
**Goal:** Verify receipts positioned correctly

```bash
# Take screenshot of timestamp/receipt area
mcp__playwright__browser_take_screenshot({
  element: "Message timestamp area",
  ref: "[role='article']:first-of-type time",
  filename: "docs/testing/phase-2-3/05-read-receipts.png"
})

# Check layout
mcp__playwright__browser_evaluate({
  function: `() => {
    const ownMessages = document.querySelectorAll('.justify-end [role="article"]');
    if (ownMessages.length === 0) return { error: 'No own messages' };

    const firstOwn = ownMessages[0];
    const timestamp = firstOwn.querySelector('time');
    const receipt = firstOwn.querySelector('[aria-label*="Read"], [aria-label*="Sent"]');

    if (!timestamp || !receipt) {
      return { error: 'Missing timestamp or receipt' };
    }

    const timestampRect = timestamp.getBoundingClientRect();
    const receiptRect = receipt.getBoundingClientRect();
    const parent = timestamp.parentElement;
    const parentStyles = window.getComputedStyle(parent);

    return {
      timestampX: timestampRect.x,
      receiptX: receiptRect.x,
      gap: Math.abs(timestampRect.x - (receiptRect.x + receiptRect.width)),
      flexDirection: parentStyles.flexDirection,
      alignedVertically: Math.abs(timestampRect.y - receiptRect.y) < 5
    };
  }`
})
```

**Expected Results:**
- ✅ Receipt positioned next to timestamp
- ✅ Gap between elements ~6px (gap-1.5)
- ✅ Vertically aligned

---

### Test Suite 4: Typing Indicator Animation (15 min)

**Note:** Typing indicator may not be visible without active typing. Check component structure instead.

```bash
# Check for typing indicator component in codebase
Read /home/evan/Projects/Care-Collective/CARE-Collective-Main/components/messaging/TypingIndicator.tsx

# Try to find it in DOM
mcp__playwright__browser_evaluate({
  function: `() => {
    const indicator = document.querySelector('[role="status"][aria-live="polite"]') ||
                      document.querySelector('[data-component="typing-indicator"]');

    if (!indicator) {
      return { present: false, note: 'Typing indicator not currently visible' };
    }

    const dots = indicator.querySelectorAll('.animate-bounce') ||
                 indicator.querySelectorAll('[data-dot]');

    const delays = Array.from(dots).map(dot => {
      const styles = window.getComputedStyle(dot);
      return {
        animationDelay: styles.animationDelay,
        animationDuration: styles.animationDuration
      };
    });

    return {
      present: true,
      dotCount: dots.length,
      animations: delays
    };
  }`
})
```

**Expected Results (if visible):**
- ✅ Three bouncing dots
- ✅ Staggered delays: 0ms, 150ms, 300ms
- ✅ Animation duration: 1000ms

**If not visible:** Document structure from code review

---

### Test Suite 5: Mobile UX Validation (45 min)

#### Test 5.1: Mobile Viewport - Avatar Touch Targets

```bash
# Resize to mobile viewport (iPhone SE)
mcp__playwright__browser_resize({
  width: 375,
  height: 667
})

# Navigate to messages
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for load
mcp__playwright__browser_wait_for({ time: 3 })

# Take mobile screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/06-mobile-messages.png",
  fullPage: true
})

# Check touch target sizes
mcp__playwright__browser_evaluate({
  function: `() => {
    const conversations = document.querySelectorAll('[role="option"]');
    const touchTargets = [];

    conversations.forEach((conv, i) => {
      const rect = conv.getBoundingClientRect();
      touchTargets.push({
        index: i,
        width: rect.width,
        height: rect.height,
        meetsMinimum: rect.height >= 44
      });
    });

    return {
      touchTargets,
      allMeetMinimum: touchTargets.every(t => t.meetsMinimum),
      viewportWidth: window.innerWidth
    };
  }`
})
```

**Expected Results:**
- ✅ `allMeetMinimum: true`
- ✅ All conversation items ≥44px tall
- ✅ `viewportWidth: 375`

#### Test 5.2: Mobile - Message Bubbles

```bash
# Click into conversation
mcp__playwright__browser_snapshot()

mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

# Wait for messages
mcp__playwright__browser_wait_for({ time: 2 })

# Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/07-mobile-message-bubbles.png"
})

# Check bubble widths
mcp__playwright__browser_evaluate({
  function: `() => {
    const bubbles = document.querySelectorAll('[role="article"] .rounded-2xl');
    const viewportWidth = window.innerWidth;
    const widths = [];

    bubbles.forEach((bubble, i) => {
      const rect = bubble.getBoundingClientRect();
      const percentOfViewport = (rect.width / viewportWidth) * 100;
      widths.push({
        index: i,
        width: rect.width,
        percentOfViewport: percentOfViewport.toFixed(1) + '%',
        fitsScreen: rect.width <= viewportWidth * 0.75
      });
    });

    return {
      viewportWidth,
      bubbleWidths: widths,
      allFit: widths.every(w => w.fitsScreen)
    };
  }`
})
```

**Expected Results:**
- ✅ `allFit: true`
- ✅ Bubbles max 70-75% of screen width
- ✅ No horizontal scroll

#### Test 5.3: Mobile - Keyboard Handling

```bash
# Focus on message input
mcp__playwright__browser_click({
  element: "Message input field",
  ref: "textarea[placeholder*='Type']"
})

# Type a message
mcp__playwright__browser_type({
  element: "Message input",
  ref: "textarea[placeholder*='Type']",
  text: "Testing mobile keyboard behavior",
  slowly: false
})

# Wait
mcp__playwright__browser_wait_for({ time: 1 })

# Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/08-mobile-keyboard.png"
})
```

**Expected Results:**
- ✅ Input stays visible
- ✅ No layout collapse
- ✅ Message thread scrolls appropriately

---

### Test Suite 6: Accessibility Compliance (30 min)

#### Test 6.1: WCAG 2.1 AA Scan

```bash
# Use Accessibility MCP
mcp__a11y__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Wait for load
mcp__a11y__browser_wait_for({ time: 3 })

# Run accessibility scan
mcp__a11y__scan_page({
  violationsTag: [
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa"
  ]
})
```

**Expected Results:**
- ✅ 0 critical violations
- ✅ All images have alt text
- ✅ Color contrast passes WCAG AA
- ✅ ARIA labels present

#### Test 6.2: Screen Reader Compatibility

```bash
# Check ARIA labels
mcp__a11y__browser_evaluate({
  function: `() => {
    const results = {
      messageArticles: [],
      avatars: [],
      readReceipts: []
    };

    // Check message articles
    document.querySelectorAll('[role="article"]').forEach((article, i) => {
      results.messageArticles.push({
        index: i,
        hasAriaLabel: !!article.getAttribute('aria-label'),
        labelText: article.getAttribute('aria-label')
      });
    });

    // Check avatars
    document.querySelectorAll('[aria-label*="avatar"]').forEach((avatar, i) => {
      results.avatars.push({
        index: i,
        labelText: avatar.getAttribute('aria-label')
      });
    });

    // Check read receipts
    document.querySelectorAll('[aria-label*="Read"], [aria-label*="Sent"]').forEach((receipt, i) => {
      results.readReceipts.push({
        index: i,
        labelText: receipt.getAttribute('aria-label')
      });
    });

    return results;
  }`
})
```

**Expected Results:**
- ✅ All messages have `aria-label="Message from [name]"`
- ✅ All avatars have `aria-label="[name]'s avatar"`
- ✅ All receipts have descriptive labels

#### Test 6.3: Keyboard Navigation

```bash
# Navigate with Tab
mcp__a11y__browser_press_key({ key: "Tab" })
mcp__a11y__browser_wait_for({ time: 0.5 })

# Take screenshot of focused element
mcp__a11y__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/09-keyboard-focus.png"
})

# Tab through conversations
mcp__a11y__browser_press_key({ key: "Tab" })
mcp__a11y__browser_press_key({ key: "Tab" })

# Press Enter to select
mcp__a11y__browser_press_key({ key: "Enter" })
```

**Expected Results:**
- ✅ Focus visible on all interactive elements
- ✅ Tab order is logical
- ✅ Enter key activates conversations

---

### Test Suite 7: Performance Validation (30 min)

#### Test 7.1: Layout Shift (CLS) Check

```bash
# Resize to desktop
mcp__playwright__browser_resize({ width: 1920, height: 1080 })

# Navigate to messages
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

# Measure CLS
mcp__playwright__browser_evaluate({
  function: `() => {
    return new Promise((resolve) => {
      let cls = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve({
          cls: cls.toFixed(3),
          passes: cls < 0.1,
          rating: cls < 0.1 ? 'Good' : cls < 0.25 ? 'Needs Improvement' : 'Poor'
        });
      }, 5000);
    });
  }`
})
```

**Expected Results:**
- ✅ `cls < 0.1` (Good rating)
- ✅ Avatar loading doesn't cause shifts

#### Test 7.2: Animation Frame Rate

```bash
# Click into conversation
mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

# Wait for load
mcp__playwright__browser_wait_for({ time: 2 })

# Measure FPS during scroll
mcp__playwright__browser_evaluate({
  function: `() => {
    return new Promise((resolve) => {
      const frameTimes = [];
      let lastTime = performance.now();
      let frameCount = 0;
      const maxFrames = 60;

      function measureFrame() {
        const now = performance.now();
        const delta = now - lastTime;
        frameTimes.push(delta);
        lastTime = now;
        frameCount++;

        if (frameCount < maxFrames) {
          requestAnimationFrame(measureFrame);
        } else {
          const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
          const fps = 1000 / avgFrameTime;
          resolve({
            avgFrameTime: avgFrameTime.toFixed(2) + 'ms',
            fps: fps.toFixed(1),
            smooth: fps >= 55
          });
        }
      }

      requestAnimationFrame(measureFrame);
    });
  }`
})
```

**Expected Results:**
- ✅ `fps >= 55` (smooth)
- ✅ `avgFrameTime < 18ms`

---

### Test Suite 8: Visual Regression Baselines (20 min)

#### Test 8.1: Screenshot Comparison

```bash
# Desktop viewport
mcp__playwright__browser_resize({ width: 1920, height: 1080 })

mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/baselines/desktop-messages.png",
  fullPage: true
})

# Click into conversation
mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

mcp__playwright__browser_wait_for({ time: 2 })

mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/baselines/desktop-conversation.png",
  fullPage: true
})

# Tablet viewport
mcp__playwright__browser_resize({ width: 768, height: 1024 })

mcp__playwright__browser_navigate_back()
mcp__playwright__browser_wait_for({ time: 2 })

mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/baselines/tablet-messages.png",
  fullPage: true
})

# Mobile viewport
mcp__playwright__browser_resize({ width: 375, height: 667 })

mcp__playwright__browser_take_screenshot({
  filename: "docs/testing/phase-2-3/baselines/mobile-messages.png",
  fullPage: true
})
```

**Deliverable:**
- ✅ Baseline screenshots for desktop, tablet, mobile
- ✅ Both list and detail views captured

---

## 📝 Final Test Report Generation

After completing all test suites, create a comprehensive test report:

**File:** `docs/launch-2026/PHASE_2.3_FINAL_TEST_REPORT.md`

**Template:**

```markdown
# Phase 2.3 Final Test Report: Messaging Visual Design Polish

**Date:** [DATE]
**Tester:** [NAME/Claude Code]
**Test Environment:** Production (https://care-collective-preview.vercel.app)
**Test Duration:** [HOURS]
**Overall Status:** ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

## Executive Summary

Phase 2.3 introduces visual design improvements to the messaging system, including profile picture avatars, enhanced message bubble styling, larger read receipts, and typing indicator animations.

### Test Coverage
- **Total Test Suites:** 8
- **Tests Executed:** [NUMBER]
- **Tests Passed:** [NUMBER] ([PERCENT]%)
- **Tests Failed:** [NUMBER]
- **Critical Issues:** [NUMBER]

---

## Blocker Resolution

### UI Blocker Investigation
**Issue:** Messaging page showed empty state despite valid database data

**Root Cause:** [DESCRIBE WHAT YOU FOUND]

**Resolution:** [DESCRIBE HOW YOU FIXED IT]

**Verification:** ✅ Conversations now load correctly

---

## Test Results Summary

### Suite 1: Avatar Display & Fallback
- MessageBubble avatars: ✅/❌
- Fallback initials: ✅/❌
- ConversationList avatars: ✅/❌
- ConversationHeader avatars: ✅/❌
- **Overall:** ✅/❌

### Suite 2: Message Bubble Visual Polish
- Bubble styling: ✅/❌
- Message tails: ✅/❌
- Hover effects: ✅/❌
- **Overall:** ✅/❌

### Suite 3: Read Receipt Validation
- Display & sizing: ✅/❌
- Status colors: ✅/❌
- Positioning: ✅/❌
- **Overall:** ✅/❌

### Suite 4: Typing Indicator
- Wave animation: ✅/❌/N/A
- Entrance animation: ✅/❌/N/A
- **Overall:** ✅/❌/N/A

### Suite 5: Mobile UX
- Touch targets: ✅/❌
- Bubble layout: ✅/❌
- Keyboard handling: ✅/❌
- **Overall:** ✅/❌

### Suite 6: Accessibility
- WCAG 2.1 AA scan: ✅/❌
- ARIA labels: ✅/❌
- Keyboard navigation: ✅/❌
- **Overall:** ✅/❌

### Suite 7: Performance
- CLS score: [SCORE] ✅/❌
- FPS: [SCORE] ✅/❌
- **Overall:** ✅/❌

### Suite 8: Visual Regression
- Baseline screenshots captured: ✅
- **Overall:** ✅

---

## Detailed Findings

### Critical Issues (P0)
[List any critical bugs that block production use]

### Major Issues (P1)
[List major bugs that significantly impact UX]

### Minor Issues (P2)
[List minor bugs or polish items]

### Observations
[List non-blocking observations or suggestions]

---

## Screenshots

### Avatar Display
![Message Avatars](./phase-2-3/01-message-avatars.png)
![Conversation List Avatars](./phase-2-3/02-conversation-list-avatars.png)
![Header Avatar](./phase-2-3/03-header-avatar.png)

### Visual Polish
![Bubble Hover](./phase-2-3/04-bubble-hover.png)
![Read Receipts](./phase-2-3/05-read-receipts.png)

### Mobile UX
![Mobile Messages](./phase-2-3/06-mobile-messages.png)
![Mobile Bubbles](./phase-2-3/07-mobile-message-bubbles.png)
![Mobile Keyboard](./phase-2-3/08-mobile-keyboard.png)

### Accessibility
![Keyboard Focus](./phase-2-3/09-keyboard-focus.png)

---

## Performance Metrics

- **CLS:** [SCORE] ([RATING])
- **FPS:** [SCORE] ([SMOOTH/CHOPPY])
- **Page Load:** [TIME]
- **Time to Interactive:** [TIME]

---

## Accessibility Compliance

- **WCAG 2.1 AA Violations:** [NUMBER]
- **Color Contrast:** ✅/❌
- **ARIA Labels:** ✅/❌
- **Keyboard Navigation:** ✅/❌

---

## Recommendations

### Immediate Actions
1. [Action item 1]
2. [Action item 2]

### Future Enhancements
1. [Enhancement 1]
2. [Enhancement 2]

---

## Sign-Off

**Phase 2.3 Status:** ✅ APPROVED FOR PRODUCTION / ⚠️ CONDITIONAL APPROVAL / ❌ REQUIRES FIXES

**Tester:** [NAME]
**Date:** [DATE]
**Next Phase:** Phase 3.1 (Dashboard Optimization & Profile Pictures)

---
```

---

## ✅ Session Completion Checklist

### Debug Phase
- [ ] Authenticated as test user
- [ ] Investigated network requests
- [ ] Checked console errors
- [ ] Inspected React Query cache
- [ ] Verified service worker state
- [ ] Tested RPC calls manually
- [ ] Identified root cause
- [ ] Implemented fix
- [ ] Verified fix deployed
- [ ] Conversations now visible

### Testing Phase
- [ ] Suite 1: Avatar tests complete
- [ ] Suite 2: Visual polish tests complete
- [ ] Suite 3: Read receipt tests complete
- [ ] Suite 4: Typing indicator verified
- [ ] Suite 5: Mobile UX tests complete
- [ ] Suite 6: Accessibility tests complete
- [ ] Suite 7: Performance tests complete
- [ ] Suite 8: Baseline screenshots captured
- [ ] All screenshots saved
- [ ] Test report generated
- [ ] Issues documented

### Documentation
- [ ] Test report written
- [ ] Screenshots included
- [ ] Performance metrics recorded
- [ ] Accessibility results documented
- [ ] Recommendations provided
- [ ] QUICK_REFERENCE.md updated

---

## 🚀 Post-Session Actions

### If All Tests Pass ✅
1. Update `PROJECT_STATUS.md` to mark Phase 2.3 complete
2. Update `QUICK_REFERENCE.md` with Phase 2.3 completion
3. Commit test report and screenshots
4. Share results with stakeholders
5. Proceed to Phase 3.1 (Dashboard Optimization)

### If Tests Fail ❌
1. Document all failures with screenshots
2. Create GitHub issues for each bug
3. Prioritize fixes (P0, P1, P2)
4. Implement fixes
5. Re-run failed test suites
6. Update test report

---

## 💡 Tips for Success

### Debugging Strategy
1. **Start with the data** - Verify database has correct data
2. **Check the network** - Ensure API calls are being made
3. **Inspect the cache** - Service workers can be tricky
4. **Read the code** - Don't guess, verify
5. **Test incrementally** - Fix one thing, test, repeat

### Testing Strategy
1. **Always snapshot first** - Know the DOM before clicking
2. **Wait for animations** - Don't rush, let things settle
3. **Take screenshots** - Visual evidence is invaluable
4. **Use evaluate wisely** - Complex checks need JavaScript
5. **Test mobile thoroughly** - Most users are on mobile

### Common Pitfalls
- ❌ Clicking before page loads
- ❌ Using hardcoded selectors
- ❌ Forgetting to resize for mobile
- ❌ Not waiting for animations
- ❌ Skipping accessibility checks

---

## 📚 Reference Documentation

- **Phase 2.3 Implementation:** Git commit `7ab5011`
- **Previous Test Report:** `docs/launch-2026/PHASE_2.3_TEST_REPORT.md`
- **Original Session Plan:** `docs/launch-2026/SESSION_PROMPT_PHASE_2_3_TESTING.md`
- **Project Guidelines:** `CLAUDE.md`
- **Quick Reference:** `docs/launch-2026/QUICK_REFERENCE.md`
- **Playwright MCP Docs:** Ask claude-code-guide agent
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

## 🎯 Success Criteria

Phase 2.3 is considered **COMPLETE** when:
- ✅ UI blocker resolved and conversations display
- ✅ All 8 test suites executed
- ✅ 0 critical (P0) bugs remaining
- ✅ WCAG 2.1 AA compliance maintained
- ✅ Performance metrics meet targets (CLS < 0.1, FPS >= 55)
- ✅ Mobile UX validated on 375px viewport
- ✅ Visual regression baselines captured
- ✅ Test report completed and reviewed

---

**Ready to begin!** Start with Part 1: Debug UI Blocker, then proceed to Part 2: E2E Testing once conversations are visible.

**Good luck! 🚀**
