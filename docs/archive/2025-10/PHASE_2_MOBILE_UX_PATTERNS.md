# Phase 2: Native Mobile UX Patterns - Implementation Guide

**Status:** Ready to Start
**Prerequisites:** Phase 1 Complete ✅
**Estimated Time:** 20-26 hours over 2 weeks
**Last Updated:** 2025-11-01

---

## 📋 Quick Start

This document provides complete context for implementing Phase 2 of the mobile messaging UI improvements. Phase 1 (critical bug fixes) has been completed, committed, and deployed to production.

### What You Need to Know

1. **Phase 1 is COMPLETE** - All critical mobile bugs fixed and deployed
2. **Production URL:** https://care-collective-preview.vercel.app
3. **Git Branch:** Work on `main` (auto-deploys to production)
4. **Deployment:** Automatic via Git push (no manual Vercel commands needed)

---

## ✅ Phase 1 Recap: What's Already Done

### 1.1 Message Actions on Touch Devices ✅
**File:** `components/messaging/MessageBubble.tsx`
- Touch device detection implemented
- Action buttons visible (70% opacity) on mobile
- Touch target size: 36px (44px with padding) - WCAG compliant

### 1.2 Mobile Keyboard Handling ✅
**File:** `components/messaging/MessageInput.tsx`
- Mobile: Enter sends, Shift+Enter = new line
- Desktop: Ctrl/Cmd+Enter sends, Enter = new line
- Dynamic keyboard hints

### 1.3 Viewport Framing with Virtual Keyboard ✅
**File:** `components/messaging/MessagingDashboard.tsx`
- Visual Viewport API implementation
- Container height adjusts with keyboard
- Auto-scrolls to keep input visible

### 1.4 Text Size Improvements ✅
**File:** `components/messaging/ConversationList.tsx`
- Metadata: 13px → 15px
- Icons: 12px → 16px

**Commit:** `0891483` - "feat: Phase 1 mobile messaging UI improvements"

---

## 🎯 Phase 2: Native Mobile UX Patterns

### Overview

Add mobile-specific interaction patterns that users expect from modern messaging apps. Focus on making the experience feel native rather than just responsive.

### Goals

1. **Pull-to-refresh** - Standard mobile pattern for refreshing content
2. **Swipe gestures** - Natural navigation and actions via swipes
3. **Enhanced keyboard** - Better integration with mobile keyboards
4. **Haptic feedback** - Tactile responses for key actions

---

## 📦 Phase 2.1: Pull-to-Refresh Messages

**Priority:** HIGH
**Status:** ⚠️ BLOCKED - Library Incompatibility with Next.js 14
**Estimated Time:** 6-8 hours (now requires custom implementation ~8-10 hours)
**Files to Modify:**
- `components/messaging/MessagingDashboard.tsx`
- `lib/hooks/usePullToRefresh.ts` (new custom hook)

---

### ⚠️ CRITICAL: Known Incompatibility Issue

**Libraries Tested (ALL INCOMPATIBLE with Next.js 14.2.32):**

1. **react-pull-to-refresh (v2.0.1)**
   - Production Error: `ReferenceError: Cannot access 'K' before initialization`
   - Result: 500 error on /messages page
   - Issue: Circular dependency in bundle

2. **react-simple-pull-to-refresh (latest)**
   - Production Error: `ReferenceError: Cannot access '$' before initialization`
   - Result: Same 500 error
   - Issue: Same circular dependency problem

**Root Cause:** Both libraries have bundling issues with Next.js 14's minification and module resolution. The circular references in the library code cause initialization errors during production builds.

**Commits Reverted:**
- `1b721b5` - Initial pull-to-refresh implementation
- `b76b189` - Attempted fix with alternative library
- `316749d` - Full revert to restore working state

**Resolution Required:** Must implement custom pull-to-refresh using native touch events or wait for:
- Next.js 15 (may resolve bundling issues)
- Library updates for Next.js 14 compatibility
- Alternative gesture libraries (Framer Motion, react-use-gesture)

---

### What to Implement

**User Story:** As a mobile user, I want to pull down on the message list to check for new messages, so I can manually refresh when needed (e.g., after losing connectivity).

### Technical Implementation (Custom Approach Required)

#### Step 1: ~~Install Library~~ Create Custom Hook

~~```bash
npm install react-pull-to-refresh
```~~

**UPDATE:** Build custom hook using native touch events:

#### Step 2: Wrap Message List

In `MessagingDashboard.tsx`, wrap the message scroll area:

```typescript
import PullToRefresh from 'react-pull-to-refresh'

// Inside the component
const handleRefresh = async () => {
  if (selectedConversation) {
    await loadMessages(selectedConversation)
  }
  // Also refresh conversation list
  await loadConversations()
}

// In the render, wrap the message list
{isTouchDevice && (
  <PullToRefresh
    onRefresh={handleRefresh}
    resistance={2}
    distanceToRefresh={60}
  >
    <ScrollArea className="flex-1 p-4">
      {/* message bubbles */}
    </ScrollArea>
  </PullToRefresh>
)}
```

#### Step 3: Add Loading Indicator

Use Care Collective brand colors for the loading spinner:

```typescript
// Custom loading component
const RefreshIndicator = () => (
  <div className="flex items-center justify-center py-4">
    <RefreshCw className="w-5 h-5 text-sage animate-spin" />
    <span className="ml-2 text-sm text-sage">Refreshing messages...</span>
  </div>
)
```

#### Step 4: Handle Real-time Conflicts

Ensure pull-to-refresh works alongside real-time subscriptions:

```typescript
const handleRefresh = async () => {
  setIsManualRefresh(true)
  try {
    // Temporarily pause real-time updates during manual refresh
    // Then re-enable after refresh completes
    await loadMessages(selectedConversation)
  } finally {
    setIsManualRefresh(false)
  }
}
```

### Testing Checklist

- [ ] Pull gesture triggers refresh on mobile
- [ ] Loading indicator shows brand colors
- [ ] Doesn't conflict with real-time updates
- [ ] Works with both virtualized and non-virtualized lists
- [ ] Proper error handling if refresh fails
- [ ] No duplicate messages after refresh
- [ ] Desktop users don't see pull-to-refresh

### Acceptance Criteria

✅ Pull down gesture refreshes messages
✅ Visual feedback during refresh (Care Collective colors)
✅ Works smoothly with existing real-time subscriptions
✅ Only enabled on touch devices
✅ No performance degradation

---

## 📦 Phase 2.2: Swipe Gestures

**Priority:** HIGH
**Estimated Time:** 8-10 hours
**Files to Modify:**
- `components/messaging/MessagingDashboard.tsx`
- `components/messaging/MessageBubble.tsx`

### What to Implement

**User Stories:**
1. As a mobile user, I want to swipe right on a message thread to go back to the conversation list
2. As a mobile user, I want to swipe left on a message bubble to reveal quick actions (reply, delete)

### Technical Implementation

#### Step 1: Install Gesture Library

```bash
npm install react-swipeable
# or for more advanced gestures
npm install framer-motion
```

**Recommendation:** Use `react-swipeable` for simplicity and reliability.

#### Step 2: Swipe Back Navigation

In `MessagingDashboard.tsx`:

```typescript
import { useSwipeable } from 'react-swipeable'

// Inside component
const swipeHandlers = useSwipeable({
  onSwipedRight: (eventData) => {
    // Only on mobile, swipe right to go back
    if (isMobile && !showConversationList) {
      handleBackToConversations()
    }
  },
  trackMouse: false, // Disable on desktop
  preventScrollOnSwipe: true,
  delta: 50 // Minimum swipe distance in px
})

// Apply to message thread container
<div
  {...swipeHandlers}
  ref={messageThreadRef}
  className="flex-1 flex flex-col"
>
  {/* message content */}
</div>
```

#### Step 3: Swipe on Message Bubbles

In `MessageBubble.tsx`:

```typescript
import { useSwipeable } from 'react-swipeable'

const [isSwipedOpen, setIsSwipedOpen] = useState(false)

const swipeHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (isTouchDevice) {
      setIsSwipedOpen(true)
    }
  },
  onSwipedRight: () => {
    setIsSwipedOpen(false)
  },
  trackMouse: false,
  delta: 30
})

// Message bubble with swipe reveal
<div {...swipeHandlers} className="relative">
  <div
    className={cn(
      "transition-transform duration-200",
      isSwipedOpen && "-translate-x-20" // Reveal actions
    )}
  >
    {/* message bubble content */}
  </div>

  {/* Quick actions revealed on swipe */}
  {isSwipedOpen && (
    <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
      <Button size="sm" variant="ghost" onClick={onReply}>
        Reply
      </Button>
      {isCurrentUser && (
        <Button size="sm" variant="ghost" onClick={() => onDelete(message.id)}>
          Delete
        </Button>
      )}
    </div>
  )}
</div>
```

#### Step 4: Visual Feedback

Add visual hints for swipeable elements:

```typescript
// Subtle hint that element is swipeable
<div className="relative">
  {isTouchDevice && (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
      <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse" />
    </div>
  )}
  {/* swipeable content */}
</div>
```

### Testing Checklist

- [ ] Swipe right on thread goes back to list
- [ ] Swipe left on message reveals actions
- [ ] Swipe right on message hides actions
- [ ] Visual feedback during swipe
- [ ] Doesn't interfere with scrolling
- [ ] Proper threshold (not too sensitive)
- [ ] Desktop users not affected
- [ ] Works with different message types

### Acceptance Criteria

✅ Swipe right navigates back to conversation list
✅ Swipe left reveals message actions
✅ Smooth animations (60fps)
✅ Doesn't break vertical scrolling
✅ Touch-only (no mouse swipe)
✅ Clear visual feedback

---

## 📦 Phase 2.3: Enhanced Keyboard Handling

**Priority:** MEDIUM
**Estimated Time:** 3-4 hours
**Files to Modify:**
- `components/messaging/MessageInput.tsx`

### What to Implement

**User Story:** As a mobile user, I want better keyboard integration, including a visual "Send" button connection and auto-focus behavior.

### Technical Implementation

#### Step 1: Send Button Integration

Make the send button visually connect to the keyboard:

```typescript
// Add keyboard-aware state
const [keyboardVisible, setKeyboardVisible] = useState(false)

useEffect(() => {
  // Detect keyboard visibility
  if ('visualViewport' in window && window.visualViewport) {
    const viewport = window.visualViewport

    const handleResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height
      setKeyboardVisible(keyboardHeight > 100) // Keyboard likely open
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }
}, [])

// Render send button with keyboard-aware styling
<Button
  type="submit"
  className={cn(
    "bg-sage hover:bg-sage-dark text-white",
    keyboardVisible && "shadow-lg ring-2 ring-sage/30" // Emphasize when keyboard open
  )}
>
  <Send className="w-4 h-4 mr-2" />
  Send
</Button>
```

#### Step 2: Auto-focus After Send

Keep focus in input after sending (already implemented in Phase 1, but verify):

```typescript
// After successful send
textareaRef.current?.focus()
```

#### Step 3: Close Keyboard Button

Add optional "Done" button for iOS:

```typescript
{isTouchDevice && keyboardVisible && (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={() => textareaRef.current?.blur()}
    className="text-xs text-muted-foreground"
  >
    Done
  </Button>
)}
```

### Testing Checklist

- [ ] Send button emphasized when keyboard open
- [ ] Auto-focus maintained after send
- [ ] "Done" button closes keyboard on iOS
- [ ] Smooth transitions
- [ ] Works with both physical and virtual keyboards

### Acceptance Criteria

✅ Visual connection between keyboard and send button
✅ Focus management optimized
✅ Optional keyboard dismiss on iOS
✅ No layout shift when keyboard opens/closes

---

## 📦 Phase 2.4: Haptic Feedback

**Priority:** LOW (Polish)
**Estimated Time:** 3-4 hours
**Files to Modify:**
- `components/messaging/MessageInput.tsx`
- `components/messaging/MessageBubble.tsx`
- `lib/utils/haptics.ts` (new file)

### What to Implement

**User Story:** As a mobile user, I want tactile feedback for key actions (send, receive, error) to confirm my interactions.

### Technical Implementation

#### Step 1: Create Haptics Utility

Create `lib/utils/haptics.ts`:

```typescript
/**
 * Haptic feedback utility for mobile devices
 * Uses Vibration API with fallback for unsupported devices
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'error' | 'success'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  error: [10, 50, 10], // Double tap
  success: [10, 100, 10, 100, 10] // Triple tap
}

export class HapticFeedback {
  private static enabled = true

  /**
   * Check if haptics are supported
   */
  static isSupported(): boolean {
    return 'vibrate' in navigator
  }

  /**
   * Trigger haptic feedback
   */
  static trigger(pattern: HapticPattern): void {
    if (!this.enabled || !this.isSupported()) return

    try {
      const vibrationPattern = PATTERNS[pattern]
      navigator.vibrate(vibrationPattern)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Enable/disable haptics (user preference)
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Convenience exports
export const haptic = {
  light: () => HapticFeedback.trigger('light'),
  medium: () => HapticFeedback.trigger('medium'),
  heavy: () => HapticFeedback.trigger('heavy'),
  error: () => HapticFeedback.trigger('error'),
  success: () => HapticFeedback.trigger('success'),
}
```

#### Step 2: Add Haptics to Message Send

In `MessageInput.tsx`:

```typescript
import { haptic } from '@/lib/utils/haptics'

const handleSendMessage = async () => {
  // ... existing validation ...

  try {
    await onSendMessage(content.trim())
    haptic.success() // Success feedback
    setContent('')
  } catch (error) {
    haptic.error() // Error feedback
    setError(error.message)
  }
}
```

#### Step 3: Add Haptics to Interactions

In `MessageBubble.tsx`:

```typescript
import { haptic } from '@/lib/utils/haptics'

// On button press
<Button
  onClick={() => {
    haptic.light()
    handleCopyMessage()
  }}
>
  Copy
</Button>

// On delete (heavier feedback)
<Button
  onClick={() => {
    haptic.medium()
    onDelete?.(message.id)
  }}
>
  Delete
</Button>
```

#### Step 4: User Preference (Optional)

Add to user settings:

```typescript
// In user preferences
const [hapticsEnabled, setHapticsEnabled] = useState(true)

useEffect(() => {
  HapticFeedback.setEnabled(hapticsEnabled)
}, [hapticsEnabled])
```

### Testing Checklist

- [ ] Haptic on message send (success pattern)
- [ ] Haptic on send error (error pattern)
- [ ] Light haptic on button taps
- [ ] Medium haptic on destructive actions
- [ ] Works on iOS and Android
- [ ] Graceful fallback on unsupported devices
- [ ] User can disable in settings (optional)

### Acceptance Criteria

✅ Haptic feedback on message send
✅ Different intensities for different actions
✅ Error pattern on failures
✅ Graceful fallback (no crashes)
✅ Configurable via user preferences (optional)

---

## 🚀 Implementation Workflow

### Before Starting

1. **Pull latest from main:**
   ```bash
   git pull origin main
   ```

2. **Verify Phase 1 changes are present:**
   ```bash
   git log --oneline -1  # Should show: 0891483 feat: Phase 1 mobile messaging...
   ```

3. **Check working state:**
   ```bash
   npm run build  # Verify everything compiles
   ```

### Development Process

1. **Work in order:** 2.1 → 2.2 → 2.3 → 2.4
2. **Commit after each phase:**
   ```bash
   git add components/messaging/
   git commit -m "feat: Phase 2.1 - Pull-to-refresh for messages 🤖 Generated with Claude Code"
   ```

3. **Push to deploy:**
   ```bash
   git push origin main  # Automatic Vercel deployment
   ```

4. **Test on production:**
   - Wait 1-2 minutes for deployment
   - Test at https://care-collective-preview.vercel.app
   - Use mobile device or browser DevTools mobile emulation

### After Each Sub-Phase

- [ ] Code compiles without TypeScript errors
- [ ] Tested on mobile viewport (375x667 minimum)
- [ ] Committed with descriptive message
- [ ] Pushed to main (auto-deploys)
- [ ] Verified on production

---

## 🧪 Testing Strategy

### Manual Testing

**Mobile Devices (Physical):**
- iPhone SE (375x667) - Minimum width
- iPhone 12 (390x844) - Modern phone
- iPad Mini (768x1024) - Tablet

**Desktop Browser Emulation:**
```javascript
// Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" or custom (375x667)
4. Test touch events (reload page after enabling)
```

### Automated Testing

Create `tests/messaging/mobile/phase2-mobile-ux.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard'

describe('Phase 2: Mobile UX Patterns', () => {
  describe('Pull-to-Refresh', () => {
    it('refreshes messages on pull gesture', async () => {
      // Test implementation
    })
  })

  describe('Swipe Gestures', () => {
    it('swipes right to go back', async () => {
      // Test implementation
    })

    it('swipes left to reveal actions', async () => {
      // Test implementation
    })
  })

  describe('Haptic Feedback', () => {
    it('triggers haptic on send', async () => {
      // Test implementation
    })
  })
})
```

---

## 🐛 Known Issues & Considerations

### Current Blockers (Pre-existing)

1. **Message Loading Error:** PGRST116 - Database returns 0 rows
   - This prevents testing with real conversation data
   - May need to seed test data or fix query
   - Not related to Phase 2 work

2. **React Errors in Production:** Minified React errors
   - Pre-existing, not introduced by Phase 1
   - Should investigate separately

### Technical Considerations

**Pull-to-Refresh:**
- May conflict with browser's pull-to-refresh (especially Chrome mobile)
- Use `touch-action: pan-y` CSS to prevent conflicts

**Swipe Gestures:**
- Must not interfere with horizontal scrolling
- iOS Safari has edge swipe for navigation - adjust thresholds
- Consider disabling swipe on edges (first/last 40px)

**Haptics:**
- Not supported on all devices (graceful fallback needed)
- Can be annoying if overused - be subtle
- Battery impact minimal but worth noting

**Performance:**
- All animations should be 60fps minimum
- Use `will-change` CSS for transform animations
- Test on low-end devices (throttled CPU in DevTools)

---

## 📚 Resources

### Libraries Documentation

- **react-pull-to-refresh:** https://github.com/bryik/react-pull-to-refresh
- **react-swipeable:** https://github.com/FormidableLabs/react-swipeable
- **framer-motion:** https://www.framer.com/motion/ (alternative for gestures)
- **Vibration API:** https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API

### Mobile UX Best Practices

- **iOS Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/
- **Material Design (Android):** https://m3.material.io/
- **WCAG Touch Target Size:** https://www.w3.org/WAI/WCAG21/Understanding/target-size.html

### Care Collective Specific

- **Brand Colors:** See `CLAUDE.md` - Sage (#7A9E99), Dusty Rose (#D8A8A0)
- **Design System:** Tailwind CSS 4 with custom Care Collective tokens
- **Component Library:** shadcn/ui components

---

## 📊 Success Metrics

### Phase 2 Complete When:

✅ Pull-to-refresh works smoothly on mobile
✅ Swipe gestures feel natural and responsive
✅ Keyboard integration enhanced
✅ Haptic feedback adds polish without being intrusive
✅ All features work on both iOS and Android
✅ Performance maintained (60fps animations)
✅ Accessibility not compromised
✅ Code follows Care Collective patterns
✅ Tests pass with 80%+ coverage
✅ Deployed to production and verified

### User Experience Goals

- Mobile messaging feels as good as WhatsApp/iMessage
- Interactions are intuitive without instruction
- Feedback is immediate and satisfying
- No lag or janky animations
- Works reliably on low-end devices

---

## 🎯 Next Session Quick Start

**Copy this prompt to start Phase 2:**

```
I want to continue implementing Phase 2 of the mobile messaging UI improvements.

Context: Phase 1 (critical bug fixes) is complete and deployed. Now I need to add native mobile UX patterns.

Please review docs/development/PHASE_2_MOBILE_UX_PATTERNS.md and help me implement Phase 2.1 (Pull-to-Refresh) first.

Start by:
1. Confirming Phase 1 changes are present in the code
2. Installing react-pull-to-refresh
3. Implementing pull-to-refresh on the message list

Follow the implementation guide in the doc and use Care Collective brand colors (sage: #7A9E99).
```

---

## 📝 Notes

- All Phase 2 work builds on Phase 1 (touch detection, viewport handling, etc.)
- Maintain WCAG 2.1 AA compliance throughout
- Test on actual mobile devices when possible
- Keep commits small and focused (one feature per commit)
- Update this document with any gotchas or learnings

**Happy coding! 🚀**
