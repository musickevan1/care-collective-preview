# Care Collective - One-Shot Implementation Prompt

## Project Overview

Build a comprehensive mutual aid platform called "Care Collective" that connects community members to exchange support and resources. This is a production-ready web application for Missouri communities (Springfield, Branson, Joplin areas) where neighbors can post help requests and offer assistance.

## Technology Stack

- **Framework**: Next.js 14.2.32 with App Router
- **Runtime**: React 18.3.1 with Server Components
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Styling**: Tailwind CSS 4 with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Validation**: Zod 4.0.17 for runtime type safety
- **Authentication**: Supabase Auth with email verification
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1.0
- **Deployment**: Vercel with Edge Runtime
- **Testing**: Vitest with 80%+ coverage requirement

## Design System

### Brand Colors
```typescript
// Primary Palette
const colors = {
  sage: '#7A9E99',           // Primary action color
  'sage-light': '#A3C4BF',   // Hover states
  'sage-dark': '#5A7D78',    // Active states
  'sage-accessible': '#4A6B66', // WCAG compliant

  'dusty-rose': '#D8A8A0',        // Secondary accent
  'dusty-rose-light': '#E5C6C1',  // Light backgrounds
  'dusty-rose-dark': '#B88B83',   // Emphasis
  'dusty-rose-accessible': '#9A6B61', // WCAG compliant

  // Supporting Colors
  terracotta: '#BC6547',     // Warm primary
  navy: '#324158',           // Text and headers
  tan: '#C39778',            // Subtle accents
  cream: '#FBF2E9',          // Main background
  brown: '#483129',          // Primary text
};
```

### Typography
- **Primary Font**: Overlock (warm, approachable, accessible)
- **Font Sizes**: 16px minimum for body text (accessibility)
- **Touch Targets**: 44px minimum (mobile accessibility)

### Component Variants
All components must support variants: `default`, `sage`, `rose`, `outline`, `ghost`, `destructive`
Button sizes: `default` (44px), `sm` (40px), `lg` (48px), `icon` (44x44px)

## Database Schema

### Core Tables

```sql
-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- matches auth.users.id
  name TEXT NOT NULL,
  location TEXT,
  verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help Requests
CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('groceries', 'transport', 'household', 'medical', 'other')),
  urgency TEXT CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status TEXT CHECK (status IN ('open', 'closed', 'in_progress')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  help_request_id UUID REFERENCES help_requests(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT CHECK (status IN ('active', 'closed', 'blocked')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  role TEXT CHECK (role IN ('member', 'moderator')) DEFAULT 'member',
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  help_request_id UUID REFERENCES help_requests(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  message_type TEXT CHECK (message_type IN ('text', 'system', 'help_request_update')) DEFAULT 'text',
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Exchange (Privacy-Critical)
CREATE TABLE contact_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_method TEXT CHECK (contact_method IN ('phone', 'email')),
  encrypted_contact_data TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL,
  message TEXT,
  consent_given BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Restrictions (Moderation)
CREATE TABLE user_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restriction_level TEXT CHECK (restriction_level IN ('none', 'limited', 'suspended', 'banned')) DEFAULT 'none',
  can_send_messages BOOLEAN DEFAULT TRUE,
  can_start_conversations BOOLEAN DEFAULT TRUE,
  requires_pre_approval BOOLEAN DEFAULT FALSE,
  message_limit_per_day INTEGER DEFAULT 50,
  restriction_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Events (Audit Trail)
CREATE TABLE privacy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT CHECK (event_category IN ('data_access', 'data_modification', 'consent_change', 'violation_detected')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reports
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')),
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Indexes
```sql
-- Help Requests
CREATE INDEX idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_urgency ON help_requests(urgency, created_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_flagged ON messages(is_flagged, moderation_status) WHERE is_flagged = TRUE;

-- Conversations
CREATE INDEX idx_conversations_participant ON conversation_participants(user_id, left_at) WHERE left_at IS NULL;
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

### Row Level Security (RLS) Policies

**CRITICAL**: All tables must have RLS enabled. Key policies:

- **Profiles**: Viewable by everyone, users can only update their own
- **Help Requests**: Viewable by everyone, users manage their own
- **Messages**: Only viewable/accessible by conversation participants
- **Contact Exchanges**: Only accessible by requester and helper
- **Admin Tables**: Only accessible by users with `is_admin = true`

## File Structure

```
care-collective-preview/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # User dashboard
│   ├── login/page.tsx              # Login page
│   ├── signup/page.tsx             # Registration with verification
│   ├── waitlist/page.tsx           # Pending users waitlist
│   ├── access-denied/page.tsx      # Rejected users page
│   ├── requests/
│   │   ├── page.tsx                # Browse help requests
│   │   ├── new/page.tsx            # Create request
│   │   └── [id]/page.tsx           # Request details
│   ├── messages/page.tsx           # Messaging dashboard
│   ├── admin/
│   │   ├── page.tsx                # Admin overview
│   │   ├── users/page.tsx          # User management
│   │   ├── applications/page.tsx   # Verify new users
│   │   ├── help-requests/page.tsx  # Request moderation
│   │   ├── messaging/moderation/page.tsx  # Message moderation
│   │   ├── privacy/page.tsx        # Privacy dashboard
│   │   └── performance/page.tsx    # Performance metrics
│   ├── privacy/page.tsx            # Privacy dashboard
│   ├── auth/callback/route.ts      # Auth callback handler
│   └── api/                        # API routes
├── components/
│   ├── ui/                         # shadcn/ui base components
│   ├── HelpRequestCard.tsx         # Request display card
│   ├── ContactExchange.tsx         # Privacy-first contact sharing
│   ├── StatusBadge.tsx             # Request status indicator
│   ├── MessageBubble.tsx           # Chat message display
│   └── AdminSidebar.tsx            # Admin navigation
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   ├── middleware-edge.ts      # Edge middleware client
│   │   └── admin.ts                # Service role client
│   ├── messaging/
│   │   ├── encryption.ts           # Message encryption
│   │   └── moderation.ts           # Content moderation
│   ├── privacy/
│   │   ├── contact-encryption.ts   # Contact data encryption
│   │   └── privacy-event-tracker.ts # Privacy audit
│   ├── security/
│   │   ├── auth-helpers.ts         # Auth utilities
│   │   └── incident-response.ts    # Security incident handling
│   ├── database.types.ts           # Generated Supabase types
│   └── utils.ts                    # Utility functions
├── middleware.ts                   # Auth middleware
└── tailwind.config.ts              # Tailwind configuration
```

## Core Features Implementation

### 1. Authentication Flow

```typescript
// User Registration with Verification
- Email/password signup
- Automatic profile creation
- Default verification_status: 'pending'
- Redirect to waitlist page
- Admin reviews and approves/rejects
- Email notification on approval

// Middleware Protection
- Check user session
- Verify profile.verification_status
- Block 'rejected' users → /access-denied
- Redirect 'pending' users → /waitlist
- Allow 'approved' users to protected routes
```

### 2. Help Request System

```typescript
// Create Request Flow
- Authenticated user only
- Form validation with Zod schema
- Categories: groceries, transport, household, medical, other
- Urgency levels: normal, urgent, critical
- Auto-set status to 'open'
- Display with urgency-based styling

// Browse Requests
- Public viewing (all users)
- Filter by category, urgency, status
- Search by title/description
- Sort by urgency then date
- Mobile-optimized cards
```

### 3. Messaging System

```typescript
// Real-time Messaging
- Supabase real-time subscriptions
- Conversation-based threading
- Read receipts and status
- Typing indicators
- Message moderation and flagging
- User restrictions enforcement

// Message Encryption
- Sensitive content detection
- End-to-end encryption for PII
- Automatic PII redaction
- Privacy event logging
```

### 4. Contact Exchange (Privacy-Critical)

```typescript
// Privacy-First Contact Sharing
- Explicit consent required
- Encrypted contact data storage
- Audit trail logging
- One-time access patterns
- GDPR compliance

// Implementation Pattern
1. User clicks "Offer Help"
2. Modal requires explicit consent checkbox
3. Validates message and intent
4. Encrypts contact information
5. Logs privacy event
6. Grants access with notification
```

### 5. Admin Panel

```typescript
// User Verification
- Review pending applications
- View user profile details
- Approve/reject with reason
- Send notification emails
- Audit trail logging

// Content Moderation
- Review flagged messages
- User restriction management
- Help request oversight
- Privacy event monitoring
- Performance metrics dashboard
```

## Security Requirements

### Authentication
- Email verification required
- Secure session management with Supabase
- Service role pattern for admin queries
- Edge Runtime compatible auth checks

### Data Protection
- Contact encryption with key rotation
- Privacy event audit trails
- GDPR compliance (right to erasure, data portability)
- Secure RLS policies on all tables

### Input Validation
- Zod schemas for all user inputs
- DOMPurify for HTML sanitization
- SQL injection protection via Supabase
- XSS prevention in message content

### Content Moderation
- Automated PII detection
- Profanity filtering
- User restriction system
- Report and review workflow
- Graduated enforcement (warning → limited → suspended → banned)

## Accessibility Requirements (WCAG 2.1 AA)

### Visual
- Color contrast minimum 4.5:1 for normal text
- Color contrast minimum 3:1 for large text
- No color-only information conveyance
- Readable fonts (Overlock) at 16px minimum

### Interaction
- Touch targets 44px minimum
- Keyboard navigation fully supported
- Focus indicators visible and clear
- Skip navigation links
- ARIA labels on all interactive elements

### Content
- Semantic HTML structure
- Alt text for all images
- Screen reader compatible
- Clear heading hierarchy
- Error messages descriptive and helpful

## Mobile-First Design

- Responsive breakpoints: mobile (default), tablet (768px), desktop (1024px)
- Touch-optimized interactions
- Simplified navigation on mobile
- Progressive enhancement (works without JS for core features)
- Offline graceful degradation

## Testing Requirements

### Unit Tests (80%+ coverage)
```typescript
// Test all components
- HelpRequestCard rendering and accessibility
- ContactExchange validation and encryption
- StatusBadge urgency display
- MessageBubble formatting

// Test all utilities
- Auth helpers
- Encryption services
- Validation schemas
- Privacy event tracking
```

### Integration Tests
```typescript
// Critical user flows
- Complete signup → waitlist → approval flow
- Create help request → receive offer → contact exchange
- Send message → moderation → delivery
- Admin approve user → email notification
```

### Accessibility Tests
```typescript
// Axe-core automated testing
- All pages pass WCAG 2.1 AA
- Keyboard navigation complete
- Screen reader compatibility
- Focus management
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production

# Email (Resend)
RESEND_API_KEY=your_resend_key

# Encryption
ENCRYPTION_KEY=your_encryption_key
```

## Key Implementation Patterns

### TypeScript Pattern (MANDATORY)
```typescript
// ✅ CORRECT - Use ReactElement from 'react'
import { ReactElement } from 'react';

export function Component(): ReactElement {
  return <div>Content</div>;
}

// ❌ FORBIDDEN - Never use JSX.Element
export function Component(): JSX.Element {  // Error!
  return <div>Content</div>;
}
```

### Supabase Client Pattern
```typescript
// Server Components (app/page.tsx)
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.from('help_requests').select('*');
  // ...
}

// Client Components
'use client';
import { createClient } from '@/lib/supabase/client';

export function Component() {
  const supabase = createClient();
  // ...
}

// Middleware (Edge Runtime)
import { createClient } from '@/lib/supabase/middleware-edge';

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  // ...
}

// Admin Operations (Service Role)
import { createAdminClient } from '@/lib/supabase/admin';

export async function adminFunction() {
  const supabase = createAdminClient();
  // Bypasses RLS for admin operations
}
```

### Validation Pattern
```typescript
import { z } from 'zod';

const helpRequestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['groceries', 'transport', 'household', 'medical', 'other']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
});

// Validate before database operations
const validated = helpRequestSchema.parse(userInput);
```

### Error Handling Pattern
```typescript
// User-friendly error messages
try {
  const result = await operation();
} catch (error) {
  if (error instanceof ZodError) {
    return { error: 'Please check your input and try again.' };
  }
  if (error.code === 'PGRST116') {
    return { error: 'You do not have permission to perform this action.' };
  }
  return { error: 'Something went wrong. Please try again later.' };
}
```

## Critical User Flows

### 1. New User Registration
```
1. User visits /signup
2. Enters email, password, name, location
3. Receives verification email
4. Clicks verification link → /verify-email
5. Redirected to /waitlist (verification_status: 'pending')
6. Waits for admin approval
7. Admin reviews at /admin/applications
8. Admin approves → user receives email
9. User logs in → redirected to /dashboard
```

### 2. Help Request Creation and Response
```
1. Approved user visits /requests/new
2. Fills form: title, description, category, urgency
3. Submits → validates → saves to database
4. Redirected to /requests → sees new request in list
5. Other user sees request on /requests
6. Clicks "Offer Help" → ContactExchange modal
7. Consents to share contact info
8. Contact encrypted and stored
9. Both users receive notifications
10. Can now message via /messages
```

### 3. Admin Moderation Workflow
```
1. Admin logs in → /admin
2. Sees pending users count
3. Visits /admin/applications
4. Reviews user: Test User (testuser@example.com)
5. Clicks "Approve" with welcome message
6. System sends approval email
7. Updates profile.verification_status = 'approved'
8. User can now access full platform
```

## Performance Requirements

- Lighthouse Performance Score: 90+
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1
- Bundle size: < 200KB (gzipped)

## Build and Deployment

```bash
# Development
npm run dev                  # Start dev server

# Build
npm run build                # Production build
npm run type-check          # TypeScript validation
npm run lint                # ESLint check

# Testing
npm run test                # Run tests
npm run test:coverage       # Coverage report

# Database
npm run db:types            # Generate TypeScript types
npm run db:migration        # Create new migration
npm run db:push             # Push local changes

# Deployment (Vercel)
git push origin main        # Auto-deploys to production
```

## Quality Checklist

Before considering complete:
- [ ] All pages render correctly on mobile, tablet, desktop
- [ ] Authentication flow works: signup → waitlist → approval → login
- [ ] Help requests can be created, viewed, filtered
- [ ] Contact exchange requires consent and encrypts data
- [ ] Messaging system delivers messages in real-time
- [ ] Admin can approve/reject users
- [ ] Admin can moderate content
- [ ] All forms validate with Zod
- [ ] TypeScript compiles with zero errors
- [ ] 80%+ test coverage achieved
- [ ] WCAG 2.1 AA accessibility verified
- [ ] Lighthouse score 90+ on all pages
- [ ] All database queries use RLS policies
- [ ] Privacy events logged for sensitive operations
- [ ] Error handling graceful and user-friendly

## Domain-Specific Constraints

**Community Safety (Non-Negotiable)**:
- Never expose contact information without explicit consent
- Always validate help request content appropriateness
- Audit all contact exchanges for safety
- Implement clear status communication for urgent requests
- Privacy-by-design in all features
- Mobile-first for accessibility (majority mobile users)
- WCAG 2.1 AA minimum compliance
- Graceful degradation (works without JavaScript for core features)

**Missouri Context**:
- Rural considerations: limited transportation, internet connectivity
- Diverse age groups: design for both tech-savvy and traditional users
- Crisis situations: users may be in urgent need, keep UI simple
- Community trust: reliability and safety are paramount

## Success Criteria

The platform is complete when:
1. Help requests successfully connect community members
2. Contact exchange leads to real-world assistance
3. Platform accessible to all community members (WCAG AA)
4. Trust and safety maintained through moderation
5. Smooth user experience on mobile devices
6. All critical user flows tested and verified
7. Production-ready with monitoring and error tracking
8. GDPR compliant with privacy controls

---

**Implementation Note**: This prompt provides complete specifications for a production-ready mutual aid platform. Build with Next.js 14.2.32, implement all security measures, ensure accessibility compliance, and maintain the warm, community-focused design throughout. The platform should feel trustworthy, accessible, and genuinely helpful to people in need.
