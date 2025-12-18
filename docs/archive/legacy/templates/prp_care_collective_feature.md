name: "Care Collective Feature PRP Template - Next.js/React/Supabase"
description: |
  Template for implementing features in the Care Collective platform

---

## Goal

**Feature Goal**: [Specific, measurable end state of what needs to be built for the Care Collective platform]

**Deliverable**: [Concrete artifact - React component, API route, database schema, etc.]

**Success Definition**: [How you'll know this is complete and working for Care Collective users]

## User Persona

**Target User**: [Community member seeking help, helper offering support, admin managing platform]

**Use Case**: [Primary scenario when this feature will be used in the Care Collective context]

**User Journey**: [Step-by-step flow of how user interacts with this feature]

**Pain Points Addressed**: [Specific Care Collective user frustrations this feature solves]

## Why

- [Business value and user impact for the Care Collective community]
- [Integration with existing Care Collective features (help requests, user management, etc.)]
- [Problems this solves for community members and volunteers]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]
- [ ] Feature works on mobile and desktop (responsive design)
- [ ] Integrates properly with Supabase authentication
- [ ] Follows Care Collective design system and accessibility standards

## All Needed Context

### Care Collective Codebase Context

```yaml
# Key files to understand the existing patterns
- file: app/layout.tsx
  why: Main layout structure and providers setup
  pattern: Root layout with auth providers and theme

- file: components/ui/
  why: Existing UI component patterns and design system
  pattern: Shadcn/ui components with custom styling

- file: lib/supabase/client.ts
  why: Supabase client setup and configuration
  pattern: Client-side database operations

- file: lib/auth.ts
  why: Authentication patterns and user management
  pattern: User authentication and session handling

- file: app/requests/
  why: Existing request management patterns
  pattern: CRUD operations for help requests

- file: middleware.ts
  why: Route protection and auth middleware
  pattern: Protecting authenticated routes
```

### Current Codebase Structure

```bash
care-collective-preview-v1/
├── app/                    # Next.js 15 app directory
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── requests/          # Help request management
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI component library
│   └── [feature-components]
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Database client setup
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── supabase/             # Database migrations and config
│   ├── migrations/       # SQL migration files
│   └── seed.sql         # Demo data
└── tailwind.config.ts    # Styling configuration
```

### Desired Codebase Structure After Implementation

```bash
# Add new files and their responsibilities here
```

### Care Collective Tech Stack & Patterns

```typescript
// CRITICAL: Next.js 15 App Router patterns
// Use app directory structure, not pages directory

// CRITICAL: Supabase integration patterns
const supabase = createClientComponentClient<Database>()
// Use typed database operations with generated types

// CRITICAL: Authentication patterns
// All protected routes should check auth status
// Use middleware.ts for route protection

// CRITICAL: Component patterns
// Follow Shadcn/ui component structure
// Use Tailwind CSS for styling
// Ensure mobile responsiveness

// CRITICAL: Database patterns
// Use Row Level Security (RLS) policies
// Follow existing table naming conventions
// Update database.types.ts after schema changes
```

## Implementation Blueprint

### Database Schema (if needed)

```sql
-- Add any new tables, columns, or RLS policies here
-- Follow existing patterns in supabase/migrations/
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE components/[ComponentName].tsx
  - IMPLEMENT: React component following Care Collective design patterns
  - FOLLOW pattern: components/ui/ (component structure, props, styling)
  - NAMING: PascalCase for components, descriptive names
  - DEPENDENCIES: Import from lib/supabase/client.ts if data needed
  - PLACEMENT: components/ directory or components/ui/ if reusable

Task 2: CREATE app/[feature]/page.tsx (if new page)
  - IMPLEMENT: Next.js 15 page component with proper metadata
  - FOLLOW pattern: app/requests/page.tsx (page structure, auth checks)
  - NAMING: page.tsx in feature directory
  - DEPENDENCIES: Import component from Task 1
  - PLACEMENT: app/[feature]/ directory

Task 3: CREATE app/api/[endpoint]/route.ts (if API needed)
  - IMPLEMENT: Next.js API route with proper error handling
  - FOLLOW pattern: app/api/health/route.ts (API structure, responses)
  - NAMING: route.ts in API directory
  - DEPENDENCIES: Use lib/supabase/server.ts for server-side operations
  - PLACEMENT: app/api/[endpoint]/ directory

Task 4: UPDATE supabase/migrations/[timestamp]_[description].sql (if schema changes)
  - IMPLEMENT: SQL migration following existing patterns
  - FOLLOW pattern: existing migration files (RLS policies, indexes)
  - NAMING: timestamp_descriptive_name.sql
  - DEPENDENCIES: Update database.types.ts after running migration
  - PLACEMENT: supabase/migrations/ directory

Task 5: UPDATE lib/database.types.ts (if schema changes)
  - IMPLEMENT: Regenerate types after database changes
  - COMMAND: npx supabase gen types typescript --local > lib/database.types.ts
  - DEPENDENCIES: Complete Task 4 first
  - PLACEMENT: lib/ directory

Task 6: CREATE components/tests/[ComponentName].test.tsx (if testing)
  - IMPLEMENT: Component tests using React Testing Library
  - FOLLOW pattern: existing test patterns if available
  - NAMING: ComponentName.test.tsx
  - COVERAGE: User interactions, accessibility, error states
  - PLACEMENT: components/tests/ directory
```

### Implementation Patterns & Key Details

```typescript
// Next.js 15 App Router page pattern
export default function FeaturePage() {
  // PATTERN: Server component by default, use 'use client' only when needed
  // PATTERN: Fetch data at component level or use server actions
  return (
    <div className="container mx-auto px-4 py-8">
      {/* PATTERN: Use container classes for consistent spacing */}
    </div>
  )
}

// React component pattern
'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function FeatureComponent() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()
  
  // PATTERN: Handle loading states and errors gracefully
  // PATTERN: Use Supabase client for data operations
  // PATTERN: Follow existing component prop patterns
  
  return (
    <div className="space-y-4">
      {/* PATTERN: Use Tailwind spacing utilities */}
    </div>
  )
}

// API route pattern
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // PATTERN: Always check authentication for protected routes
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // PATTERN: Use proper error handling and status codes
  // PATTERN: Return consistent JSON response format
}
```

### Integration Points

```yaml
NAVIGATION:
  - add to: components/MobileNav.tsx or main navigation
  - pattern: "Add new menu item following existing structure"

AUTHENTICATION:
  - integrate with: lib/auth.ts and middleware.ts
  - pattern: "Check user roles and permissions"

DATABASE:
  - connect to: existing Supabase setup
  - pattern: "Use existing RLS policies or create new ones"

STYLING:
  - follow: tailwind.config.ts and existing component styles
  - pattern: "Use design tokens and consistent spacing"
```

## Validation Loop

### Level 1: Development Environment (Immediate Feedback)

```bash
# Type checking and linting
npm run type-check                    # TypeScript validation
npm run lint                         # ESLint validation
npm run build                        # Next.js build validation

# Expected: Zero errors. Fix any issues before proceeding.
```

### Level 2: Local Testing (Component Validation)

```bash
# Start development server
npm run dev

# Test in browser
# - Navigate to new feature at http://localhost:3000/[feature-path]
# - Test mobile responsiveness (DevTools mobile view)
# - Test authentication flows (login/logout)
# - Test data operations (create/read/update/delete)
# - Test error states (network errors, validation errors)

# Expected: All user interactions work correctly, responsive design functions properly
```

### Level 3: Database & Migration Testing (System Validation)

```bash
# Test database migrations (if applicable)
npx supabase migration up            # Apply new migrations
npx supabase gen types typescript --local > lib/database.types.ts  # Update types

# Test RLS policies
# - Verify users can only access their own data
# - Test admin access patterns
# - Verify data security

# Expected: All database operations work correctly, security policies enforced
```

### Level 4: Care Collective Specific Validation

```bash
# Test core user journeys
# 1. Community member creates help request
# 2. Helper responds to request
# 3. Admin manages platform (if applicable)
# 4. Contact exchange process (if applicable)

# Test accessibility
# - Screen reader compatibility
# - Keyboard navigation
# - Color contrast (check against WCAG guidelines)

# Test performance
# - Page load times
# - Component rendering performance
# - Database query efficiency

# Expected: All Care Collective user flows work correctly, accessibility standards met
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compilation successful: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Next.js build successful: `npm run build`
- [ ] Development server runs without errors: `npm run dev`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful across all user types
- [ ] Mobile responsiveness verified
- [ ] Authentication integration working
- [ ] Database operations function correctly
- [ ] Error handling works gracefully

### Care Collective Integration

- [ ] Follows existing design system and component patterns
- [ ] Integrates with Supabase authentication and database
- [ ] Maintains data security with proper RLS policies
- [ ] Accessible to users with disabilities
- [ ] Works within existing navigation and layout structure

### Code Quality Validation

- [ ] Code follows existing patterns and naming conventions
- [ ] File placement matches Care Collective structure
- [ ] TypeScript types properly defined and used
- [ ] Error handling implemented consistently
- [ ] Performance considerations addressed

---

## Anti-Patterns to Avoid

- ❌ Don't use pages directory (use app directory for Next.js 15)
- ❌ Don't bypass authentication checks on protected routes
- ❌ Don't ignore mobile responsiveness
- ❌ Don't hardcode API endpoints or database queries
- ❌ Don't skip RLS policy testing
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't ignore accessibility requirements
- ❌ Don't create new patterns when existing ones work