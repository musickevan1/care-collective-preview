# 🤖 Agent Workflow System - Care Collective

**Complete Documentation for AI Assistant Workflow**

This document defines the standardized agent workflow for all Care Collective development tasks. **ALWAYS follow this workflow** to ensure consistent quality, comprehensive testing, and domain-specific validation.

Referenced in: `CLAUDE.md` - AI Assistant Guidelines

### Overview

```
User Input → Coordinator → Exploration → Planning → Production → Verification → Deployment → Handoff
```

### Context Budget Allocation

**Total Available Context**: ~200k tokens per session

**Phase Allocation**:
- **Phase 0 (Coordinator)**: 5-10% - Request analysis, agent orchestration
- **Phase 1 (Exploration)**: 15-30% - Codebase exploration, pattern discovery
- **Phase 2 (Planning)**: 15-35% - Architecture, security, accessibility planning
- **Phase 3 (Production)**: 45-75% - Implementation, testing, documentation
- **Phase 4 (Verification)**: 5-10% - Quality gates, compliance checks
- **Phase 5-9 (Deployment/Handoff)**: 5-10% - Git, deployment, summary

### Phase 0: Coordinator Agent

**Responsibility**: Request analysis, agent orchestration, context budget management

**Actions**:
1. Analyze user request complexity and domain context
2. Determine required agent chain based on request type
3. Allocate context budget across phases
4. Create initial TODO list with TodoWrite tool
5. Launch parallel agents for independent tasks
6. Monitor agent progress and context usage

**Decision Matrix**:
- Simple bug fix: Skip exploration, minimal planning
- New feature: Full workflow with all phases
- Refactoring: Focus on exploration and testing
- Security/Privacy: Mandatory privacy/security agents
- Accessibility: Mandatory accessibility planning/audit

**Output**: Agent execution plan, TODO list, context budget allocation

---

### Phase 1: Exploration (15-30% Context)

**Launch agents in parallel for efficiency**

#### 1a. Domain Explore Agent

**Responsibility**: Identify affected domain patterns and components

**Tools**: Task tool with `subagent_type="Explore"`

**Thoroughness**:
- "quick": Simple lookups (5-10% context)
- "medium": Feature understanding (10-20% context)
- "very thorough": Architectural analysis (20-30% context)

**Prompt Template**:
```typescript
Task({
  subagent_type: "Explore",
  description: "Explore {domain} patterns",
  prompt: `Search the codebase for patterns related to {domain}:

  Domain context: {help_requests|messaging|contact_exchange|admin}

  Find:
  1. Existing components and their patterns
  2. API routes and server actions
  3. Related utility functions
  4. Validation schemas
  5. Test patterns

  Thoroughness: {"quick"|"medium"|"very thorough"}

  Return: File paths, key patterns, architectural notes`
})
```

**Output**: File paths, existing patterns, architectural context

#### 1b. Database Explore Agent

**Responsibility**: Map database schema, RLS policies, relationships

**Tools**:
- Task tool with `subagent_type="Explore"`
- Supabase MCP: `list_tables`, `execute_sql`

**Prompt Template**:
```typescript
Task({
  subagent_type: "Explore",
  description: "Explore database schema",
  prompt: `Analyze database schema for {feature}:

  Tables to investigate: {table_names}

  Find:
  1. Table structure and columns
  2. Foreign key relationships
  3. Existing RLS policies
  4. Recent migrations affecting these tables
  5. Indexes and constraints

  Use supabase MCP tools to inspect schema.

  Return: Schema summary, RLS policy notes, migration context`
})
```

**Output**: Schema structure, RLS policies, migration context

#### 1c. Dependencies Explore Agent

**Responsibility**: Locate types, schemas, tests, dependencies

**Tools**: Task tool, Grep, Glob

**Prompt Template**:
```typescript
Task({
  subagent_type: "Explore",
  description: "Find dependencies and types",
  prompt: `Locate dependencies for {feature}:

  Search for:
  1. TypeScript type definitions (database.types.ts)
  2. Zod validation schemas
  3. Existing test patterns and utilities
  4. Component dependencies (hooks, contexts, utils)
  5. Related npm packages

  Return: Type definitions, schemas, test patterns, dependencies`
})
```

**Output**: Type definitions, validation schemas, test patterns

**Parallel Execution Example**:
```typescript
// ✅ EFFICIENT: Single message with all explore agents
[
  Task(Domain Explore),
  Task(Database Explore),
  Task(Dependencies Explore)
]

// ❌ INEFFICIENT: Sequential execution
Task(Domain Explore) → Wait → Task(Database Explore) → Wait → Task(Dependencies)
```

---

### Phase 2: Planning (15-35% Context)

**Launch planning agents based on domain requirements**

#### 2a. Architecture Planning Agent

**Responsibility**: Define component structure, data flow, file organization

**Actions**:
1. Plan Server vs Client component split
2. Design data flow (props, state, server actions)
3. Create file organization plan
4. Enforce 500-line file limit, 200-line component limit
5. Plan code separation (UI, logic, data access)

**Output Template**:
```markdown
## Architecture Plan

### Component Structure
- `ComponentName.tsx` (Client Component, ~150 lines)
  - State management approach
  - Props interface
  - Event handlers

### Server Actions
- `actions.ts` (Server Action, ~100 lines)
  - Data fetching functions
  - Validation logic
  - Error handling

### File Organization
- app/{route}/
  - page.tsx (Server Component)
  - {feature}-form.tsx (Client Component)
  - actions.ts (Server Actions)
  - schema.ts (Zod schemas)
```

#### 2b. Privacy & Security Planning Agent

**Responsibility**: Plan consent flows, PII protection, audit trails, encryption

**Required for**: Contact exchange, messaging, user profile updates

**Actions**:
1. Identify PII data points (phone, email, location)
2. Plan explicit consent mechanisms (checkboxes, confirmations)
3. Design audit trail structure (who, what, when, consent status)
4. Determine encryption needs (ContactEncryptionService)
5. Plan privacy violation detection (PrivacyEventTracker)
6. Design input sanitization approach

**Output Template**:
```markdown
## Privacy & Security Plan

### PII Data Points
- Phone number: Requires explicit consent checkbox
- Email: Requires explicit consent checkbox
- Message content: Check for accidental PII exposure

### Consent Flow
1. User clicks "Share Contact"
2. Modal displays privacy notice
3. Explicit checkbox: "I consent to share my {contact_method}"
4. Server-side validation of consent=true
5. Audit trail logged in contact_exchanges table

### Encryption
- Sensitivity level: {none|medium|high}
- Encryption service: ContactEncryptionService (if high)
- Storage: encrypted_content column

### Audit Trail
- Table: contact_exchanges
- Columns: consent_given, consent_timestamp, shared_by, shared_with
```

#### 2c. Database Schema Planning Agent

**Responsibility**: Design table changes, RLS policies, migrations, indexes

**Tools**: Supabase MCP for schema inspection

**Actions**:
1. Design new tables or column additions
2. Plan foreign key relationships
3. Create RLS policy definitions
4. Plan indexes for query performance
5. Design migration strategy (additive vs breaking)
6. Consider data migration for existing records

**Output Template**:
```markdown
## Database Schema Plan

### Table: {table_name}
```sql
CREATE TABLE {table_name} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  {column_name} {type} {constraints},
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_{table}_{column} ON {table}({column});
```

### RLS Policies
```sql
-- Users can read their own records
CREATE POLICY "Users can read own {table}"
  ON {table} FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own {table}"
  ON {table} FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Migration Strategy
1. Create migration: `YYYYMMDDHHMMSS_add_{feature}.sql`
2. Additive changes only (no DROP columns)
3. Data migration: UPDATE existing records if needed
```

#### 2d. Accessibility Planning Agent

**Responsibility**: Plan WCAG 2.1 AA compliance, keyboard nav, screen reader support

**Required for**: All UI components

**Actions**:
1. Plan ARIA labels and roles
2. Design keyboard navigation flow
3. Ensure 44px minimum touch targets
4. Plan color contrast (brand colors + WCAG AA)
5. Design screen reader announcements
6. Plan focus management

**Output Template**:
```markdown
## Accessibility Plan

### ARIA Labels
- Form fields: `aria-label` or `<label>` association
- Buttons: Descriptive `aria-label` (not just "Submit")
- Status badges: `aria-label="Status: {status}, urgency: {urgency}"`

### Keyboard Navigation
- Tab order: Natural DOM order (top to bottom, left to right)
- Focus visible: Custom focus ring using `focus:ring-2 focus:ring-sage`
- Skip links: For navigation (if needed)
- Escape key: Close modals/dialogs

### Touch Targets
- All interactive elements: `min-h-[44px] min-w-[44px]`
- Buttons: `px-4 py-2` minimum
- Links: Adequate padding around text

### Color Contrast
- Text on background: #483129 on #FBF2E9 (✅ WCAG AA)
- Button text on sage: Check contrast ratio ≥4.5:1
- Status badges: Verify contrast for each state

### Screen Reader
- Form errors: `aria-live="polite"` announcements
- Loading states: `aria-busy="true"`
- Dynamic content: Announce updates
```

#### 2e. Test Planning Agent

**Responsibility**: Define test cases, plan 80% coverage strategy, identify edge cases

**Actions**:
1. Define unit test cases for each function
2. Plan integration tests for critical flows
3. Identify edge cases (empty states, errors, validation failures)
4. Plan accessibility tests (@testing-library/react)
5. Plan E2E scenarios (if needed)
6. Ensure 80% coverage strategy

**Output Template**:
```markdown
## Test Plan

### Unit Tests

#### Component: {ComponentName}
- ✅ Renders without crashing
- ✅ Displays correct props data
- ✅ Handles user interactions (click, submit)
- ✅ Shows validation errors
- ✅ Accessibility: ARIA labels, keyboard nav
- ✅ Edge case: Empty state
- ✅ Edge case: Loading state
- ✅ Edge case: Error state

#### Function: {functionName}
- ✅ Returns expected output for valid input
- ✅ Throws error for invalid input
- ✅ Validates schema with Zod
- ✅ Edge case: Empty string
- ✅ Edge case: Maximum length

### Integration Tests

#### Flow: Contact Exchange
1. User views help request
2. Clicks "Share Contact"
3. Fills form with consent checkbox
4. Submits successfully
5. Audit trail created
6. Helper receives notification

### Coverage Target
- Minimum: 80% overall coverage
- Critical paths: 100% coverage (contact exchange, auth)
```

---

### Phase 3: Production (45-75% Context)

**Execute implementation agents sequentially based on dependencies**

#### 3a. Database Implementation Agent

**Responsibility**: Create migrations, implement RLS policies, update types

**Tools**: Supabase MCP (`apply_migration`, `execute_sql`)

**Execution Order**: First (foundation for all other implementations)

**Actions**:
1. Create migration file with descriptive name
2. Implement table changes (CREATE TABLE, ALTER TABLE)
3. Add RLS policies for security
4. Create indexes for performance
5. Run migration with `supabase MCP apply_migration`
6. Update `lib/database.types.ts` with `npm run db:types`

**Code Template**:
```typescript
// Use Supabase MCP apply_migration
supabase_mcp.apply_migration({
  name: "add_contact_exchanges_table",
  query: `
    CREATE TABLE contact_exchanges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id uuid REFERENCES help_requests(id) NOT NULL,
      requester_id uuid REFERENCES auth.users(id) NOT NULL,
      helper_id uuid REFERENCES auth.users(id) NOT NULL,
      contact_shared text NOT NULL,
      consent_given boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );

    -- RLS Policies
    ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can read exchanges they're part of"
      ON contact_exchanges FOR SELECT
      USING (auth.uid() = requester_id OR auth.uid() = helper_id);

    CREATE POLICY "Users can create exchanges as helper"
      ON contact_exchanges FOR INSERT
      WITH CHECK (auth.uid() = helper_id AND consent_given = true);

    -- Indexes
    CREATE INDEX idx_contact_exchanges_request ON contact_exchanges(request_id);
    CREATE INDEX idx_contact_exchanges_helper ON contact_exchanges(helper_id);
  `
});

// After migration, update types
bash: npm run db:types
```

#### 3b. Schema & Validation Agent

**Responsibility**: Create Zod schemas, type guards, validation logic

**Execution Order**: Second (after database schema exists)

**Actions**:
1. Create Zod schemas matching database structure
2. Implement type guards for runtime validation
3. Add input validation with clear error messages
4. Create validation helpers (sanitization, normalization)

**Code Template**:
```typescript
// lib/schemas/contact-exchange.ts
import { z } from 'zod';

export const contactExchangeSchema = z.object({
  requestId: z.string().uuid({ message: "Invalid request ID" }),
  contactMethod: z.enum(['phone', 'email'], {
    errorMap: () => ({ message: "Contact method must be phone or email" })
  }),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(200, "Message must be less than 200 characters"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must consent to share your contact information" })
  }),
});

export type ContactExchange = z.infer<typeof contactExchangeSchema>;

// Type guard
export function isContactExchange(value: unknown): value is ContactExchange {
  return contactExchangeSchema.safeParse(value).success;
}
```

#### 3c. Component Implementation Agent

**Responsibility**: Build UI components with accessibility, brand colors, responsiveness

**Execution Order**: Third (after schemas exist)

**Actions**:
1. Create component file following naming conventions
2. Implement accessibility (ARIA labels, keyboard nav)
3. Apply brand colors from design system
4. Use ReactElement return type (NOT JSX.Element)
5. Enforce 200-line component limit
6. Add proper TypeScript types
7. Implement loading/error states

**Code Template**:
```typescript
// components/contact-exchange-form.tsx
'use client';

import { ReactElement, useState } from 'react';
import { contactExchangeSchema, ContactExchange } from '@/lib/schemas/contact-exchange';
import { shareContactAction } from './actions';

interface ContactExchangeFormProps {
  requestId: string;
  helperName: string;
}

export function ContactExchangeForm({
  requestId,
  helperName
}: ContactExchangeFormProps): ReactElement {
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate with Zod
      const validated = contactExchangeSchema.parse({
        requestId,
        contactMethod: 'email', // Get from form
        message,
        consent,
      });

      await shareContactAction(validated);

      // Success handling
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to share contact information');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-secondary">
          Message to {helperName}
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
            focus:border-sage focus:ring-sage"
          rows={4}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "message-error" : undefined}
        />
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-sage
            focus:ring-sage min-h-[44px] min-w-[44px]"
          aria-required="true"
        />
        <label htmlFor="consent" className="ml-3 text-sm text-secondary">
          I consent to share my contact information with {helperName}
        </label>
      </div>

      {error && (
        <div
          id="message-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full px-4 py-2 bg-sage text-white rounded-lg
          hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage
          disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        aria-label={`Share contact with ${helperName}`}
      >
        {loading ? 'Sharing...' : 'Share Contact'}
      </button>
    </form>
  );
}
```

#### 3d. API/Server Action Agent

**Responsibility**: Implement server actions, Supabase queries, error handling

**Execution Order**: Fourth (after components are designed)

**Actions**:
1. Create server action file
2. Implement Supabase client queries
3. Add comprehensive error handling
4. Implement rate limiting (if needed)
5. Add logging for audit trails
6. Use 'use server' directive

**Code Template**:
```typescript
// app/requests/[id]/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { contactExchangeSchema, ContactExchange } from '@/lib/schemas/contact-exchange';
import { revalidatePath } from 'next/cache';

export async function shareContactAction(data: ContactExchange) {
  const supabase = createClient();

  // Validate input
  const validated = contactExchangeSchema.parse(data);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  // Get user's contact info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error('Failed to retrieve contact information');
  }

  // Create contact exchange record
  const { data: exchange, error: exchangeError } = await supabase
    .from('contact_exchanges')
    .insert({
      request_id: validated.requestId,
      helper_id: user.id,
      contact_shared: validated.contactMethod === 'email' ? profile.email : profile.phone,
      consent_given: validated.consent,
      message: validated.message,
    })
    .select()
    .single();

  if (exchangeError) {
    console.error('Contact exchange error:', exchangeError);
    throw new Error('Failed to share contact information');
  }

  // Revalidate request page
  revalidatePath(`/requests/${validated.requestId}`);

  return { success: true, exchangeId: exchange.id };
}
```

#### 3e. Privacy & Encryption Agent

**Responsibility**: Implement consent mechanisms, encryption, audit trails, privacy detection

**Execution Order**: Fifth (runs alongside API implementation for sensitive features)

**Required for**: Contact exchange, messaging, user data collection

**Actions**:
1. Implement explicit consent UI (checkboxes, confirmations)
2. Add encryption using ContactEncryptionService (if high sensitivity)
3. Implement audit trail logging
4. Add privacy violation detection using PrivacyEventTracker
5. Ensure server-side consent validation

**Code Template**:
```typescript
// lib/privacy/contact-sharing.ts
import { ContactEncryptionService } from '@/lib/security/contact-encryption';
import { PrivacyEventTracker } from '@/lib/privacy/event-tracker';

const encryption = new ContactEncryptionService();
const privacyTracker = new PrivacyEventTracker();

export async function shareContactWithPrivacy(
  userId: string,
  requestId: string,
  contactInfo: string,
  consent: boolean
) {
  // Verify consent
  if (!consent) {
    throw new Error('Explicit consent required to share contact information');
  }

  // Detect privacy violations in message
  const violation = await privacyTracker.detectViolation({
    action: 'contact_share',
    userId,
    content: contactInfo,
    context: { requestId },
  });

  if (violation.violation_detected) {
    throw new Error(`Privacy violation: ${violation.violation_type}`);
  }

  // Encrypt sensitive contact info
  const { encrypted_data } = await encryption.encryptSensitiveData(
    contactInfo,
    `contact:${requestId}`,
    { userId, requestId }
  );

  // Log audit trail
  await privacyTracker.logEvent({
    event_type: 'contact_shared',
    user_id: userId,
    consent_given: true,
    context: { requestId, encrypted: true },
  });

  return { encrypted_contact: encrypted_data };
}
```

#### 3f. Test Implementation Agent

**Responsibility**: Write unit tests, integration tests, achieve 80%+ coverage

**Execution Order**: Sixth (after implementation is complete)

**Tools**: Vitest, @testing-library/react

**Actions**:
1. Write unit tests for each component
2. Write unit tests for each function
3. Write integration tests for critical flows
4. Test accessibility with @testing-library
5. Achieve 80%+ code coverage
6. Test all edge cases (empty, loading, error states)

**Code Template**:
```typescript
// components/contact-exchange-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactExchangeForm } from './contact-exchange-form';
import * as actions from './actions';

vi.mock('./actions');

describe('ContactExchangeForm', () => {
  it('renders form with all fields', () => {
    render(<ContactExchangeForm requestId="123" helperName="Alice" />);

    expect(screen.getByLabelText(/message to alice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i consent to share/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share contact/i })).toBeInTheDocument();
  });

  it('blocks submission without consent', async () => {
    render(<ContactExchangeForm requestId="123" helperName="Alice" />);

    const submitButton = screen.getByRole('button', { name: /share contact/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submission with consent', async () => {
    const user = userEvent.setup();
    render(<ContactExchangeForm requestId="123" helperName="Alice" />);

    const checkbox = screen.getByLabelText(/i consent/i);
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /share contact/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows error for invalid message length', async () => {
    const user = userEvent.setup();
    vi.mocked(actions.shareContactAction).mockRejectedValue(
      new Error('Message must be at least 10 characters')
    );

    render(<ContactExchangeForm requestId="123" helperName="Alice" />);

    const message = screen.getByLabelText(/message to alice/i);
    await user.type(message, 'Short');

    const checkbox = screen.getByLabelText(/i consent/i);
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /share contact/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 10 characters/i);
    });
  });

  it('meets accessibility requirements', () => {
    const { container } = render(<ContactExchangeForm requestId="123" helperName="Alice" />);

    // Check ARIA labels
    expect(screen.getByLabelText(/message to alice/i)).toHaveAttribute('aria-required', 'true');

    // Check touch targets (44px minimum)
    const checkbox = screen.getByLabelText(/i consent/i);
    expect(checkbox).toHaveClass('min-h-[44px]', 'min-w-[44px]');

    const submitButton = screen.getByRole('button');
    expect(submitButton).toHaveClass('min-h-[44px]');
  });
});
```

---

### Phase 4: Verification (5-10% Context)

**Run verification agents in parallel**

#### 4a. Type & Lint Verification Agent

**Responsibility**: Verify TypeScript compiles, ESLint passes

**Tools**: Bash tool

**Quality Gate**: ❌ BLOCKS deployment if fails

**Actions**:
```bash
# Type check (must pass with 0 errors)
npm run type-check

# Lint check (must pass with 0 warnings)
npm run lint

# Verify no JSX.Element usage (use ReactElement)
rg "JSX\.Element" --type ts
```

**Success Criteria**:
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 warnings
- ✅ No JSX.Element namespace usage

#### 4b. Test Verification Agent

**Responsibility**: Run tests, verify 80%+ coverage

**Tools**: Bash tool

**Quality Gate**: ❌ BLOCKS deployment if fails

**Actions**:
```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage
```

**Success Criteria**:
- ✅ All tests pass
- ✅ Coverage ≥ 80% overall
- ✅ Critical paths: 100% coverage

#### 4c. Build Verification Agent

**Responsibility**: Verify build succeeds, service worker cache updated

**Tools**: Bash tool

**Quality Gate**: ❌ BLOCKS deployment if fails

**Actions**:
```bash
# Build (includes prebuild hook for service worker)
npm run build

# Verify service worker cache version updated
cat public/service-worker.js | grep "CACHE_VERSION"
```

**Success Criteria**:
- ✅ Build completes without errors
- ✅ Service worker cache version incremented
- ✅ No build warnings for critical issues

#### 4d. Privacy & Security Audit Agent

**Responsibility**: Verify no exposed PII, consent requirements, input sanitization

**Tools**: Supabase MCP (`get_advisors`), Code review

**Quality Gate**: ❌ BLOCKS deployment if violations found

**Actions**:
1. Review code for exposed contact info (email, phone in responses)
2. Verify consent checkboxes for all PII sharing
3. Check input sanitization (SQL injection, XSS prevention)
4. Verify audit trail logging
5. Run Supabase security advisors

```bash
# Get security advisors from Supabase
supabase_mcp.get_advisors({ type: "security" })
```

**Success Criteria**:
- ✅ No contact info exposed without consent
- ✅ All PII sharing has explicit consent UI
- ✅ Input validation implemented
- ✅ Audit trails present
- ✅ No security advisor warnings

#### 4e. Accessibility Audit Agent

**Responsibility**: Verify WCAG 2.1 AA compliance

**Tools**: A11y MCP (`scan_page`), Code review

**Quality Gate**: ❌ BLOCKS deployment if violations found

**Actions**:
1. Run accessibility scan with a11y MCP
2. Verify keyboard navigation (Tab, Enter, Escape)
3. Check ARIA labels on all interactive elements
4. Measure touch targets (44px minimum)
5. Verify color contrast (WCAG AA)

```bash
# Scan page for accessibility issues
a11y_mcp.scan_page({ violationsTag: ["wcag2aa", "wcag21aa"] })
```

**Success Criteria**:
- ✅ No WCAG 2.1 AA violations
- ✅ All interactive elements keyboard accessible
- ✅ ARIA labels present and descriptive
- ✅ Touch targets ≥ 44px
- ✅ Color contrast ≥ 4.5:1

#### 4f. Mobile Verification Agent

**Responsibility**: Test responsive design, mobile navigation, offline functionality

**Tools**: Playwright MCP

**Quality Gate**: ⚠️ WARNING if issues, review required

**Actions**:
```typescript
// Resize to mobile viewport
playwright_mcp.browser_resize({ width: 375, height: 667 });

// Navigate to page
playwright_mcp.browser_navigate({ url: "http://localhost:3000/requests" });

// Test touch targets
playwright_mcp.browser_snapshot();

// Test offline (if service worker implemented)
// Disable network and verify graceful degradation
```

**Success Criteria**:
- ✅ Responsive design works on mobile (375px width)
- ✅ Touch targets accessible
- ✅ Navigation functional
- ✅ Offline shows appropriate message

**Quality Gate Decision**:
```
IF any verification agent fails:
  ❌ STOP workflow
  → Return to Production phase to fix issues
  → Re-run verification after fixes

ELSE IF all verifications pass:
  ✅ PROCEED to Deployment phase
```

---

### Phase 5: E2E Testing (Optional, 5% Context)

**Run only for critical features or user flows**

#### 5a. Playwright E2E Agent

**Responsibility**: Test complete user flows end-to-end

**Tools**: Playwright MCP

**When to Use**: New features, contact exchange, messaging, authentication

**Actions**:
```typescript
// Example: Contact exchange flow
1. playwright_mcp.browser_navigate({ url: "http://localhost:3000/requests/123" })
2. playwright_mcp.browser_click({ element: "Share Contact button", ref: "..." })
3. playwright_mcp.browser_fill_form({ fields: [...] })
4. playwright_mcp.browser_click({ element: "Submit button", ref: "..." })
5. playwright_mcp.browser_snapshot() // Verify success state
```

**Success Criteria**:
- ✅ Complete flow works without errors
- ✅ Privacy consent enforced
- ✅ Data persisted to database
- ✅ User sees success confirmation

---

### Phase 6: Documentation & Status (5% Context)

#### 6a. Documentation Agent

**Responsibility**: Update PROJECT_STATUS.md, phase plans, inline docs

**Actions**:
1. Update `PROJECT_STATUS.md` with completion status
2. Update relevant phase plan in `docs/context-engineering/phase-plans/`
3. Document breaking changes (if any)
4. Add inline code documentation (JSDoc)
5. Update README.md (if user-facing changes)

**Template**:
```markdown
## Updated in PROJECT_STATUS.md

### Phase 2.1: Messaging System
- [x] Contact exchange consent flow
  - Components: ContactExchangeForm
  - Server actions: shareContactAction
  - Privacy: Explicit consent, audit trail
  - Tests: 85% coverage
  - Status: ✅ Complete
```

---

### Phase 7: Git & Deployment (5% Context)

**CRITICAL: ALWAYS ask user for permission before committing or deploying**

#### 7a. Git Commit Agent

**Responsibility**: Commit changes to git with descriptive message

**Tools**: GitHub MCP, Bash tool

**User Consent**: ✋ REQUIRED before execution

**Actions**:
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add contact exchange consent flow 🤖 Generated by {agent_name} ({model_name})

- Implement explicit consent checkbox for contact sharing
- Add privacy audit trail to contact_exchanges table
- Add Zod validation for consent requirement
- Add accessibility support (WCAG 2.1 AA)
- Add comprehensive tests (85% coverage)"

# Push to main branch (creates preview deployment)
git push origin main
```

**Commit Message Format**:
```
{type}: {Brief description} 🤖 Generated by {agent_name} ({model_name})

{Detailed bullet points}
- Change 1
- Change 2
- Change 3
```

**Types**: feat, fix, refactor, test, docs, chore

#### 7b. Vercel Deployment Agent

**Responsibility**: Deploy to production, verify deployment

**Tools**: Bash tool

**User Consent**: ✋ REQUIRED before execution

**Actions**:
```bash
# Deploy to production (REQUIRED to update main domain)
npx vercel --prod

# Capture deployment URL from output
# Example: https://care-collective-preview.vercel.app

# Verify deployment
npx vercel inspect <deployment-url> --logs
```

**Critical Reminder**:
> **NEVER skip `npx vercel --prod`** - Without it, the main domain (`care-collective-preview.vercel.app`) will show old code! Regular git pushes only create preview deployments.

#### 7c. Production Verification Agent

**Responsibility**: Test production URL, verify cache headers, run smoke tests

**Tools**: Playwright MCP, Bash tool

**Actions**:
```typescript
// Navigate to production URL
playwright_mcp.browser_navigate({
  url: "https://care-collective-preview.vercel.app/requests/123"
});

// Verify page loads
playwright_mcp.browser_snapshot();

// Check service worker version
playwright_mcp.browser_console_messages();

// Verify database connectivity
// (Check if data loads from Supabase)

// Run smoke test: Critical user flow
```

**Success Criteria**:
- ✅ Production URL accessible
- ✅ Service worker updated (new cache version)
- ✅ Database connectivity working
- ✅ Critical features functional

---

### Phase 8: Pull Request (Optional, 5% Context)

**Use only if PR workflow is enabled (currently direct to main)**

#### 8a. PR Creation Agent

**Responsibility**: Create descriptive PR with summary, changes, test results

**Tools**: GitHub MCP

**Actions**:
```typescript
github_mcp.create_pull_request({
  owner: "musickevan1",
  repo: "care-collective-preview",
  title: "feat: Add contact exchange consent flow",
  head: "feature-branch",
  base: "main",
  body: `## Summary
- Implement explicit consent mechanism for contact sharing
- Add privacy audit trail
- Achieve WCAG 2.1 AA compliance

## Changes
- \`components/contact-exchange-form.tsx\`: New component with consent checkbox
- \`app/requests/[id]/actions.ts\`: Server action for contact sharing
- \`lib/schemas/contact-exchange.ts\`: Zod validation schema
- Migration: \`add_contact_exchanges_table.sql\`

## Test Results
- ✅ Unit tests: 15/15 passed
- ✅ Coverage: 85%
- ✅ Type check: Passed
- ✅ Lint: Passed
- ✅ Accessibility: No violations

## Privacy & Security
- ✅ Explicit consent required (server + client validation)
- ✅ Audit trail logged in contact_exchanges table
- ✅ No PII exposed without consent

## Deployment
Preview: https://musickevan1s-projects.vercel.app/abc123

🤖 Generated with Claude Code
`
});
```

#### 8b. PR Review Agent (Optional)

**Responsibility**: Request automated review, check diff for issues

**Tools**: GitHub MCP

**Actions**:
```typescript
// Request Copilot review
github_mcp.request_copilot_review({
  owner: "musickevan1",
  repo: "care-collective-preview",
  pullNumber: 10
});

// Review diff manually for:
// - Privacy issues (exposed PII)
// - Accessibility patterns (ARIA labels)
// - Test coverage completeness
```

#### 8c. Merge Agent

**Responsibility**: Merge PR after approval

**Tools**: GitHub MCP

**User Consent**: ✋ REQUIRED before execution

**Actions**:
```typescript
github_mcp.merge_pull_request({
  owner: "musickevan1",
  repo: "care-collective-preview",
  pullNumber: 10,
  merge_method: "squash",
  commit_title: "feat: Add contact exchange consent flow",
  commit_message: "Implements explicit consent mechanism with privacy audit trail"
});
```

---

### Phase 9: Handoff & Session Summary (5% Context)

#### 9a. Session Summary Agent

**Responsibility**: Generate /compact summary, document lessons learned, create handoff notes

**Tools**: TodoWrite (mark all todos complete), /compact command

**Actions**:
1. Mark all TODO items as completed
2. Run `/compact` command to generate session summary
3. Document lessons learned (context optimizations, patterns discovered)
4. Create handoff notes for next session
5. Note any pending tasks for future work

**Template**:
```markdown
## Session Complete: Contact Exchange Feature

### Completed
- [x] Explored contact exchange patterns
- [x] Planned privacy & security approach
- [x] Implemented consent mechanism
- [x] Added comprehensive tests (85% coverage)
- [x] Deployed to production

### Lessons Learned
- Privacy planning upfront saved time during implementation
- Accessibility tests caught missing ARIA labels early
- Parallel exploration agents reduced context usage by 30%

### Handoff Notes
- Feature fully deployed and tested
- No pending issues
- Future enhancement: Add email notifications for contact sharing

### Context Usage
- Exploration: 25%
- Planning: 20%
- Production: 50%
- Verification: 5%
- Total: 100k tokens / 200k available
```

---

## 🎯 Quick Reference: Agent Chains by Task Type

### Simple Bug Fix
```
Coordinator → Domain Explore (quick) → Fix → Test Verification → Git Commit → Deploy
```

### New Feature (Full Workflow)
```
Coordinator →
  Phase 1: Domain + Database + Dependencies Explore (parallel) →
  Phase 2: Architecture + Privacy + Database + Accessibility + Test Planning →
  Phase 3: Database → Schema → Component → API → Privacy → Tests →
  Phase 4: Type/Lint + Test + Build + Privacy + Accessibility + Mobile (parallel) →
  Phase 5: E2E (if critical) →
  Phase 6: Documentation →
  Phase 7: Git Commit → Vercel Deploy → Production Verify →
  Phase 9: Session Summary
```

### Refactoring
```
Coordinator →
  Explore (very thorough) →
  Architecture Planning →
  Refactor →
  Test Verification (100% coverage) →
  Git Commit → Deploy
```

### Security/Privacy Feature
```
Coordinator →
  Explore + Database Explore →
  Privacy Planning (mandatory) →
  Database → Privacy Implementation → Tests →
  Privacy Audit (mandatory) + All Verifications →
  Git Commit → Deploy → Production Verify
```

---

## 🚨 Quality Gates Summary

### ❌ BLOCKING GATES (Must pass to proceed)

1. **Type Check**: 0 TypeScript errors
2. **Lint**: 0 ESLint warnings
3. **Tests**: All pass + 80% coverage
4. **Build**: Successful build
5. **Privacy Audit**: No exposed PII, consent enforced
6. **Accessibility**: No WCAG 2.1 AA violations

### ⚠️ WARNING GATES (Review required)

1. **Mobile**: Responsive design issues
2. **Performance**: Slow queries or large bundles
3. **Coverage**: Between 70-80% (acceptable but improve)

---

## 🔧 MCP Tool Integration

### Supabase MCP
- **Exploration**: `list_tables`, `execute_sql` (schema inspection)
- **Production**: `apply_migration` (database changes)
- **Verification**: `get_advisors` (security audit)

### GitHub MCP
- **Git Commit**: `create_pull_request`, `merge_pull_request`
- **Review**: `request_copilot_review`, `add_comment_to_pending_review`

### Playwright MCP
- **E2E Testing**: `browser_navigate`, `browser_click`, `browser_fill_form`
- **Mobile Testing**: `browser_resize`, `browser_snapshot`
- **Production Verify**: Test live production URL

### A11y MCP
- **Accessibility Audit**: `scan_page` (WCAG violations)

### Lighthouse MCP (Future)
- **Performance**: `get_performance_score`, `get_core_web_vitals`

---

## 📝 User Consent Protocol (MANDATORY)

**Never execute without explicit user permission**:

1. ✋ **Before Git Commit**: "Ready to commit changes. May I proceed?"
2. ✋ **Before Deployment**: "Ready to deploy to production with `npx vercel --prod`. May I proceed?"
3. ✋ **Before PR Merge**: "PR is ready to merge. May I proceed?"

**User can decline**:
- Request changes before committing
- Delay deployment
- Request additional review

---

## 🎓 Context Optimization Tips

1. **Parallel Execution**: Launch independent agents in single message
2. **Thoroughness Tuning**: Use "quick" for simple tasks, "very thorough" for complex
3. **Early Validation**: Catch issues in Planning phase (cheaper than Production fixes)
4. **Incremental Testing**: Test during Production, not just Verification
5. **Context Budget Monitoring**: Track usage, adjust phase allocation dynamically

---

---

## 📚 Related Documentation

- **CLAUDE.md**: Main AI assistant guidelines (summary version of this workflow)
- **docs/context-engineering/master-plan.md**: Overall project phases and status
- **docs/context-engineering/prp-method/**: Planning, Research, Production methodology
- **docs/context-engineering/phase-plans/**: Individual phase planning documents
- **PROJECT_STATUS.md**: Current project status and progress tracking

---

*Last Updated: January 2025*
*Care Collective - Mutual Aid Platform*
