# Phase 2.3 Testing Session: Visual Design Polish Verification

**Session Type:** E2E Testing with Playwright MCP
**Target:** Phase 2.3 Messaging Visual Enhancements
**Tools:** Playwright MCP, Accessibility MCP, Browser automation
**Estimated Duration:** 2-3 hours
**Priority:** High - Production validation before user rollout

---

## 🎯 Session Objectives

Validate all Phase 2.3 visual design improvements using automated browser testing:

1. **Avatar Integration** - Profile pictures display correctly with fallbacks
2. **Message Animations** - Smooth slide-in effects perform at 60fps
3. **Read Receipts** - Status icons show correct states
4. **Typing Indicators** - Wave animation works smoothly
5. **Visual Polish** - Shadows, tails, and modern chat UI rendering
6. **Mobile UX** - Touch targets, viewport handling, keyboard behavior
7. **Accessibility** - WCAG 2.1 AA compliance maintained
8. **Performance** - No layout shifts, smooth animations

---

## 📋 Pre-Session Checklist

### Environment Setup
- [ ] Verify production deployment completed successfully
- [ ] Confirm database migration applied (avatar_url column exists)
- [ ] Check Vercel deployment logs for errors
- [ ] Ensure test user accounts available

### Test Data Requirements
- [ ] **Test User 1** - With profile picture uploaded
- [ ] **Test User 2** - Without profile picture (fallback to initials)
- [ ] **Active Conversation** - Between Test User 1 and 2 with messages
- [ ] **Multiple Message Types** - Text, system messages, flagged messages

### Playwright MCP Setup
- [ ] Verify Playwright browser installed (`mcp__playwright__browser_install` if needed)
- [ ] Set browser viewport for mobile testing (375x667 for iPhone)
- [ ] Set browser viewport for desktop testing (1920x1080)

---

## 🧪 Test Suite 1: Avatar Display & Fallback

### Test 1.1: Avatar in MessageBubble
**Objective:** Verify avatars display next to messages

**Steps:**
```typescript
// Navigate to messaging
mcp__playwright__browser_navigate({ url: "https://care-collective-preview.vercel.app/messages" })

// Take snapshot to find conversation
mcp__playwright__browser_snapshot()

// Click on a conversation (use ref from snapshot)
mcp__playwright__browser_click({
  element: "First conversation in list",
  ref: "[aria-selected='false']:first-of-type"
})

// Wait for messages to load
mcp__playwright__browser_wait_for({ time: 2 })

// Take screenshot of message thread
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-message-avatars.png",
  type: "png"
})

// Snapshot to verify avatar elements exist
mcp__playwright__browser_snapshot()
```

**Expected Results:**
- ✅ Avatars visible next to each message bubble
- ✅ Avatar size is 32px (md size)
- ✅ Avatars aligned to bottom of message (mt-auto)
- ✅ Gap between avatar and message bubble is consistent

**Validation:**
- Look for Avatar component elements in snapshot
- Verify image elements or initials divs present
- Check fallback initials for users without photos

---

### Test 1.2: Avatar Fallback to Initials
**Objective:** Verify initials display when no profile picture

**Steps:**
```typescript
// In message thread, find message from user without avatar
mcp__playwright__browser_snapshot()

// Look for avatar with initials (not image)
// Verify div with bg-dusty-rose and text content
```

**Expected Results:**
- ✅ Initials displayed in colored circle
- ✅ Background color is dusty-rose (#D8A8A0)
- ✅ Initials are uppercase (max 2 characters)
- ✅ Text color is white for contrast

---

### Test 1.3: Avatar in ConversationList
**Objective:** Verify large avatars in conversation list

**Steps:**
```typescript
// Go back to conversation list
mcp__playwright__browser_navigate_back()

// Take snapshot of conversation list
mcp__playwright__browser_snapshot()

// Take screenshot
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-conversation-list-avatars.png",
  type: "png"
})
```

**Expected Results:**
- ✅ Large avatars (48px) next to each conversation
- ✅ Avatar positioned at top of conversation item
- ✅ Proper spacing with flex gap-3
- ✅ All conversations show avatar or initials

---

### Test 1.4: Avatar in ConversationHeader
**Objective:** Verify avatar in header with participant name

**Steps:**
```typescript
// Click into conversation again
mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

// Snapshot header area
mcp__playwright__browser_snapshot()

// Take screenshot of header
mcp__playwright__browser_take_screenshot({
  element: "Conversation header",
  ref: "[data-component='conversation-header']",
  filename: "phase-2-3-header-avatar.png"
})
```

**Expected Results:**
- ✅ Medium avatar (32px) next to participant name
- ✅ Avatar aligned with name and presence indicator
- ✅ Proper spacing in header layout

---

## 🎨 Test Suite 2: Message Bubble Visual Polish

### Test 2.1: Message Bubble Styling
**Objective:** Verify modern chat UI styling

**Steps:**
```typescript
// In message thread, inspect message bubbles
mcp__playwright__browser_snapshot()

// Evaluate bubble styling
mcp__playwright__browser_evaluate({
  function: `() => {
    const bubbles = document.querySelectorAll('[role="article"]');
    if (bubbles.length === 0) return { error: 'No message bubbles found' };

    const firstBubble = bubbles[0];
    const styles = window.getComputedStyle(firstBubble.querySelector('.rounded-2xl'));

    return {
      bubbleCount: bubbles.length,
      borderRadius: styles.borderRadius,
      boxShadow: styles.boxShadow,
      maxWidth: styles.maxWidth,
      hasAnimation: firstBubble.classList.contains('animate-in')
    };
  }`
})
```

**Expected Results:**
- ✅ Border radius: rounded-2xl applied
- ✅ Box shadow: shadow-md present
- ✅ Max width: 70% of container
- ✅ Animation classes present (animate-in fade-in slide-in-from-bottom-2)

---

### Test 2.2: Message Tail Effect
**Objective:** Verify directional rounded corners

**Steps:**
```typescript
// Check own messages vs other messages
mcp__playwright__browser_evaluate({
  function: `() => {
    const ownMessage = document.querySelector('.justify-end [role="article"]');
    const otherMessage = document.querySelector('.justify-start [role="article"]');

    if (!ownMessage || !otherMessage) {
      return { error: 'Missing message types' };
    }

    const ownBubble = ownMessage.querySelector('.rounded-2xl');
    const otherBubble = otherMessage.querySelector('.rounded-2xl');

    return {
      ownHasRoundedTrNone: ownBubble.classList.contains('rounded-tr-none'),
      otherHasRoundedTlNone: otherBubble.classList.contains('rounded-tl-none')
    };
  }`
})
```

**Expected Results:**
- ✅ Own messages: rounded-tr-none (tail on top-right)
- ✅ Other messages: rounded-tl-none (tail on top-left)
- ✅ Creates WhatsApp/iMessage-style message tails

---

### Test 2.3: Hover Effects
**Objective:** Verify shadow enhancement on hover

**Steps:**
```typescript
// Hover over a message bubble
mcp__playwright__browser_hover({
  element: "First message bubble",
  ref: "[role='article']:first-of-type .rounded-2xl"
})

// Wait for transition
mcp__playwright__browser_wait_for({ time: 0.3 })

// Take screenshot during hover
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-bubble-hover.png"
})
```

**Expected Results:**
- ✅ Shadow increases from shadow-md to shadow-lg
- ✅ Transition is smooth (200ms duration)
- ✅ No layout shift occurs

---

## ✅ Test Suite 3: Read Receipt Validation

### Test 3.1: Read Receipt Display
**Objective:** Verify read receipt icons are visible and correct

**Steps:**
```typescript
// Find own messages with read receipts
mcp__playwright__browser_evaluate({
  function: `() => {
    const ownMessages = document.querySelectorAll('.justify-end [role="article"]');
    const receipts = [];

    ownMessages.forEach((msg, index) => {
      const receiptIcon = msg.querySelector('[aria-label*="Read"], [aria-label*="Delivered"], [aria-label*="Sent"]');
      if (receiptIcon) {
        receipts.push({
          messageIndex: index,
          ariaLabel: receiptIcon.getAttribute('aria-label'),
          svgClass: receiptIcon.tagName.toLowerCase(),
          color: window.getComputedStyle(receiptIcon).color
        });
      }
    });

    return { receipts, totalOwn: ownMessages.length };
  }`
})
```

**Expected Results:**
- ✅ All own messages show read receipt icon
- ✅ Icons are 16px (w-4 h-4) - larger than before
- ✅ Read messages show CheckCheck icon in sage color
- ✅ Delivered messages show CheckCheck in gray
- ✅ Sent messages show single Check in gray

---

### Test 3.2: Read Receipt Positioning
**Objective:** Verify receipts positioned correctly

**Steps:**
```typescript
// Snapshot message timestamp area
mcp__playwright__browser_snapshot()

// Take screenshot of timestamp/receipt area
mcp__playwright__browser_take_screenshot({
  element: "Message timestamp area",
  ref: "[role='article']:first-of-type time",
  filename: "phase-2-3-read-receipts.png"
})
```

**Expected Results:**
- ✅ Receipt icon positioned next to timestamp
- ✅ flex-row-reverse layout for own messages
- ✅ Gap between elements is 1.5 (gap-1.5)
- ✅ Vertically aligned with timestamp

---

## 🌊 Test Suite 4: Typing Indicator Animation

### Test 4.1: Typing Indicator Wave Effect
**Objective:** Verify smooth wave animation

**Steps:**
```typescript
// This test requires simulating typing or finding existing typing indicator
// Navigate to a conversation where typing might occur
// Or use evaluate to check component structure

mcp__playwright__browser_evaluate({
  function: `() => {
    // Check if TypingIndicator component exists
    const indicator = document.querySelector('[role="status"][aria-live="polite"]');

    if (!indicator) return { present: false };

    const dots = indicator.querySelectorAll('.animate-bounce');
    const delays = Array.from(dots).map(dot =>
      window.getComputedStyle(dot).animationDelay
    );

    return {
      present: true,
      dotCount: dots.length,
      animationDelays: delays,
      hasWaveEffect: delays.length === 3,
      expectedDelays: ['0ms', '150ms', '300ms']
    };
  }`
})
```

**Expected Results:**
- ✅ Three bouncing dots present
- ✅ Staggered delays: 0ms, 150ms, 300ms
- ✅ Animation duration: 1000ms
- ✅ Dots size: 8px (w-2 h-2)
- ✅ Smooth wave effect visible

---

### Test 4.2: Typing Indicator Entrance
**Objective:** Verify slide-in animation

**Steps:**
```typescript
// Check for entrance animation classes
mcp__playwright__browser_evaluate({
  function: `() => {
    const indicator = document.querySelector('[role="status"]');
    if (!indicator) return { found: false };

    return {
      found: true,
      hasAnimateIn: indicator.classList.contains('animate-in'),
      hasFadeIn: indicator.classList.contains('fade-in'),
      hasSlideIn: indicator.classList.contains('slide-in-from-bottom-2'),
      duration: indicator.classList.contains('duration-300')
    };
  }`
})
```

**Expected Results:**
- ✅ animate-in class present
- ✅ fade-in class present
- ✅ slide-in-from-bottom-2 class present
- ✅ duration-300 for smooth entrance

---

## 📱 Test Suite 5: Mobile UX Validation

### Test 5.1: Mobile Viewport - Avatar Touch Targets
**Objective:** Verify touch targets meet 44px minimum on mobile

**Steps:**
```typescript
// Resize to mobile viewport
mcp__playwright__browser_resize({
  width: 375,
  height: 667
})

// Navigate to messages
mcp__playwright__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

// Take mobile screenshot
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-mobile-messages.png",
  fullPage: true
})

// Check touch target sizes
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

    return { touchTargets, allMeetMinimum: touchTargets.every(t => t.meetsMinimum) };
  }`
})
```

**Expected Results:**
- ✅ All conversation items are ≥44px tall
- ✅ Avatars are visible and properly sized
- ✅ Text doesn't overlap on small screens
- ✅ Layout adapts to mobile width

---

### Test 5.2: Mobile - Message Bubbles
**Objective:** Verify message bubbles work well on mobile

**Steps:**
```typescript
// Click into a conversation
mcp__playwright__browser_snapshot()

mcp__playwright__browser_click({
  element: "First conversation",
  ref: "[role='option']:first-of-type"
})

// Wait for messages
mcp__playwright__browser_wait_for({ time: 2 })

// Take screenshot of mobile messages
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-mobile-message-bubbles.png",
  fullPage: false
})

// Check bubble max-width on mobile
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
        fitsScreen: rect.width <= viewportWidth * 0.7
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
- ✅ Bubbles max 70% of screen width
- ✅ Avatars don't cause horizontal scroll
- ✅ Text is readable (no tiny fonts)
- ✅ Proper spacing maintained

---

### Test 5.3: Mobile - Keyboard Handling
**Objective:** Verify viewport fix handles keyboard

**Steps:**
```typescript
// Focus on message input
mcp__playwright__browser_click({
  element: "Message input field",
  ref: "textarea[placeholder*='Type']"
})

// Type a message
mcp__playwright__browser_type({
  element: "Message input",
  ref: "textarea[placeholder*='Type']",
  text: "Testing mobile keyboard behavior",
  slowly: false
})

// Wait for typing indicator (if implemented)
mcp__playwright__browser_wait_for({ time: 1 })

// Take screenshot with keyboard open
mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-mobile-keyboard.png"
})
```

**Expected Results:**
- ✅ Input stays visible above keyboard
- ✅ ViewportFix handles URL bar changes
- ✅ No layout collapse when keyboard opens
- ✅ Message thread scrolls appropriately

---

## ♿ Test Suite 6: Accessibility Compliance

### Test 6.1: WCAG 2.1 AA Scan
**Objective:** Verify no new accessibility violations

**Steps:**
```typescript
// Use accessibility MCP to scan messaging page
mcp__a11y__browser_navigate({
  url: "https://care-collective-preview.vercel.app/messages"
})

// Wait for page load
mcp__a11y__browser_wait_for({ time: 3 })

// Run accessibility scan
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
- ✅ All images have alt text (avatars)
- ✅ Color contrast passes WCAG AA (4.5:1)
- ✅ ARIA labels present on status icons
- ✅ Semantic HTML maintained

---

### Test 6.2: Screen Reader Compatibility
**Objective:** Verify proper ARIA labels

**Steps:**
```typescript
// Check ARIA labels on key elements
mcp__a11y__browser_evaluate({
  function: `() => {
    const results = {
      messageArticles: [],
      avatars: [],
      readReceipts: [],
      typingIndicator: null
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
    document.querySelectorAll('[aria-label*="Read"], [aria-label*="Sent"], [aria-label*="Delivered"]').forEach((receipt, i) => {
      results.readReceipts.push({
        index: i,
        labelText: receipt.getAttribute('aria-label')
      });
    });

    // Check typing indicator
    const typingInd = document.querySelector('[role="status"][aria-live="polite"]');
    if (typingInd) {
      results.typingIndicator = {
        role: typingInd.getAttribute('role'),
        ariaLive: typingInd.getAttribute('aria-live'),
        ariaLabel: typingInd.getAttribute('aria-label')
      };
    }

    return results;
  }`
})
```

**Expected Results:**
- ✅ All message articles have aria-label="Message from [name]"
- ✅ All avatars have aria-label="[name]'s avatar"
- ✅ Read receipts have aria-label (Read/Sent/Delivered)
- ✅ Typing indicator has role="status" and aria-live="polite"

---

### Test 6.3: Keyboard Navigation
**Objective:** Verify keyboard-only navigation works

**Steps:**
```typescript
// Navigate with Tab key
mcp__a11y__browser_press_key({ key: "Tab" })
mcp__a11y__browser_wait_for({ time: 0.5 })

// Take screenshot of focused element
mcp__a11y__browser_take_screenshot({
  filename: "phase-2-3-keyboard-focus.png"
})

// Tab through conversations
mcp__a11y__browser_press_key({ key: "Tab" })
mcp__a11y__browser_press_key({ key: "Tab" })

// Press Enter to select
mcp__a11y__browser_press_key({ key: "Enter" })
```

**Expected Results:**
- ✅ Focus visible on all interactive elements
- ✅ Tab order is logical
- ✅ Enter key activates conversations
- ✅ Focus styles meet contrast requirements

---

## 🚀 Test Suite 7: Performance Validation

### Test 7.1: Layout Shift (CLS) Check
**Objective:** Verify no layout shifts from avatars

**Steps:**
```typescript
// Measure Cumulative Layout Shift
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

      // Wait 3 seconds to measure
      setTimeout(() => {
        observer.disconnect();
        resolve({
          cls,
          passes: cls < 0.1,
          rating: cls < 0.1 ? 'Good' : cls < 0.25 ? 'Needs Improvement' : 'Poor'
        });
      }, 3000);
    });
  }`
})
```

**Expected Results:**
- ✅ CLS score < 0.1 (Good)
- ✅ Avatar loading doesn't cause shifts
- ✅ Message animations don't shift layout

---

### Test 7.2: Animation Frame Rate
**Objective:** Verify 60fps animations

**Steps:**
```typescript
// Measure frame rate during scroll
mcp__playwright__browser_evaluate({
  function: `() => {
    return new Promise((resolve) => {
      const frameT times = [];
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
- ✅ Average FPS ≥55 (smooth)
- ✅ Frame time <18ms
- ✅ No dropped frames visible

---

## 📊 Test Suite 8: Visual Regression

### Test 8.1: Screenshot Comparison
**Objective:** Capture baseline screenshots for future comparison

**Steps:**
```typescript
// Desktop viewport
mcp__playwright__browser_resize({ width: 1920, height: 1080 })

mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-baseline-desktop.png",
  fullPage: true
})

// Tablet viewport
mcp__playwright__browser_resize({ width: 768, height: 1024 })

mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-baseline-tablet.png",
  fullPage: true
})

// Mobile viewport
mcp__playwright__browser_resize({ width: 375, height: 667 })

mcp__playwright__browser_take_screenshot({
  filename: "phase-2-3-baseline-mobile.png",
  fullPage: true
})
```

**Deliverable:**
- ✅ Baseline screenshots for desktop, tablet, mobile
- ✅ Store in docs/testing/visual-regression/phase-2-3/
- ✅ Use for future regression testing

---

## ✅ Test Completion Checklist

### Avatar Tests
- [ ] Avatars display in MessageBubble (32px)
- [ ] Avatars display in ConversationList (48px)
- [ ] Avatars display in ConversationHeader (32px)
- [ ] Fallback initials work correctly
- [ ] Image loading handles errors gracefully

### Visual Polish Tests
- [ ] Message bubbles have rounded-2xl with tails
- [ ] Shadows present (shadow-md hover:shadow-lg)
- [ ] Max width 70% maintained
- [ ] Slide-in animations smooth
- [ ] Hover effects work

### Read Receipt Tests
- [ ] Icons are 16px (w-4 h-4)
- [ ] Read status shows sage CheckCheck
- [ ] Delivered shows gray CheckCheck
- [ ] Sent shows gray single Check
- [ ] Positioning correct

### Typing Indicator Tests
- [ ] Wave animation with staggered delays
- [ ] Entrance animation smooth
- [ ] ARIA labels present
- [ ] Visually pleasing

### Mobile Tests
- [ ] Touch targets ≥44px
- [ ] Viewport handles keyboard
- [ ] Bubbles fit screen
- [ ] Avatars render correctly

### Accessibility Tests
- [ ] 0 WCAG 2.1 AA violations
- [ ] ARIA labels correct
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### Performance Tests
- [ ] CLS < 0.1
- [ ] FPS ≥55
- [ ] No layout shifts

---

## 📝 Test Report Template

```markdown
# Phase 2.3 Testing Report

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** Production (care-collective-preview.vercel.app)

## Summary
- Total Tests: [NUMBER]
- Passed: [NUMBER]
- Failed: [NUMBER]
- Blocked: [NUMBER]

## Detailed Results

### Avatar Integration
- MessageBubble: ✅/❌
- ConversationList: ✅/❌
- ConversationHeader: ✅/❌
- Fallback: ✅/❌

### Visual Polish
- Styling: ✅/❌
- Animations: ✅/❌
- Hover: ✅/❌

### Read Receipts
- Display: ✅/❌
- States: ✅/❌
- Positioning: ✅/❌

### Typing Indicator
- Wave: ✅/❌
- Entrance: ✅/❌
- Accessibility: ✅/❌

### Mobile UX
- Touch Targets: ✅/❌
- Keyboard: ✅/❌
- Layout: ✅/❌

### Accessibility
- WCAG Scan: ✅/❌
- ARIA: ✅/❌
- Keyboard Nav: ✅/❌

### Performance
- CLS: [SCORE]
- FPS: [SCORE]
- Overall: ✅/❌

## Issues Found
1. [Issue description]
2. [Issue description]

## Screenshots
- [List screenshots captured]

## Recommendations
- [Action items]
```

---

## 🚀 Post-Testing Actions

### If All Tests Pass ✅
1. Update QUICK_REFERENCE.md to mark Phase 2.3 tested
2. Document baseline screenshots for regression testing
3. Share results with stakeholders
4. Proceed to Phase 3.1 (Dashboard Optimization)

### If Tests Fail ❌
1. Document failures with screenshots
2. Create GitHub issues for bugs
3. Prioritize fixes based on severity
4. Re-test after fixes deployed

---

## 💡 Testing Tips

### Playwright MCP Best Practices
1. **Always snapshot first** - Use `browser_snapshot()` before clicking to find correct refs
2. **Wait for animations** - Use `browser_wait_for()` after interactions
3. **Take screenshots** - Capture evidence of visual states
4. **Evaluate for metrics** - Use `browser_evaluate()` for detailed checks
5. **Test multiple viewports** - Desktop, tablet, mobile

### Common Pitfalls to Avoid
- ❌ Clicking before page loads
- ❌ Using hardcoded selectors (use refs from snapshots)
- ❌ Forgetting to resize for mobile tests
- ❌ Not waiting for animations to complete
- ❌ Missing accessibility checks

---

## 📚 Reference Documentation

- **Phase 2.3 Summary:** `docs/launch-2026/PHASE_2.3_COMPLETION_SUMMARY.md`
- **Implementation Details:** Git commit `7ab5011`
- **Playwright MCP Docs:** Use claude-code-guide agent for MCP questions
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Ready to begin testing!** Start with Test Suite 1 and work sequentially through all test suites. Document all findings and capture screenshots for evidence.
