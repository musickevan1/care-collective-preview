# CLAUDE.md - Care Collective Platform

This file provides comprehensive guidance to Claude Code when working with the Care Collective mutual aid platform built with Next.js 14.2.32, Supabase, and TypeScript.

## 🤝 Project Overview

### Mission & Domain
Care Collective is a mutual aid platform connecting community members to exchange support and resources. The platform facilitates:

- **Help Requests**: Community members can post requests for assistance (groceries, transport, household tasks, medical support)
- **Resource Sharing**: Neighbors can offer help and connect through the platform
- **Contact Exchange**: Secure contact information sharing between helpers and requesters
- **Community Building**: Creating stronger neighborhood bonds through mutual support

### Core Values
- **Accessibility**: Designed for all ages and technical abilities
- **Privacy**: Secure contact exchange with user consent
- **Community**: Building real connections, not just transactions
- **Inclusivity**: Welcoming to all community members
- **Simplicity**: Easy to use when people need help most

## 🏗️ Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity is crucial for a mutual aid platform. Users may be in crisis situations - interfaces must be intuitive and accessible.

### YAGNI (You Aren't Gonna Need It)
Build features only when community needs are validated, not anticipated.

### Design Principles
- **Accessibility First**: WCAG 2.1 AA compliance minimum
- **Mobile-First**: Most users will access on mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Community-Centered**: Design decisions prioritize community needs over technical preferences
- **Trust & Safety**: Every feature considers user safety and privacy

## 🤖 AI Assistant Guidelines

### Advanced Context Engineering & Master Planning Integration
**CRITICAL**: Use the advanced context engineering system for efficient development:
1. **Check Master Plan First**: Review [`docs/context-engineering/master-plan.md`](./docs/context-engineering/master-plan.md) for current project status and priorities
2. **Apply PRP Method**: Use Planning, Research, Production phases from [`docs/context-engineering/prp-method/`](./docs/context-engineering/prp-method/) for complex tasks
3. **Use Phase Plans**: Reference specific phase documentation in [`docs/context-engineering/phase-plans/`](./docs/context-engineering/phase-plans/) for targeted development
4. **Update Status**: Maintain real-time progress tracking in master plan and project status

**Current Status**: Phase 2.3 (Admin Panel Completion) - Next Priority
**Success Probability**: 85% - All prerequisites complete, clear implementation path

### Git Workflow for Changes (MANDATORY)
**CRITICAL**: After completing any request that involves code changes, modifications, or new features:
1. **Always ask the user if they want to commit and push changes**
2. **Never commit or push without explicit user consent**
3. **Use descriptive commit messages** that explain what was changed and why
4. **Include the Claude Code attribution** in commit messages
5. **Ask before each push operation** - "Ready to push these changes to the repository?"

Example flow:
```
Assistant: I've completed the admin panel improvements. Would you like me to commit and push these changes to the repository?
User: [yes/no response]
Assistant: [commits and pushes if approved, or explains what changes were made if declined]
```

### Post-Request Deployment System (MANDATORY)
**CRITICAL**: After every completed request involving code changes:
1. **ALWAYS offer to commit changes** - Never assume the user doesn't want changes saved
2. **ALWAYS offer to push to repository** - Ensure changes are backed up and available for deployment
3. **ALWAYS offer deployment guidance** - Help user understand next steps for going live
4. **PROVIDE deployment status check** - Verify current deployment state and suggest updates

Required Post-Request Workflow:
```
Assistant: Request completed successfully! Here's what I've changed:
[Brief summary of changes made]

Next steps to deploy these changes:
1. Would you like me to commit these changes? (git commit)
2. Should I push to the repository? (git push)
3. Do you want me to check the current deployment status?
4. Should we deploy these changes to production?

Choose your preference:
- All steps (recommended)
- Just commit and push
- Review changes first
- Deploy later

Ready to proceed?
```

### Deployment Integration Patterns
**For Production Deployments**:
```bash
# Check current deployment status
npx vercel inspect

# Deploy to preview (staging)
npx vercel --prebuilt

# Deploy to production (after verification)
npx vercel --prod

# Monitor deployment logs
npx vercel logs
```

**Post-Deployment Verification**:
1. **Functionality testing** - Core features work as expected
2. **Performance check** - Load times and responsiveness
3. **Mobile compatibility** - Touch interactions and responsive design
4. **Accessibility validation** - Screen reader and keyboard navigation
5. **Security verification** - No exposed sensitive information

### Context Engineering Workflow
**For Development Sessions**:
1. **Pre-Session**: Check [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for quick status overview
2. **Session Planning**: Use PRP method from context engineering documentation
3. **Progress Tracking**: Update todo status and phase completion continuously
4. **Post-Session**: Record progress in master plan and document lessons learned

### Care Collective Context Awareness
- **Help Requests** are the core entity - handle with care and validate thoroughly
- **Contact Exchange** is sensitive - implement with privacy-first approach
- **Status Updates** matter for safety - urgent requests need reliable status tracking
- **Community Trust** depends on reliable, accessible platform behavior

### Domain-Specific Patterns
- Categories: `groceries`, `transport`, `household`, `medical`, `other`
- Urgency Levels: `normal`, `urgent`, `critical` 
- Status Values: `open`, `closed`, `in_progress`
- Geographic Context: Missouri-focused community (Springfield, Branson, Joplin areas)

### Common Pitfalls to Avoid
- Never expose contact information without explicit consent
- Don't assume users have technical expertise
- Avoid complex multi-step flows for core actions
- Never break accessibility with custom components
- Don't implement features that could enable exploitation

### Search Command Requirements
**CRITICAL**: Always use `rg` (ripgrep) instead of traditional `grep` and `find` commands:

```bash
# ✅ Use rg for Care Collective codebase searches
rg "help_requests" --type ts
rg "ContactExchange" -A 5
rg --files -g "*.tsx" | rg "components"
```

### Subagent Usage for Efficient Development (MANDATORY)
**CRITICAL**: Use the Task tool with specialized subagents for complex, multi-step tasks and codebase exploration. This dramatically improves efficiency and context management.

#### When to Use Subagents
1. **Codebase Exploration** (Use Explore agent)
   - Understanding project structure
   - Finding patterns across multiple files
   - Researching how features are implemented
   - Answering "where" and "how" questions about code

2. **Complex Multi-Step Tasks** (Use general-purpose agent)
   - Tasks requiring multiple independent operations
   - Research followed by implementation
   - Multi-file refactoring operations
   - Tasks that need autonomous decision-making

3. **Specialized Workflows** (Use specialized agents)
   - Status line configuration (statusline-setup agent)
   - Output style creation (output-style-setup agent)

#### Parallel Execution for Maximum Efficiency
**CRITICAL**: When tasks are independent, ALWAYS run subagents in parallel by making multiple Task tool calls in a SINGLE message.

```typescript
// ❌ INEFFICIENT: Sequential subagent calls
Assistant: Let me explore the messaging system first...
[Task call 1 - Explore messaging]
[Wait for result]
Assistant: Now let me explore the admin panel...
[Task call 2 - Explore admin]
[Wait for result]

// ✅ EFFICIENT: Parallel subagent calls
Assistant: I'll explore both systems simultaneously...
[Single message with multiple Task calls:
  - Task call 1: Explore messaging
  - Task call 2: Explore admin
  - Task call 3: Explore privacy features
]
```

#### Care Collective Specific Use Cases

**Example 1: Exploring Multiple Feature Areas**
```
User: "How do help requests, messaging, and privacy features work together?"

✅ CORRECT Approach:
Assistant: I'll explore all three areas in parallel for efficiency.
[Single message with 3 Task calls:
  - Explore subagent: "Investigate help request implementation"
  - Explore subagent: "Research messaging system architecture"
  - Explore subagent: "Examine privacy feature integration"
]
```

**Example 2: Codebase Structure Investigation**
```
User: "What's the structure of this codebase?"

✅ CORRECT Approach:
Assistant: Let me explore the codebase structure comprehensively.
[Task call with Explore subagent - thoroughness level: "medium"]
```

**Example 3: Finding Implementation Patterns**
```
User: "Where are errors from the client handled?"

✅ CORRECT Approach:
Assistant: I'll use the Explore agent to find error handling patterns.
[Task call with Explore subagent - thoroughness level: "quick"]

❌ WRONG Approach:
Using Grep/Glob directly without the Explore agent for this type of question.
```

#### Thoroughness Levels for Explore Agent
Choose the appropriate thoroughness level based on the scope:

- **"quick"**: Basic searches, specific file/function lookups
  - Example: "Find the ContactExchange component"

- **"medium"**: Moderate exploration, understanding a feature
  - Example: "How does the messaging system work?"

- **"very thorough"**: Comprehensive analysis, architectural understanding
  - Example: "Analyze the entire privacy and security architecture"

#### Best Practices for Care Collective Development

1. **Default to Explore Agent for Research**
   ```
   ✅ Use Task tool with Explore agent for:
   - "How does X work?"
   - "Where is Y implemented?"
   - "What's the structure of Z?"
   - "Find all components that use X"
   ```

2. **Use Direct Tools Only for Specific Targets**
   ```
   ✅ Use Read/Glob/Grep directly for:
   - Reading a specific known file path
   - Finding a specific class definition
   - Searching within 2-3 known files
   ```

3. **Parallelize Independent Tasks**
   ```
   ✅ Run in parallel:
   - Exploring different feature areas
   - Researching unrelated components
   - Multiple independent code searches

   ❌ Don't parallelize:
   - Tasks with dependencies (one needs results from another)
   - Sequential operations (must complete in order)
   ```

4. **Care Collective Workflow Examples**
   ```
   User: "Review the help requests and messaging features for accessibility"

   ✅ Efficient approach:
   [Single message with 2 parallel Task calls:
     - Explore: "Analyze help request components for WCAG compliance"
     - Explore: "Review messaging components for accessibility"
   ]
   ```

#### Critical Reminders
- **NEVER use Bash grep/find** when Grep/Glob tools are available
- **ALWAYS use Explore agent** for open-ended codebase questions
- **ALWAYS parallelize** independent subagent tasks in one message
- **CHOOSE appropriate thoroughness** level for Explore agent
- **TRUST subagent results** - they are specialized for these tasks

## 🧱 Code Structure & Modularity

### File and Component Limits
- **MAXIMUM 500 lines per file** - Care Collective prioritizes maintainability
- **Components under 200 lines** for accessibility and testing
- **Functions under 50 lines** with single responsibility
- **Clear feature separation** by mutual aid domain concepts

### Care Collective Project Structure

```
care-collective-preview/
├── app/                    # Next.js 14.2.32 App Router
│   ├── auth/              # Authentication flows (login/signup)
│   ├── dashboard/         # User dashboard with community overview
│   ├── requests/          # Help request management
│   │   ├── page.tsx       # Browse requests
│   │   ├── new/           # Create new request
│   │   └── [id]/          # Individual request details
│   ├── admin/             # Community management and moderation
│   ├── messages/          # Real-time messaging system
│   ├── privacy/           # Privacy dashboard and controls
│   ├── design-system/     # Brand showcase and guidelines
│   └── api/               # API routes
├── components/            # Shared UI components
│   ├── ui/                # Base shadcn/ui components
│   ├── messaging/         # Real-time messaging components
│   ├── admin/             # Admin panel components
│   ├── privacy/           # Privacy control components
│   ├── ContactExchange.tsx # Privacy-first contact sharing
│   ├── StatusBadge.tsx    # Request status indicators
│   └── ReadableModeToggle.tsx # Accessibility enhancement
├── lib/                   # Core utilities
│   ├── supabase/          # Database client configuration
│   ├── messaging/         # Messaging and moderation services
│   ├── privacy/           # Privacy and encryption services
│   ├── security/          # Security and audit services
│   ├── database.types.ts  # Generated Supabase types
│   ├── features.ts        # Feature flag management
│   └── utils.ts           # Utility functions
├── docs/                  # Comprehensive documentation
│   ├── context-engineering/ # Advanced context engineering strategy
│   │   ├── master-plan.md   # Master planning and status tracking
│   │   ├── prp-method/      # PRP methodology documentation
│   │   ├── phase-plans/     # Individual phase planning docs
│   │   └── session-templates/ # Reusable session templates
│   ├── development/       # Development process documentation
│   ├── database/          # Database documentation and guides
│   ├── security/          # Security documentation
│   └── deployment/        # Deployment guides
├── PROJECT_STATUS.md      # Always-updated project status overview
└── supabase/              # Database schema and migrations
```

## 🚀 Technology Stack

### Core Technologies
- **Next.js 14.2.32**: App Router with stable production features
- **React 18.3.1**: Server Components and modern React features
- **TypeScript 5**: Strict type safety for community safety
- **Supabase**: PostgreSQL database with real-time features
- **Tailwind CSS 4**: Custom design system with Care Collective branding

### TypeScript Integration (MANDATORY)
- **MUST use `ReactElement` instead of `JSX.Element`** for return types
- **MUST import types from 'react'** explicitly
- **NEVER use `JSX.Element` namespace** - use React types directly

```typescript
// ✅ CORRECT: Care Collective component typing
import { ReactElement } from 'react';

function HelpRequestCard(): ReactElement {
  return <div>Help request content</div>;
}

// ❌ FORBIDDEN: Legacy JSX namespace
function HelpRequestCard(): JSX.Element {  // Cannot find namespace 'JSX'
  return <div>Help request content</div>;
}
```

### Essential Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.32",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.54.0",
    "@supabase/ssr": "^0.6.1",
    "zod": "^4.0.17",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^3.3.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.539.0"
  }
}
```

## 🎨 Care Collective Design System

### Brand Colors (MANDATORY)
```css
/* Primary Brand Colors */
--sage: #7A9E99;           /* Primary action color */
--sage-light: #A3C4BF;     /* Hover states */
--sage-dark: #5A7D78;      /* Active states */

--dusty-rose: #D8A8A0;     /* Secondary accent */
--dusty-rose-light: #E5C6C1; /* Light backgrounds */
--dusty-rose-dark: #B88B83;  /* Emphasis */

/* Supporting Palette */
--primary: #BC6547;        /* Terracotta - warm primary */
--secondary: #324158;      /* Navy - text and headers */
--accent: #C39778;         /* Tan - subtle accents */
--background: #FBF2E9;     /* Cream - main background */
--text: #483129;           /* Brown - primary text */
```

### Typography
- **Primary Font**: Overlock (warm, approachable, accessible)
- **Font Loading**: Optimized with next/font
- **Hierarchy**: Clear headings for accessibility

### Component Variants (Care Collective Specific)
```typescript
// Button variants include Care Collective colors
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        sage: "bg-sage text-white hover:bg-sage/90",
        rose: "bg-dusty-rose text-white hover:bg-dusty-rose/90",
        // ... other variants
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]", // 44px minimum for accessibility
        sm: "h-10 rounded-md px-3 min-h-[40px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]", // Accessible touch targets
      },
    },
  }
);
```

## 🛡️ Data Validation with Zod (MANDATORY FOR SAFETY)

### Care Collective Domain Schemas
```typescript
import { z } from 'zod';

// Help Request Validation
export const helpRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['groceries', 'transport', 'household', 'medical', 'other']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  status: z.enum(['open', 'closed', 'in_progress']).default('open'),
});

// Profile Validation
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  location: z.string().max(100).optional(),
});

// Contact Exchange Validation (Privacy Critical)
export const contactExchangeSchema = z.object({
  requestId: z.string().uuid(),
  contactMethod: z.enum(['phone', 'email']),
  message: z.string().min(10).max(200),
  consent: z.literal(true, { 
    errorMap: () => ({ message: "You must consent to share contact information" })
  }),
});

// Environment Validation (Security Critical)
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().optional(),
});
```

## 🗄️ Supabase Database Patterns

### Core Tables
```sql
-- User profiles (extends auth.users)
profiles:
  id: uuid (matches auth.users.id)
  name: text (display name)
  location: text? (optional neighborhood/area)
  created_at: timestamp

-- Community help requests
help_requests:
  id: uuid
  user_id: uuid (foreign key to profiles.id)
  title: text (brief description)
  description: text? (detailed explanation)
  category: help_category_enum
  urgency: urgency_level_enum  
  status: request_status_enum
  created_at: timestamp

-- Contact exchange tracking (privacy audit trail)
contact_exchanges:
  id: uuid
  request_id: uuid (foreign key to help_requests.id)
  requester_id: uuid (person asking for help)
  helper_id: uuid (person offering help)
  contact_shared: timestamp
  consent_given: boolean
```

### Supabase Client Patterns
```typescript
// lib/supabase/server.ts - Server-side client
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context - cookies are read-only
          }
        },
      },
    }
  );
}

// Data fetching with validation
export async function getHelpRequests() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('help_requests')
    .select(`
      *,
      profiles (
        name,
        location
      )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch help requests: ${error.message}`);
  }

  // Validate with Zod before returning
  return z.array(helpRequestSchema.extend({
    profiles: profileSchema.partial()
  })).parse(data);
}
```

## 🧪 Testing Strategy (MANDATORY 80% COVERAGE)

### Care Collective Testing Priorities
1. **Help Request Creation/Display** - Core functionality
2. **Contact Exchange Privacy** - Security critical
3. **Status Updates** - Safety critical for urgent requests
4. **Accessibility** - WCAG compliance testing
5. **Mobile Experience** - Primary usage pattern

### Test Examples
```typescript
/**
 * @fileoverview Tests for HelpRequestCard component
 * Tests display of help request information and accessibility
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpRequestCard } from '../HelpRequestCard';

describe('HelpRequestCard', () => {
  const mockRequest = {
    id: '123',
    title: 'Need groceries picked up',
    category: 'groceries' as const,
    urgency: 'urgent' as const,
    status: 'open' as const,
    created_at: '2025-01-20T10:00:00Z',
    profiles: { name: 'Alice Johnson', location: 'Springfield, MO' }
  };

  it('displays help request information clearly', () => {
    render(<HelpRequestCard request={mockRequest} />);
    
    expect(screen.getByText('Need groceries picked up')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Springfield, MO')).toBeInTheDocument();
  });

  it('shows urgency level with appropriate styling', () => {
    render(<HelpRequestCard request={mockRequest} />);
    
    const urgencyBadge = screen.getByText('urgent');
    expect(urgencyBadge).toHaveClass('bg-yellow-100'); // Visual urgency indicator
  });

  it('meets accessibility requirements', () => {
    render(<HelpRequestCard request={mockRequest} />);
    
    // Verify semantic structure
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
```

## 🔐 Security Requirements (COMMUNITY SAFETY)

### Privacy Protection (MANDATORY)
```typescript
// Contact exchange must be explicit and audited
export async function initiateContactExchange(
  requestId: string, 
  message: string,
  consent: boolean
) {
  // Validate consent is explicit
  if (!consent) {
    throw new Error('Explicit consent required for contact sharing');
  }

  // Validate message for appropriateness (basic checks)
  const validationResult = contactExchangeSchema.parse({
    requestId,
    message,
    consent
  });

  // Create audit trail
  const { data, error } = await supabase
    .from('contact_exchanges')
    .insert({
      request_id: requestId,
      message: validationResult.message,
      consent_given: true,
      created_at: new Date().toISOString()
    });

  if (error) {
    throw new Error('Failed to process contact exchange');
  }

  return data;
}
```

### Input Sanitization (TRUST & SAFETY)
- **MUST sanitize all user content** before storage and display
- **MUST validate help request content** for appropriateness
- **NEVER expose contact information** without explicit consent flow
- **MUST implement rate limiting** on contact exchange requests

## 🚀 Performance Guidelines

### Care Collective Optimizations
- **Server Components** for help request listings (SEO + performance)
- **Client Components** only for interactivity (contact exchange, status updates)
- **Image optimization** for user avatars and community photos
- **Progressive loading** for large request lists
- **Offline support** for viewing previously loaded requests

### Database Performance
```typescript
// Efficient queries with proper indexing
const { data } = await supabase
  .from('help_requests')
  .select(`
    id,
    title,
    category,
    urgency,
    status,
    created_at,
    profiles!inner (
      name,
      location
    )
  `)
  .eq('status', 'open')
  .order('urgency', { ascending: false }) // Show urgent requests first
  .order('created_at', { ascending: false })
  .limit(20);
```

## 🔄 Real-time Messaging Architecture (Phase 2.1)

### WebSocket Connection Management
The messaging system uses Supabase real-time subscriptions for live communication:

```typescript
// hooks/useRealTimeMessages.ts - Real-time message handling
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealTimeMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages };
}
```

### VirtualizedMessageList Performance Pattern
For conversations with 1000+ messages, use virtualization:

```typescript
// components/messaging/VirtualizedMessageList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedMessageListProps {
  messages: Message[];
  height: number;
  itemHeight: number;
}

export function VirtualizedMessageList({
  messages,
  height,
  itemHeight
}: VirtualizedMessageListProps): ReactElement {
  const ItemRenderer = ({ index, style }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={itemHeight}
      overscanCount={5} // Pre-render 5 items above/below viewport
    >
      {ItemRenderer}
    </List>
  );
}
```

### Typing Indicators & Presence
Real-time presence system with automatic cleanup:

```typescript
// Database trigger for presence cleanup
-- Automatically removes stale presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS trigger AS $$
BEGIN
  DELETE FROM user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

// Component usage
export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const { typingUsers } = useTypingIndicators(conversationId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="text-sm text-muted-foreground italic">
      {typingUsers.map(user => user.name).join(', ')}
      {typingUsers.length === 1 ? ' is' : ' are'} typing...
    </div>
  );
}
```

## 🛡️ Content Moderation Framework (Phase 2.1)

### Automated Content Detection
Multi-layered content screening with escalation:

```typescript
// lib/messaging/moderation.ts - Content moderation service
export interface ModerationResult {
  flagged: boolean;
  confidence: number;
  categories: string[];
  suggested_action: 'allow' | 'review' | 'block';
  explanation: string;
}

export class ContentModerationService {
  async moderateContent(content: string, userId: string): Promise<ModerationResult> {
    // 1. Pattern-based detection (profanity, PII)
    const patternResult = this.checkPatterns(content);

    // 2. User reputation scoring
    const userScore = await this.getUserModerationScore(userId);

    // 3. Context-aware scoring
    const contextScore = this.analyzeContext(content, userScore);

    return this.calculateFinalResult(patternResult, contextScore);
  }
}
```

### User Restriction System
Database-backed user restrictions with graduated responses:

```sql
-- User restriction levels
CREATE TYPE restriction_level AS ENUM ('none', 'limited', 'suspended', 'banned');

-- User restrictions table
CREATE TABLE user_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  restriction_level restriction_level DEFAULT 'none',
  can_send_messages boolean DEFAULT true,
  can_start_conversations boolean DEFAULT true,
  requires_pre_approval boolean DEFAULT false,
  message_limit_per_day integer DEFAULT 50,
  restriction_reason text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

### Admin Moderation Dashboard
Comprehensive moderation queue with analytics:

```typescript
// components/admin/ModerationDashboard.tsx
export function ModerationDashboard(): ReactElement {
  const {
    pendingReports,
    recentActions,
    moderationStats
  } = useModerationQueue();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ModerationQueue
        reports={pendingReports}
        onAction={handleModerationAction}
      />
      <ModerationStats stats={moderationStats} />
      <RecentActions actions={recentActions} />
    </div>
  );
}
```

## 🔐 Message Encryption Integration (Phase 2.2)

### Encryption Service Integration
Leverages Phase 2.2 contact encryption infrastructure:

```typescript
// lib/messaging/encryption.ts - Message encryption using Phase 2.2 infrastructure
import { ContactEncryptionService } from '@/lib/security/contact-encryption';

export class MessageEncryptionService {
  private contactEncryption: ContactEncryptionService;

  async encryptMessage(
    content: string,
    senderId: string,
    recipientId: string,
    conversationId: string
  ): Promise<MessageEncryptionResult> {
    // Determine if message contains sensitive content
    const sensitivityLevel = this.analyzeSensitivity(content);

    if (sensitivityLevel === 'high') {
      // Use Phase 2.2 encryption for sensitive content
      return await this.contactEncryption.encryptSensitiveData(
        content,
        `conversation:${conversationId}`,
        { senderId, recipientId }
      );
    }

    return { encrypted_content: content, encryption_status: 'none' };
  }
}
```

### Privacy Event Integration
Automatic privacy violation detection:

```typescript
// Integrate with Phase 2.2 privacy event tracking
import { privacyEventTracker } from '@/lib/security/privacy-event-tracker';

export async function sendMessage(messageData: MessageData) {
  // Check for privacy violations before sending
  const privacyCheck = await privacyEventTracker.detectViolation({
    action: 'message_send',
    content: messageData.content,
    userId: messageData.senderId,
    context: { conversationId: messageData.conversationId }
  });

  if (privacyCheck.violation_detected) {
    throw new Error('Message blocked due to privacy policy violation');
  }

  // Proceed with sending...
}
```

## 📊 Performance Optimization Patterns (Phase 2.1)

### Message Threading Optimization
Efficient conversation structure with threading support:

```typescript
// Optimized database queries for threaded conversations
export async function getConversationWithThreads(conversationId: string) {
  const { data } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      sender_id,
      thread_id,
      profiles!inner (name),
      message_reactions (emoji, count),
      message_threads!left (
        id,
        title,
        message_count
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Group messages by thread for efficient rendering
  return groupMessagesByThread(data);
}
```

### Memory Management for Long Sessions
Implement message pagination and cleanup:

```typescript
// Automatic memory cleanup for long-running messaging sessions
export function useMessageMemoryManagement(conversationId: string) {
  const [messageBuffer, setMessageBuffer] = useState<Message[]>([]);
  const BUFFER_SIZE = 500; // Keep last 500 messages in memory

  useEffect(() => {
    if (messageBuffer.length > BUFFER_SIZE) {
      // Keep only the most recent messages
      setMessageBuffer(prev => prev.slice(-BUFFER_SIZE));
    }
  }, [messageBuffer]);

  return { messageBuffer, setMessageBuffer };
}
```

## 📱 Mobile-First & Accessibility

### Mobile Considerations
- **Touch targets 44px minimum** for easy interaction
- **Readable text sizes** (16px minimum)
- **Simple navigation** with clear back buttons
- **Offline graceful degradation** for poor connectivity

### Accessibility Requirements
```typescript
// Example accessible component structure
function HelpRequestCard({ request }: { request: HelpRequest }): ReactElement {
  return (
    <article 
      className="p-4 border rounded-lg"
      aria-labelledby={`request-title-${request.id}`}
    >
      <h3 
        id={`request-title-${request.id}`}
        className="text-lg font-semibold text-secondary"
      >
        {request.title}
      </h3>
      
      <div className="flex items-center gap-2 mt-2">
        <StatusBadge 
          status={request.status}
          urgency={request.urgency}
          aria-label={`Request status: ${request.status}, urgency: ${request.urgency}`}
        />
        <span className="text-sm text-muted-foreground">
          Posted by {request.profiles.name}
        </span>
      </div>
      
      <button
        className="mt-3 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
        aria-label={`Offer help for: ${request.title}`}
      >
        Offer Help
      </button>
    </article>
  );
}
```

## 💅 Development Commands & Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "type-check": "tsc --noEmit",
    
    // Supabase database management
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --project-id kecureoyekeqhrxkmjuh > lib/database.types.ts",
    "db:migration": "supabase migration new",
    
    // Testing (when implemented)
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:accessibility": "axe-core tests",
    
    // Verification and setup
    "verify": "node scripts/verify-setup.js",
    "setup:check": "node scripts/verify-setup.js",

    // Real-time messaging testing
    "test:messaging": "vitest run tests/messaging/",
    "test:messaging:watch": "vitest watch tests/messaging/",
    "test:realtime": "vitest run tests/realtime/",
    "test:moderation": "vitest run tests/moderation/"
  }
}
```

## 🔄 Real-time Development Guidelines (Phase 2.1)

### Real-time Testing Procedures
Test real-time messaging functionality with proper WebSocket mocking:

```typescript
// tests/messaging/realtime.test.ts
import { createMockSupabase } from '@/lib/testing/supabase-mock';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';

describe('Real-time messaging', () => {
  it('handles message encryption in real-time', async () => {
    const mockSupabase = createMockSupabase();

    const { result } = renderHook(() =>
      useRealTimeMessages('conv123', 'user456', 'Test User', {
        encryptionEnabled: true
      })
    );

    // Test encrypted message flow
    await result.current.sendMessage('Sensitive info', 'sensitive');

    expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:conv123');
  });
});
```

### Moderation Testing Workflows
Test content moderation with realistic scenarios:

```typescript
// tests/moderation/content-screening.test.ts
import { ContentModerationService } from '@/lib/messaging/moderation';

describe('Content moderation', () => {
  it('detects and flags PII in messages', async () => {
    const moderation = new ContentModerationService();

    const result = await moderation.moderateContent(
      'My phone number is 555-123-4567',
      'user123'
    );

    expect(result.flagged).toBe(true);
    expect(result.categories).toContain('personal_info');
    expect(result.suggested_action).toBe('review');
  });
});
```

### Virtualized Component Guidelines
Follow performance patterns for large data sets:

```typescript
// Performance considerations for VirtualizedMessageList
const messageList = useMemo(() => {
  // Group messages by date for efficient rendering
  return groupMessagesByDate(messages);
}, [messages]);

// Auto-detect when to enable virtualization
const shouldVirtualize = messages.length > 100;

return (
  <VirtualizedMessageList
    messages={messageList}
    enableVirtualization={shouldVirtualize}
    itemHeight={calculateDynamicHeight(messageList)}
  />
);
```

## 🛡️ Moderation Development Patterns (Phase 2.1)

### User Restriction Implementation
Implement graduated user restrictions with database backing:

```typescript
// Database functions for user restrictions
await supabase.rpc('apply_user_restriction', {
  user_uuid: userId,
  restriction_type: 'limited',
  duration_hours: 24,
  reason: 'Inappropriate content detected'
});

// Check restrictions before message sending
const restrictions = await getUserRestrictions(userId);
if (restrictions.requires_pre_approval) {
  // Queue message for moderation review
  await queueMessageForReview(messageContent, userId);
}
```

### Admin Dashboard Integration
Create moderation interfaces with real-time updates:

```typescript
// components/admin/ModerationQueue.tsx
export function ModerationQueue() {
  const { pendingItems, approveItem, rejectItem } = useModerationQueue();

  return (
    <div className="moderation-queue">
      {pendingItems.map(item => (
        <ModerationItem
          key={item.id}
          item={item}
          onApprove={() => approveItem(item.id)}
          onReject={(reason) => rejectItem(item.id, reason)}
        />
      ))}
    </div>
  );
}
```

## ⚠️ CARE COLLECTIVE CRITICAL GUIDELINES

### Community Safety (MUST FOLLOW ALL)
1. **NEVER expose contact information** without explicit consent flow
2. **VALIDATE all help request content** for appropriateness
3. **AUDIT contact exchanges** for safety and trust
4. **ACCESSIBILITY is non-negotiable** - WCAG 2.1 AA minimum
5. **MOBILE-FIRST design** - majority of users on mobile
6. **CLEAR STATUS COMMUNICATION** - urgent requests need immediate clarity
7. **PRIVACY by design** - collect minimum necessary information
8. **TRUST & SAFETY** - implement reporting mechanisms
9. **INCLUSIVE LANGUAGE** - welcome all community members
10. **GRACEFUL DEGRADATION** - core functionality without JavaScript

### Domain-Specific Anti-Patterns (FORBIDDEN)
- **NEVER** auto-share contact information
- **NEVER** make assumptions about user capabilities or resources
- **NEVER** create barriers for urgent requests
- **NEVER** store sensitive information in localStorage
- **NEVER** implement features that could enable exploitation
- **NEVER** ignore accessibility in favor of aesthetics
- **NEVER** create complex multi-step flows for core actions
- **NEVER** assume reliable internet connectivity
- **NEVER** implement features without considering abuse potential

### File Organization Requirements
- **Maximum 500 lines per file** - especially critical for accessibility review
- **Co-locate tests** with components for maintainability
- **Clear naming conventions** - domain-specific and descriptive
- **Separate concerns** - UI, business logic, and data access

## 📋 Pre-commit Checklist (CARE COLLECTIVE SPECIFIC)

### Functionality
- [ ] Help requests can be created and displayed
- [ ] Contact exchange requires explicit consent
- [ ] Status updates work reliably
- [ ] Mobile experience is smooth
- [ ] Offline graceful degradation works

### Safety & Privacy
- [ ] No contact information exposed without consent
- [ ] All user inputs validated and sanitized
- [ ] Audit trails for sensitive actions
- [ ] Privacy policy compliance

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader compatibility tested
- [ ] Keyboard navigation works completely
- [ ] Color contrast meets requirements
- [ ] Touch targets are 44px minimum

### Technical Quality
- [ ] TypeScript compiles with ZERO errors
- [ ] 80%+ test coverage achieved
- [ ] ESLint passes with ZERO warnings
- [ ] All Care Collective domain schemas validate
- [ ] Supabase queries are efficient and secure

### Community Impact
- [ ] Features support community building
- [ ] Inclusive language throughout
- [ ] Clear value proposition for mutual aid
- [ ] No barriers for users in crisis

---

## 🌟 Care Collective Specific Notes

### Community Context
- **Missouri-focused**: Springfield, Branson, Joplin areas
- **Rural considerations**: Limited transportation, internet connectivity
- **Diverse ages**: Design for both tech-savvy and traditional users
- **Crisis situations**: People using the app may be in urgent need

### Success Metrics
- Help requests successfully connected
- Contact exchanges leading to real-world help
- Platform accessibility for all community members
- Trust and safety maintained
- Community growth and engagement

*This guide is optimized for the Care Collective mutual aid platform built with Next.js 14.2.32, Supabase, and TypeScript. Focus on community safety, accessibility, and trust in all development decisions.*

*Last updated: January 2025*