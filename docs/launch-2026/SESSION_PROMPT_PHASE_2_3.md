# Phase 2.3 Session Prompt: Messaging Visual Design Polish

**Session Date:** [To be filled when starting]
**Phase:** 2.3 - Messaging Visual Design Polish (Week 5 of Launch Plan)
**Priority:** 🚨 Critical (Client's Top Priority - UI/UX Polish)
**Estimated Duration:** 4-6 hours (1-2 focused sessions)
**Context Engineering:** PRP Method (Planning 20% | Research 25% | Production 55%)

---

## 🎯 Session Objectives

### Primary Goals

1. **Polish Message Bubble Design** - Beautiful, intuitive message UI with proper styling
2. **Add Read Receipts** - Visual confirmation when messages are seen
3. **Enhance Typing Indicators** - Smooth, animated typing awareness
4. **Mobile UX Optimization** - Perfect mobile keyboard handling and touch interactions
5. **Avatar Integration** - Profile pictures in conversations

### Success Criteria

- ✅ Message bubbles follow modern chat UI patterns (WhatsApp/iMessage style)
- ✅ Read receipts visible for sent messages
- ✅ Typing indicators smooth and performant
- ✅ Mobile experience tested on iOS Safari and Android Chrome
- ✅ Avatar images display correctly with fallbacks
- ✅ Zero layout shifts or visual glitches
- ✅ Accessibility maintained (WCAG 2.1 AA)
- ✅ Performance budget maintained (<50KB bundle increase)

---

## 📋 Current State Analysis

### ✅ Completed in Previous Phases

**Phase 2.1** (Completed):
- Messaging onboarding flow with tooltips
- Empty states with clear CTAs
- Contextual help icons
- Loading skeletons

**Phase 2.2** (Completed):
- Message pagination with infinite scroll
- React Query caching layer
- Optimized real-time subscriptions
- 50%+ faster message loading

**Phase 1** (Completed):
- Foundation fixes for auth, navbar, footer
- Performance optimization groundwork

### 🎯 Current Gaps (Phase 2.3 Focus)

1. **Message Bubbles**: Basic design, needs visual polish
2. **Read Receipts**: Not implemented
3. **Typing Indicators**: Exist but need animation polish
4. **Mobile UX**: Keyboard handling needs testing
5. **Avatars**: Profile pictures not integrated in messaging

---

## 🛠️ Implementation Tasks

### Task 1: Polish Message Bubble Design (90 minutes)

**Objective:** Create beautiful, modern message bubbles with proper styling

**Files to Modify:**
- `components/messaging/MessageBubble.tsx`
- `components/messaging/MessageThread.tsx`
- `app/messages/globals.css` (if needed for animations)

**Implementation Pattern:**

```typescript
// components/messaging/MessageBubble.tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils/date'
import { CheckCheck, Check } from 'lucide-react'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    created_at: string
    read_at?: string
    sender: {
      id: string
      name: string
      avatar?: string
    }
  }
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const initials = message.sender.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        "flex gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      role="article"
      aria-label={`Message from ${message.sender.name}`}
    >
      {/* Avatar - only show if enabled */}
      {showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage
            src={message.sender.avatar}
            alt={`${message.sender.name}'s profile picture`}
          />
          <AvatarFallback className="bg-sage/20 text-sage text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm break-words",
            "transition-all duration-200 hover:shadow-md",
            isOwn
              ? "bg-sage text-white rounded-tr-none"
              : "bg-gray-100 text-gray-900 rounded-tl-none dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp and Read Receipt */}
        <div className={cn(
          "flex items-center gap-1 px-2",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(message.created_at)}
          </p>

          {/* Read Receipt (only for own messages) */}
          {isOwn && (
            <span className="flex items-center">
              {message.read_at ? (
                <CheckCheck
                  className="w-3 h-3 text-sage"
                  aria-label="Message read"
                />
              ) : (
                <Check
                  className="w-3 h-3 text-gray-400"
                  aria-label="Message sent"
                />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Design Requirements:**
- Rounded corners (2xl) with directional cutoff (tr for own, tl for other)
- Max width 70% for better readability
- Smooth animations on message appearance
- Proper color contrast for accessibility
- Shadow effects for depth
- Break-word for long URLs or text
- Hover states for interactive feel

### Task 2: Implement Read Receipts (60 minutes)

**Objective:** Add visual confirmation when messages are seen

**Files to Modify:**
- `lib/messaging/queries.ts`
- `components/messaging/MessageBubble.tsx` (already updated above)
- `components/messaging/MessageThread.tsx`

**Database Pattern:**

```sql
-- Ensure messages_v2 table has read_at column
-- If not, create migration:
-- supabase/migrations/[timestamp]_add_message_read_at.sql

ALTER TABLE messages_v2
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE messages_v2
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Client Implementation:**

```typescript
// lib/messaging/queries.ts
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: userId
    })

  if (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }
}

// components/messaging/MessageThread.tsx
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export function MessageThread({ conversationId, currentUserId }: Props) {
  const { ref, inView } = useInView({
    threshold: 0.5,
    delay: 1000 // Wait 1 second before marking as read
  })

  // Mark messages as read when thread is visible
  useEffect(() => {
    if (inView && conversationId) {
      markMessagesAsRead(conversationId, currentUserId)
        .catch(err => console.error('Failed to mark as read:', err))
    }
  }, [inView, conversationId, currentUserId])

  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4">
      {/* Messages */}
    </div>
  )
}
```

### Task 3: Enhanced Typing Indicators (45 minutes)

**Objective:** Smooth, animated typing awareness

**Files to Create/Modify:**
- `components/messaging/TypingIndicator.tsx`
- `components/messaging/MessageThread.tsx`

**Implementation:**

```typescript
// components/messaging/TypingIndicator.tsx
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  userName: string
  className?: string
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`${userName} is typing`}
    >
      {/* Animated dots */}
      <div className="flex gap-1" aria-hidden="true">
        <span
          className="w-2 h-2 bg-sage rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1000ms' }}
        />
        <span
          className="w-2 h-2 bg-sage rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1000ms' }}
        />
        <span
          className="w-2 h-2 bg-sage rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1000ms' }}
        />
      </div>
      <span>{userName} is typing...</span>
    </div>
  )
}

// Usage in MessageThread.tsx
import { useTypingStatus } from '@/hooks/useTypingStatus'

export function MessageThread({ conversationId, otherUser }: Props) {
  const isOtherUserTyping = useTypingStatus(conversationId, otherUser.id)

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <VirtualizedMessageList messages={messages} />
      </div>

      {/* Typing Indicator */}
      {isOtherUserTyping && (
        <TypingIndicator
          userName={otherUser.name}
          className="border-t border-gray-200 dark:border-gray-800"
        />
      )}

      {/* Message Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
```

### Task 4: Mobile UX Testing & Fixes (60 minutes)

**Objective:** Perfect mobile keyboard handling and touch interactions

**Testing Checklist:**
- [ ] iOS Safari: Keyboard opens/closes smoothly
- [ ] iOS Safari: Viewport resizes correctly with keyboard
- [ ] Android Chrome: Keyboard doesn't cover input
- [ ] Android Chrome: Scroll-to-bottom works when keyboard opens
- [ ] Both: Touch targets meet 44px minimum
- [ ] Both: Swipe gestures don't conflict
- [ ] Both: Auto-scroll to new message works
- [ ] Both: Message input stays visible when keyboard open

**Files to Review/Modify:**
- `components/messaging/ViewportFix.tsx` (already exists)
- `components/messaging/MessageInput.tsx`
- `components/messaging/MessageThread.tsx`

**Mobile-Specific Improvements:**

```typescript
// components/messaging/MessageInput.tsx
import { useRef, useEffect } from 'react'

export function MessageInput({ conversationId, onSend }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Auto-scroll to input when focused (mobile)
  useEffect(() => {
    if (isFocused && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 100) // Wait for keyboard animation
    }
  }, [isFocused])

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          className={cn(
            "flex-1 resize-none rounded-2xl px-4 py-3",
            "min-h-[44px] max-h-32", // Accessibility: 44px minimum
            "border border-gray-300 dark:border-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-sage",
            "text-sm"
          )}
          placeholder="Type a message..."
          rows={1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Auto-expand as user types
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${target.scrollHeight}px`
          }}
        />

        <button
          type="submit"
          className={cn(
            "btn-primary",
            "min-w-[44px] min-h-[44px]", // Accessibility: 44px minimum
            "rounded-full flex items-center justify-center"
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

### Task 5: Avatar Integration (45 minutes)

**Objective:** Profile pictures in conversations with fallbacks

**Files to Modify:**
- `components/messaging/ConversationList.tsx`
- `components/messaging/MessageBubble.tsx` (already updated in Task 1)
- `components/messaging/MessageThread.tsx`

**Implementation:**

```typescript
// components/messaging/ConversationList.tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function ConversationItem({ conversation }: Props) {
  const otherUser = conversation.other_user
  const initials = otherUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      className={cn(
        "w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800",
        "transition-colors duration-200",
        "text-left border-b border-gray-200 dark:border-gray-800"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      {/* Avatar with online status indicator */}
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={otherUser.avatar_url}
            alt={`${otherUser.name}'s profile picture`}
          />
          <AvatarFallback className="bg-sage/20 text-sage">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Online status indicator (if presence system exists) */}
        {otherUser.is_online && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"
            aria-label="Online"
          />
        )}
      </div>

      {/* Conversation info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm truncate">
            {otherUser.name}
          </h3>
          <time className="text-xs text-muted-foreground">
            {formatRelativeTime(conversation.last_message_at)}
          </time>
        </div>

        <p className="text-sm text-muted-foreground truncate">
          {conversation.last_message_content}
        </p>

        {/* Unread indicator */}
        {conversation.unread_count > 0 && (
          <span className="mt-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-sage text-white text-xs font-medium rounded-full">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </button>
  )
}
```

---

## 🧪 Testing Strategy

### Visual Regression Testing

```typescript
// __tests__/messaging/MessageBubble.test.tsx
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/components/messaging/MessageBubble'

describe('MessageBubble', () => {
  it('renders own message with correct styling', () => {
    const message = {
      id: '1',
      content: 'Hello world',
      created_at: new Date().toISOString(),
      sender: {
        id: 'user-1',
        name: 'John Doe',
        avatar: '/avatar.jpg'
      }
    }

    render(<MessageBubble message={message} isOwn={true} />)

    const bubble = screen.getByRole('article')
    expect(bubble).toHaveClass('flex-row-reverse')
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('shows read receipt when message is read', () => {
    const message = {
      id: '1',
      content: 'Test',
      created_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
      sender: { id: '1', name: 'User', avatar: undefined }
    }

    render(<MessageBubble message={message} isOwn={true} />)

    expect(screen.getByLabelText('Message read')).toBeInTheDocument()
  })

  it('meets accessibility requirements', () => {
    const message = {
      id: '1',
      content: 'Test message',
      created_at: new Date().toISOString(),
      sender: { id: '1', name: 'Alice Smith', avatar: undefined }
    }

    render(<MessageBubble message={message} isOwn={false} />)

    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label', 'Message from Alice Smith')
  })
})
```

### Mobile Testing Checklist

**iOS Safari (iPhone 12+ or simulator):**
```bash
# Test keyboard behavior
1. Open messaging on real iOS device or simulator
2. Tap message input - keyboard should appear smoothly
3. Type message - input should stay visible above keyboard
4. Send message - keyboard should stay open
5. Receive message - should auto-scroll to new message
6. Tap outside input - keyboard should close
7. Scroll messages - should be 60fps smooth
```

**Android Chrome (Pixel or emulator):**
```bash
# Test keyboard behavior
1. Open messaging on Android device or emulator
2. Tap message input - keyboard should appear
3. Check viewport height - should resize correctly
4. Type long message - textarea should expand
5. Send message - should stay focused
6. Test back button - should close keyboard first
7. Test landscape mode - layout should adapt
```

### Performance Testing

```typescript
// __tests__/messaging/MessageBubble.performance.test.tsx
import { render } from '@testing-library/react'
import { MessageBubble } from '@/components/messaging/MessageBubble'

describe('MessageBubble Performance', () => {
  it('renders 100 messages in < 500ms', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      content: `Message ${i}`,
      created_at: new Date().toISOString(),
      sender: { id: '1', name: 'User', avatar: undefined }
    }))

    const startTime = performance.now()

    const { container } = render(
      <div>
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={i % 2 === 0}
          />
        ))}
      </div>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    expect(renderTime).toBeLessThan(500)
    expect(container.querySelectorAll('[role="article"]')).toHaveLength(100)
  })
})
```

---

## 📊 Success Metrics & Validation

### Visual Design Quality

- [ ] Message bubbles match modern chat UI patterns (WhatsApp/iMessage)
- [ ] Animations are smooth (60fps)
- [ ] Colors meet WCAG 2.1 AA contrast requirements (4.5:1 for text)
- [ ] Rounded corners and shadows create proper depth
- [ ] Layout is balanced and aesthetically pleasing

### Functional Requirements

- [ ] Read receipts update in real-time
- [ ] Typing indicators appear within 500ms of typing start
- [ ] Typing indicators disappear within 2s of typing stop
- [ ] Avatars load with proper fallbacks
- [ ] Mobile keyboard handling is perfect on iOS and Android

### Performance Budget

- [ ] Bundle size increase: <50KB
- [ ] Message bubble render: <16ms (60fps)
- [ ] Avatar image loading: Progressive with placeholders
- [ ] Animation performance: 60fps on mobile
- [ ] No layout shifts (CLS score: 0)

### Accessibility Compliance

- [ ] All interactive elements have 44px minimum touch targets
- [ ] ARIA labels present for status indicators
- [ ] Keyboard navigation works for all features
- [ ] Screen reader announces new messages
- [ ] Color contrast meets WCAG 2.1 AA standards

---

## 🔗 Integration Points

### Integration with Phase 2.1 & 2.2

**Onboarding System (Phase 2.1):**
- Polished UI complements onboarding tooltips
- Visual design reinforces learned patterns
- Smooth animations support learning flow

**Performance System (Phase 2.2):**
- Maintain pagination performance
- Keep React Query caching efficient
- Real-time updates work with new UI

**ViewportFix (Existing):**
- Ensure mobile keyboard handling still works
- Test with new message input design
- Verify scroll behavior with animations

### Integration with Future Phases

**Phase 3 (Dashboard & Profiles):**
- Avatar system will be reused for profiles
- Consistent design patterns across platform

**Phase 7 (E2E Testing):**
- Visual tests for message bubbles
- Mobile UX test coverage
- Read receipt verification tests

---

## 🎯 Session Timeline

### Session 1 (3-4 hours): Visual Polish

**Hour 1: Message Bubble Design**
- Implement MessageBubble component with new styling
- Add animations and hover effects
- Test color contrast and accessibility

**Hour 2: Read Receipts**
- Create database migration for read_at column
- Implement mark_messages_read RPC function
- Add read receipt UI to MessageBubble
- Test real-time read status updates

**Hour 3: Typing Indicators & Avatars**
- Polish TypingIndicator component
- Integrate avatars in ConversationList
- Add avatar support to MessageBubble
- Test fallback scenarios

**Hour 4: Mobile Testing**
- Test on iOS Safari (real device or simulator)
- Test on Android Chrome (real device or emulator)
- Fix any keyboard handling issues
- Verify 44px touch targets

### Session 2 (Optional, 1-2 hours): Polish & Testing

**Hour 1: Final Polish**
- Address any visual inconsistencies
- Smooth out animations
- Add micro-interactions
- Performance optimization

**Hour 2: Testing & Documentation**
- Run E2E tests
- Verify accessibility
- Update documentation
- Create demo video for client

---

## ✅ Definition of Done

### Visual Design Complete
- [ ] Message bubbles match approved design
- [ ] Animations are smooth and performant
- [ ] Color scheme is consistent with brand
- [ ] All states (own/other, read/unread, typing) look polished

### Functional Features Complete
- [ ] Read receipts working end-to-end
- [ ] Typing indicators appear and disappear correctly
- [ ] Avatars load with proper fallbacks
- [ ] Mobile keyboard handling is perfect

### Quality Assurance
- [ ] All tests passing (unit + E2E)
- [ ] Accessibility verified (WCAG 2.1 AA)
- [ ] Performance budget maintained
- [ ] Mobile tested on iOS and Android
- [ ] Visual regression tests added

### Documentation Updated
- [ ] Component documentation for MessageBubble
- [ ] Database migration for read_at column
- [ ] Testing guide for mobile UX
- [ ] Update QUICK_REFERENCE.md with Phase 2.3 completion

### Client Deliverables
- [ ] Demo video showing before/after
- [ ] Mobile demo on real devices
- [ ] Performance metrics comparison
- [ ] User feedback from testing (if available)

---

## 📝 Pre-Session Checklist

**Review Before Starting:**
- [ ] Read Phase 2 plan: `docs/launch-2026/phases/phase-2-messaging.md`
- [ ] Review master plan: `docs/launch-2026/MASTER_PLAN.md`
- [ ] Check current status: `PROJECT_STATUS.md`
- [ ] Understand PRP method: `docs/context-engineering/prp-method/README.md`

**Environment Setup:**
- [ ] Pull latest from main branch
- [ ] Ensure dev server runs without errors (`npm run dev`)
- [ ] Verify database connection works
- [ ] Have iOS device/simulator ready for testing
- [ ] Have Android device/emulator ready for testing

**Context Preparation:**
- [ ] Familiarize with existing MessageBubble component
- [ ] Review ViewportFix implementation
- [ ] Check current typing indicator implementation
- [ ] Understand current avatar system (if any)

---

## 🚀 Post-Session Actions

**Commit & Deploy:**
```bash
# Commit changes
git add .
git commit -m "feat: Phase 2.3 - Messaging Visual Design Polish

- Polished message bubble design with modern chat UI
- Added read receipts with real-time updates
- Enhanced typing indicators with smooth animations
- Integrated avatars with fallbacks
- Optimized mobile UX for iOS and Android
- Maintained accessibility and performance standards

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main (auto-deploys via Git integration)
git push origin main

# Monitor deployment
# Visit: https://vercel.com/musickevan1s-projects/care-collective-preview
```

**Verification:**
```bash
# Wait for deployment to complete, then test production
npx vercel inspect <deployment-url> --logs

# Test production messaging
# 1. Open https://care-collective-preview.vercel.app/messages
# 2. Verify visual polish
# 3. Test read receipts
# 4. Test typing indicators
# 5. Verify mobile UX on real devices
```

**Update Documentation:**
- [ ] Mark Phase 2.3 complete in `docs/launch-2026/QUICK_REFERENCE.md`
- [ ] Update `PROJECT_STATUS.md` with completion status
- [ ] Add screenshots/videos to `docs/launch-2026/` for client demo
- [ ] Update `docs/launch-2026/README.md` with Phase 2 completion

**Client Communication:**
- [ ] Prepare demo showing before/after comparison
- [ ] Create mobile demo video (iOS + Android)
- [ ] Highlight performance improvements
- [ ] Gather initial feedback
- [ ] Schedule Phase 3 kickoff if ready

---

## 📚 Reference Documents

**Launch Plan Documentation:**
- [Master Plan](./MASTER_PLAN.md) - Complete launch overview
- [Phase 2 Plan](./phases/phase-2-messaging.md) - Detailed messaging improvements
- [Quick Reference](./QUICK_REFERENCE.md) - At-a-glance checklist

**Development Guidelines:**
- [CLAUDE.md](../../CLAUDE.md) - Project standards and patterns
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - Current implementation status
- [PRP Method](../context-engineering/prp-method/) - Session methodology

**Technical Resources:**
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Previous Phase:** Phase 2.2 - Messaging Performance Optimization ✅
**Current Phase:** Phase 2.3 - Messaging Visual Design Polish 🎯
**Next Phase:** Phase 3.1 - Dashboard Optimization

**Overall Launch Progress:** Phase 2 of 8 (25% complete)
**Target Launch Date:** January 1, 2026
**Session Priority:** Critical - Client's #1 priority for UI/UX polish

---

*This session prompt follows the PRP methodology for maximum efficiency. Focus on Planning (20%) to understand requirements, Research (25%) to review existing code, and Production (55%) to implement polished features.*

**Key Focus:** This phase delivers the visual polish that makes messaging feel professional, intuitive, and delightful to use - addressing the client's top priority of UI/UX excellence.
