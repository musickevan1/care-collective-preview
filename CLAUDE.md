# CLAUDE.md - Care Collective Platform

This file provides comprehensive guidance to Claude Code when working with the Care Collective mutual aid platform built with Next.js 15, Supabase, and TypeScript.

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

## 🧱 Code Structure & Modularity

### File and Component Limits
- **MAXIMUM 500 lines per file** - Care Collective prioritizes maintainability
- **Components under 200 lines** for accessibility and testing
- **Functions under 50 lines** with single responsibility
- **Clear feature separation** by mutual aid domain concepts

### Care Collective Project Structure

```
care-collective-preview-v1/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # Authentication flows (login/signup)
│   ├── dashboard/         # User dashboard with community overview
│   ├── requests/          # Help request management
│   │   ├── page.tsx       # Browse requests
│   │   ├── new/           # Create new request
│   │   └── [id]/          # Individual request details
│   ├── admin/             # Community management (read-only preview)
│   ├── design-system/     # Brand showcase and guidelines
│   └── api/               # API routes
├── components/            # Shared UI components
│   ├── ui/                # Base shadcn/ui components
│   ├── ContactExchange.tsx # Privacy-first contact sharing
│   ├── StatusBadge.tsx    # Request status indicators
│   └── ReadableModeToggle.tsx # Accessibility enhancement
├── lib/                   # Core utilities
│   ├── supabase/          # Database client configuration
│   ├── database.types.ts  # Generated Supabase types
│   ├── features.ts        # Feature flag management
│   └── utils.ts           # Utility functions
└── supabase/              # Database schema and migrations
```

## 🚀 Technology Stack

### Core Technologies
- **Next.js 15**: App Router with Turbopack development
- **React 19**: Server Components and modern React features
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
    "next": "15.4.6",
    "react": "19.1.0",
    "react-dom": "19.1.0",
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
    "setup:check": "node scripts/verify-setup.js"
  }
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

*This guide is optimized for the Care Collective mutual aid platform built with Next.js 15, Supabase, and TypeScript. Focus on community safety, accessibility, and trust in all development decisions.*

*Last updated: January 2025*