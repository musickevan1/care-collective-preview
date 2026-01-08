# CLAUDE.md - Care Collective Platform

Care Collective: Mutual aid platform connecting community members for support and resources. Built with Next.js 14.2.32, Supabase, and TypeScript.

## 🤝 Mission & Core Values

**Domain**: Help requests (groceries, transport, household, medical), resource sharing, secure contact exchange, community building.

**Values**: Accessibility (WCAG 2.1 AA), Privacy (consent-based), Community-focused, Inclusivity, Simplicity for crisis situations.

**Philosophy**: KISS + YAGNI. Mobile-first, progressive enhancement, trust & safety in every feature.

## 🤖 AI Assistant Guidelines

### Context Engineering (CRITICAL)
1. **Check Master Plan**: Review [`docs/context-engineering/master-plan.md`](./docs/context-engineering/master-plan.md) for status
2. **Apply PRP Method**: Planning, Research, Production from [`docs/context-engineering/prp-method/`](./docs/context-engineering/prp-method/)
3. **Use Phase Plans**: Reference [`docs/context-engineering/phase-plans/`](./docs/context-engineering/phase-plans/)
4. **Update Status**: Track progress in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)

**Current Status**: Phase 2.3 (Admin Panel) - 85% success probability

### Git Workflow (MANDATORY)
**CRITICAL**: After code changes:
1. Always ask before committing/pushing
2. Use descriptive messages with Claude Code attribution
3. Never commit without explicit consent

### Deployment System (MANDATORY)
**CRITICAL - Automatic Deployments**: The repository is connected to Vercel via Git integration. Every push to `main` automatically triggers a production deployment to `https://care-collective-preview.vercel.app`. **DO NOT** run `npx vercel --prod` manually as this causes duplicate deployments!

**Required Workflow After Every Code Change**:
```bash
# 1. Commit changes with descriptive message
git add .
git commit -m "feat: description 🤖 Generated with Claude (claude-opus-4)"

# 2. Push to main branch (AUTOMATICALLY deploys to production via Git integration)
git push origin main

# 3. Wait for Vercel deployment to complete (automatic from GitHub push)
# Monitor at: https://vercel.com/musickevan1s-projects/care-collective-preview

# 4. Verify production deployment
npx vercel inspect <deployment-url> --logs
```

**Branch Strategy**:
- **main** - Production branch, connected to Vercel via Git integration
- **AUTOMATIC DEPLOYMENT**: Pushing to `main` triggers production deployment
- **NEVER run `npx vercel --prod` manually** - This creates duplicate deployments!
- Git push is sufficient - Vercel handles the rest automatically

**CRITICAL**: The repository is connected to Vercel via Git integration. Every push to `main` automatically triggers a production deployment. Running `npx vercel --prod` after pushing causes duplicate deployments and wastes build resources!

**Service Worker Cache Busting** (AUTOMATED):
- `npm run build` automatically updates service worker cache version via `prebuild` hook
- This ensures users always see the latest deployment, not cached versions
- Network-first strategy for HTML pages guarantees fresh content
- Cache-first only for static assets with content hashes (JS, CSS, images)

### Domain Context
- **Help Requests**: Core entity, validate thoroughly
- **Contact Exchange**: Privacy-first, explicit consent required
- **Status Updates**: Safety-critical for urgent requests
- **Categories**: groceries, transport, household, medical, other
- **Urgency**: normal, urgent, critical
- **Status**: open, closed, in_progress
- **Geography**: Missouri (Springfield, Branson, Joplin)

### Common Pitfalls (AVOID)
- Never expose contact info without consent
- Don't assume technical expertise
- Avoid complex multi-step flows
- Never break accessibility
- Don't enable exploitation features

### Search & Subagent Usage (MANDATORY)
**Use `rg` (ripgrep)**: `rg "pattern" --type ts`

**Use Explore Agent for**:
- "How does X work?" - Codebase exploration
- "Where is Y?" - Finding patterns
- "What's the structure?" - Architecture questions

**Parallel Execution**: Run independent subagents in SINGLE message
```typescript
// ✅ EFFICIENT: Single message with multiple Task calls
[Task: Explore messaging, Task: Explore admin, Task: Explore privacy]

// ❌ INEFFICIENT: Sequential calls
[Task: Explore messaging] [Wait] [Task: Explore admin]
```

**Thoroughness Levels**:
- "quick": Specific lookups
- "medium": Feature understanding
- "very thorough": Architectural analysis

## 🏗️ Project Structure

```
care-collective-preview/
├── app/                    # Next.js App Router
│   ├── auth/, dashboard/, requests/, admin/, messages/, privacy/
├── components/            # UI components
│   ├── ui/, messaging/, admin/, privacy/
├── lib/                   # Core utilities
│   ├── supabase/, messaging/, privacy/, security/
│   ├── database.types.ts, features.ts, utils.ts
├── docs/                  # Documentation (see docs/README.md)
│   ├── guides/            # How-to guides
│   ├── development/       # Active development docs
│   ├── context-engineering/ # AI context and phase plans
│   ├── client/            # Client documentation
│   ├── database/          # Database documentation
│   ├── security/          # Security documentation
│   └── archive/           # Historical docs (date-based: YYYY-MM/)
├── PROJECT_STATUS.md      # Current status
└── supabase/              # Database schema
```

### File Limits (MANDATORY)
- **Max 500 lines per file**
- **Components under 200 lines**
- **Functions under 50 lines**
- **Clear feature separation**

## 🚀 Technology Stack

**Core**: Next.js 14.2.32, React 18.3.1, TypeScript 5, Supabase, Tailwind CSS 4

**Key Dependencies**: @supabase/supabase-js, @supabase/ssr, zod, class-variance-authority, tailwind-merge, date-fns, lucide-react

### TypeScript Rules (MANDATORY)
```typescript
// ✅ CORRECT: Use ReactElement
import { ReactElement } from 'react';
function Component(): ReactElement { }

// ❌ FORBIDDEN: JSX.Element namespace
function Component(): JSX.Element { } // Error: Cannot find namespace 'JSX'
```

## 🎨 Design System

### Brand Colors (MANDATORY)
```css
--sage: #7A9E99;              /* Primary actions */
--dusty-rose: #D8A8A0;        /* Secondary accent */
--primary: #BC6547;           /* Terracotta */
--secondary: #324158;         /* Navy text */
--accent: #C39778;            /* Tan */
--background: #FBF2E9;        /* Cream */
--text: #483129;              /* Brown */
```

**Typography**: Overlock (accessible, approachable)

**Accessibility**: 44px minimum touch targets, WCAG 2.1 AA compliance

## 🛡️ Data Validation (MANDATORY)

```typescript
import { z } from 'zod';

// Help Request
export const helpRequestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['groceries', 'transport', 'household', 'medical', 'other']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  status: z.enum(['open', 'closed', 'in_progress']).default('open'),
});

// Contact Exchange (Privacy Critical)
export const contactExchangeSchema = z.object({
  requestId: z.string().uuid(),
  contactMethod: z.enum(['phone', 'email']),
  message: z.string().min(10).max(200),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Must consent to share contact" })
  }),
});

// Environment (Security Critical)
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});
```

## 🗄️ Database Patterns

### Core Tables
```sql
profiles: id, name, location, created_at
help_requests: id, user_id, title, description, category, urgency, status, created_at
contact_exchanges: id, request_id, requester_id, helper_id, contact_shared, consent_given
```

### Supabase Client
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server component - cookies read-only */ }
        },
      },
    }
  );
}

// Data fetching with validation
export async function getHelpRequests() {
  const { data, error } = await createClient()
    .from('help_requests')
    .select('*, profiles(name, location)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return z.array(helpRequestSchema.extend({
    profiles: profileSchema.partial()
  })).parse(data);
}
```

## 🧪 Testing (80% COVERAGE MANDATORY)

**Priorities**: Help requests, contact exchange privacy, status updates, accessibility, mobile

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('HelpRequestCard', () => {
  it('displays information and meets accessibility', () => {
    const request = {
      id: '123', title: 'Need groceries', urgency: 'urgent',
      profiles: { name: 'Alice', location: 'Springfield' }
    };
    render(<HelpRequestCard request={request} />);

    expect(screen.getByText('Need groceries')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
```

## 🔐 Security (COMMUNITY SAFETY)

### Privacy Protection (MANDATORY)
```typescript
export async function initiateContactExchange(
  requestId: string, message: string, consent: boolean
) {
  if (!consent) throw new Error('Explicit consent required');

  const validated = contactExchangeSchema.parse({ requestId, message, consent });

  const { data, error } = await supabase
    .from('contact_exchanges')
    .insert({
      request_id: requestId,
      message: validated.message,
      consent_given: true,
      created_at: new Date().toISOString()
    });

  if (error) throw new Error('Contact exchange failed');
  return data;
}
```

**Security Rules**:
- Sanitize all user content
- Validate help request content
- Never expose contact info without consent
- Implement rate limiting

## 🚀 Performance

**Optimizations**: Server Components for listings, Client Components for interactivity, image optimization, progressive loading, offline support

**Efficient Queries**:
```typescript
const { data } = await supabase
  .from('help_requests')
  .select('id, title, category, urgency, status, created_at, profiles!inner(name, location)')
  .eq('status', 'open')
  .order('urgency', { ascending: false })
  .limit(20);
```

## 🔄 Real-time Messaging (Phase 2.1)

### WebSocket Management
```typescript
// hooks/useRealTimeMessages.ts
export function useRealTimeMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  return { messages };
}
```

### Performance Patterns
**Virtualization** (1000+ messages):
```typescript
import { FixedSizeList as List } from 'react-window';

export function VirtualizedMessageList({ messages, height, itemHeight }) {
  return (
    <List height={height} itemCount={messages.length} itemSize={itemHeight} overscanCount={5}>
      {({ index, style }) => <div style={style}><MessageBubble message={messages[index]} /></div>}
    </List>
  );
}
```

**Memory Management**:
```typescript
const BUFFER_SIZE = 500;
useEffect(() => {
  if (messageBuffer.length > BUFFER_SIZE) {
    setMessageBuffer(prev => prev.slice(-BUFFER_SIZE));
  }
}, [messageBuffer]);
```

## 🛡️ Content Moderation (Phase 2.1)

```typescript
// lib/messaging/moderation.ts
export class ContentModerationService {
  async moderateContent(content: string, userId: string): Promise<ModerationResult> {
    const patternResult = this.checkPatterns(content); // PII, profanity
    const userScore = await this.getUserModerationScore(userId);
    const contextScore = this.analyzeContext(content, userScore);
    return this.calculateFinalResult(patternResult, contextScore);
  }
}
```

### User Restrictions
```sql
CREATE TYPE restriction_level AS ENUM ('none', 'limited', 'suspended', 'banned');
CREATE TABLE user_restrictions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  restriction_level restriction_level DEFAULT 'none',
  can_send_messages boolean DEFAULT true,
  requires_pre_approval boolean DEFAULT false,
  message_limit_per_day integer DEFAULT 50,
  restriction_reason text,
  expires_at timestamptz
);
```

## 🔐 Message Encryption (Phase 2.2)

```typescript
// lib/messaging/encryption.ts
import { ContactEncryptionService } from '@/lib/security/contact-encryption';

export class MessageEncryptionService {
  async encryptMessage(content: string, senderId: string, recipientId: string, conversationId: string) {
    const sensitivityLevel = this.analyzeSensitivity(content);

    if (sensitivityLevel === 'high') {
      return await this.contactEncryption.encryptSensitiveData(
        content, `conversation:${conversationId}`, { senderId, recipientId }
      );
    }
    return { encrypted_content: content, encryption_status: 'none' };
  }
}

// Privacy violation detection
export async function sendMessage(messageData: MessageData) {
  const privacyCheck = await privacyEventTracker.detectViolation({
    action: 'message_send',
    content: messageData.content,
    userId: messageData.senderId,
    context: { conversationId: messageData.conversationId }
  });

  if (privacyCheck.violation_detected) {
    throw new Error('Message blocked: privacy violation');
  }
}
```

## 📱 Mobile-First & Accessibility

**Mobile**: 44px touch targets, 16px min text, simple navigation, offline graceful degradation

**Accessibility Example**:
```typescript
function HelpRequestCard({ request }: { request: HelpRequest }): ReactElement {
  return (
    <article className="p-4 border rounded-lg" aria-labelledby={`title-${request.id}`}>
      <h3 id={`title-${request.id}`} className="text-lg font-semibold">{request.title}</h3>
      <StatusBadge status={request.status} urgency={request.urgency}
        aria-label={`Status: ${request.status}, urgency: ${request.urgency}`} />
      <button className="mt-3 px-4 py-2 bg-sage hover:bg-sage-dark rounded-lg
        focus:outline-none focus:ring-2 focus:ring-sage min-h-[44px]"
        aria-label={`Offer help for: ${request.title}`}>
        Offer Help
      </button>
    </article>
  );
}
```

## 💅 Development Commands

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "lint": "next lint --max-warnings 0",
    "type-check": "tsc --noEmit",
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --project-id kecureoyekeqhrxkmjuh > lib/database.types.ts",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:messaging": "vitest run tests/messaging/"
  }
}
```

## ⚠️ CRITICAL GUIDELINES

### Community Safety (MUST FOLLOW)
1. **NEVER** expose contact info without explicit consent
2. **VALIDATE** all help request content
3. **AUDIT** contact exchanges
4. **ACCESSIBILITY** non-negotiable (WCAG 2.1 AA)
5. **MOBILE-FIRST** design
6. **CLEAR STATUS** communication
7. **PRIVACY** by design
8. **TRUST & SAFETY** mechanisms
9. **INCLUSIVE** language
10. **GRACEFUL DEGRADATION** (core works without JS)

### Forbidden Patterns
- Auto-share contact information
- Assume user capabilities/resources
- Barriers for urgent requests
- Store sensitive info in localStorage
- Features enabling exploitation
- Sacrifice accessibility for aesthetics
- Complex multi-step core flows
- Assume reliable connectivity
- Features without abuse consideration

### File Organization
- Max 500 lines per file
- Co-locate tests with components
- Domain-specific naming
- Separate UI, logic, data access

## 📚 Documentation Guidelines

### Directory Structure
- **docs/guides/** - How-to guides for developers
- **docs/development/** - Active development documentation
- **docs/context-engineering/** - AI assistant context (master plans, PRP)
- **docs/client/** - Client meeting notes and feedback
- **docs/database/** - Database documentation
- **docs/security/** - Security documentation
- **docs/testing/** - Testing documentation
- **docs/deployment/** - Deployment procedures
- **docs/archive/YYYY-MM/** - Historical documentation (date-based)

### Documentation Rules (MANDATORY)
1. **Never create .md files in project root** - Use docs/ subdirectories
2. **Allowed root exceptions**: CLAUDE.md, PROJECT_STATUS.md, README.md
3. **Session prompts expire** - Archive after 30 days if not updated
4. **Phase summaries go to archive** - Once phase is complete
5. **Use descriptive file names** - kebab-case, indicate purpose
6. **Update docs/README.md** - When adding new major documents

### File Naming Convention
- Guides: `topic-name.md` (e.g., `testing.md`)
- Session work: `YYYY-MM-DD-topic.md` (e.g., `2025-12-15-auth-fix.md`)
- Phase docs: `phase-X-Y-description.md`
- ADRs: `NNNN-decision-title.md` (e.g., `0001-use-supabase.md`)

### Archive Organization (Date-Based)
- Archive path: `docs/archive/YYYY-MM/filename.md`
- Example: `docs/archive/2025-10/phase-2-completion.md`
- Use `docs/archive/legacy/` for undated historical content

### When to Archive
- Phase/sprint work completed more than 30 days ago
- Session prompts not updated in 30 days
- Debugging sessions once issue is resolved
- Implementation plans once implemented

## 📋 Pre-commit Checklist

**Functionality**: Help requests work, contact exchange requires consent, status updates reliable, mobile smooth, offline works

**Safety**: No exposed contact info, inputs validated, audit trails, privacy compliance

**Accessibility**: WCAG 2.1 AA, screen reader compatible, keyboard navigation, color contrast, 44px touch targets

**Technical**: TypeScript compiles (0 errors), 80%+ coverage, ESLint passes (0 warnings), schemas validate, queries efficient

**Community**: Supports building, inclusive language, clear value, no crisis barriers

## 🌟 Community Context

**Geography**: Missouri (Springfield, Branson, Joplin)
**Considerations**: Rural, limited transport/connectivity, diverse ages, crisis situations

**Success Metrics**: Requests connected, real-world help exchanges, accessibility for all, trust maintained, community growth

---

*Care Collective mutual aid platform - Next.js 14.2.32, Supabase, TypeScript. Focus: community safety, accessibility, trust. Updated: December 2025*
