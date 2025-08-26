# Development Workflow - Care Collective
*Team Development Standards and Best Practices*

## 🏗️ Development Philosophy

The Care Collective development workflow emphasizes quality, security, and community impact through structured development practices, frequent deployments, and comprehensive testing.

### Core Principles

1. **Security First** - Every feature considers security implications
2. **Accessibility Always** - WCAG 2.1 AA compliance built-in
3. **Community Centered** - Decisions prioritize community needs
4. **Quality Built-In** - Testing and validation at every step
5. **Frequent Delivery** - Small, incremental improvements
6. **Documentation Driven** - Every change is documented

## 🔄 Git Workflow

### Branch Strategy

```
main (production)
├── develop (integration)
│   ├── feature/contact-exchange-system
│   ├── feature/security-rate-limiting
│   ├── feature/messaging-threads
│   └── hotfix/urgent-security-patch
└── release/v1.2.0
```

### Branch Naming Conventions

```bash
# Features
feature/contact-exchange-system
feature/security-rate-limiting
feature/messaging-implementation

# Bug fixes
fix/authentication-redirect-issue
fix/mobile-navigation-bug

# Hotfixes
hotfix/security-vulnerability-patch
hotfix/critical-database-fix

# Releases
release/v1.2.0
release/v2.0.0-beta

# Documentation
docs/update-api-documentation
docs/deployment-guide-revision

# Refactoring
refactor/component-optimization
refactor/database-query-performance
```

### Commit Message Format

Following [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security-related changes
- `perf`: Performance improvements
- `a11y`: Accessibility improvements

#### Examples

```bash
# Feature commits
feat(contact-exchange): implement contact sharing with privacy controls
feat(security): add rate limiting to authentication endpoints
feat(messaging): create real-time message thread system

# Bug fix commits
fix(auth): resolve redirect loop on logout
fix(mobile): correct touch target sizes on iOS Safari

# Security commits  
security(validation): prevent XSS in user input fields
security(auth): implement session timeout protection

# Documentation commits
docs(api): update contact exchange endpoint documentation
docs(deployment): add production monitoring guidelines

# Accessibility commits
a11y(forms): improve screen reader support for help request form
a11y(navigation): add skip links and keyboard navigation

# Test commits
test(contact-exchange): add unit tests for privacy controls
test(security): add integration tests for rate limiting
```

### Pull Request Process

#### 1. Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/contact-exchange-system

# Set upstream branch
git push -u origin feature/contact-exchange-system
```

#### 2. Development Cycle

```bash
# Make changes in small, focused commits
git add components/ContactExchange.tsx
git commit -m "feat(contact-exchange): create ContactExchange component

- Implement privacy-protected contact display
- Add consent management for contact sharing  
- Include audit logging for exchanges
- Support for future messaging integration"

# Push frequently
git push origin feature/contact-exchange-system
```

#### 3. Pull Request Template

```markdown
# Pull Request: Contact Exchange System Implementation

## 📋 Summary
Implements secure contact exchange system allowing helpers and requesters to share contact information with explicit consent and privacy controls.

## 🎯 Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## 🧪 Testing
- [x] Unit tests added/updated
- [x] Integration tests passing
- [x] Accessibility tests passing
- [x] Security tests included
- [x] Manual testing completed

## 📊 Performance Impact
- Bundle size impact: +12KB (acceptable)
- Database queries: Optimized with indexes
- No breaking changes

## 🔒 Security Considerations
- [x] Input validation implemented
- [x] XSS prevention verified
- [x] Privacy controls tested
- [x] Audit logging included

## ♿ Accessibility
- [x] WCAG 2.1 AA compliant
- [x] Screen reader tested
- [x] Keyboard navigation working
- [x] Color contrast verified

## 📱 Mobile Testing
- [x] iOS Safari tested
- [x] Android Chrome tested
- [x] Touch targets adequate (44px+)
- [x] Responsive design verified

## 📚 Documentation
- [x] API documentation updated
- [x] Component documentation added
- [x] User guide updated

## 🔗 Related Issues
Closes #42 - Contact exchange system
Addresses #38 - Privacy controls for contact sharing

## 📸 Screenshots
[Include screenshots of new features]

## 🚀 Deployment Notes
- Requires database migration (included)
- No environment variable changes
- Feature flag ready for gradual rollout

## ✅ Checklist
- [x] Code follows project standards
- [x] Self-review completed
- [x] Tests added for new functionality
- [x] Documentation updated
- [x] No merge conflicts
- [x] CI/CD pipeline passing
```

#### 4. Code Review Process

##### For Authors
```bash
# Before creating PR
npm run lint              # Code quality check
npm run type-check        # TypeScript validation
npm run test             # Run test suite
npm run test:a11y        # Accessibility tests
npm run build            # Ensure build succeeds

# Create draft PR for early feedback
gh pr create --draft --title "WIP: Contact exchange system" --body "Early implementation for feedback"

# Mark ready for review
gh pr ready
```

##### For Reviewers

**Review Checklist:**
- [ ] Code quality and readability
- [ ] Security considerations addressed
- [ ] Accessibility requirements met
- [ ] Performance impact acceptable
- [ ] Tests comprehensive
- [ ] Documentation updated
- [ ] Mobile compatibility verified
- [ ] No breaking changes introduced

**Review Commands:**
```bash
# Check out PR locally
gh pr checkout 123

# Run full test suite
npm run test:ci

# Test manually
npm run dev

# Check bundle impact
npm run build && npm run analyze
```

#### 5. Merge Strategy

```bash
# Squash merge for feature branches (preferred)
git checkout develop
git merge --squash feature/contact-exchange-system
git commit -m "feat(contact-exchange): implement secure contact sharing system

- Add ContactExchange component with privacy controls
- Implement consent management and audit logging
- Include comprehensive test coverage
- Update API documentation"

# Clean up feature branch
git branch -d feature/contact-exchange-system
git push origin --delete feature/contact-exchange-system
```

## 🛠️ Development Environment Setup

### Prerequisites

```bash
# Node.js (18.0+)
node --version  # v18.0.0+
npm --version   # v9.0.0+

# Required global packages
npm install -g @supabase/cli@latest
npm install -g vercel@latest
npm install -g @playwright/test
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/care-collective-stable.git
cd care-collective-stable

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up Supabase locally
supabase start

# Generate database types
npm run db:types

# Start development server
npm run dev
```

### Environment Configuration

#### .env.local
```bash
# Supabase (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Feature Flags (Development)
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=false
NEXT_PUBLIC_FEATURE_GROUPS=false

# Development Tools
NODE_ENV=development
NEXT_PUBLIC_ENV=development
DEBUG=care-collective:*

# Testing
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use React.ReactElement instead of JSX.Element
import { ReactElement } from 'react';

interface ComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Component({ title, description, onAction }: ComponentProps): ReactElement {
  return <div>{title}</div>;
}

// Always use strict typing
interface HelpRequest {
  id: string;
  title: string;
  description: string | null;
  category: HelpCategory;
  urgency: UrgencyLevel;
  status: RequestStatus;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}

// Use enums or const assertions for constants
export const HELP_CATEGORIES = [
  'transportation',
  'household', 
  'meals',
  'childcare',
  'petcare',
  'technology',
  'companionship',
  'respite',
  'emotional',
  'groceries',
  'medical',
  'other'
] as const;

export type HelpCategory = typeof HELP_CATEGORIES[number];
```

#### Component Structure
```typescript
// components/ContactExchange/ContactExchange.tsx
'use client';

import { useState, useEffect, ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

// 1. Interface definitions
interface ContactExchangeProps {
  request: HelpRequest;
  currentUserId: string;
  onExchangeComplete?: () => void;
}

interface ContactExchangeState {
  loading: boolean;
  error: string | null;
  exchangeData: ContactExchangeData | null;
}

// 2. Component implementation
export function ContactExchange({
  request,
  currentUserId,
  onExchangeComplete
}: ContactExchangeProps): ReactElement {
  // State management
  const [state, setState] = useState<ContactExchangeState>({
    loading: false,
    error: null,
    exchangeData: null
  });

  // Effects
  useEffect(() => {
    logger.info('ContactExchange mounted', { requestId: request.id });
  }, [request.id]);

  // Event handlers
  const handleOfferHelp = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/contact-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: request.id,
          consent: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        exchangeData: data.data 
      }));
      
      onExchangeComplete?.();
    } catch (error) {
      logger.error('Contact exchange failed', { error, requestId: request.id });
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to share contact information' 
      }));
    }
  };

  // Conditional rendering
  if (state.error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-red-700">{state.error}</p>
        <Button 
          variant="outline" 
          onClick={() => setState(prev => ({ ...prev, error: null }))}
          className="mt-2"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  // Main render
  return (
    <Card className="p-6 border-sage-200 bg-sage-50">
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sage-900">Contact Exchange</h3>
          <p className="mt-1 text-sm text-sage-700">
            Share contact information to coordinate help
          </p>
          <Button
            onClick={handleOfferHelp}
            disabled={state.loading}
            className="mt-4 bg-sage-600 hover:bg-sage-700"
          >
            {state.loading ? 'Processing...' : 'Offer Help & Share Contact'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### CSS/Styling Guidelines

#### Tailwind CSS Standards
```tsx
// Use semantic class names and design system tokens
<div className="p-6 bg-sage-50 border border-sage-200 rounded-lg">
  <h2 className="text-lg font-semibold text-sage-900 mb-4">
    Contact Information
  </h2>
  <p className="text-sm text-sage-700 leading-relaxed">
    Your contact details will be shared securely.
  </p>
  
  {/* Use component variants */}
  <Button variant="sage" size="lg" className="mt-4">
    Share Contact
  </Button>
</div>

// Responsive design
<div className="
  grid grid-cols-1 gap-4 
  md:grid-cols-2 md:gap-6 
  lg:grid-cols-3 lg:gap-8
  p-4 md:p-6 lg:p-8
">
  {/* Content */}
</div>

// Accessibility considerations  
<button 
  className="
    min-h-[44px] min-w-[44px]  /* Touch targets */
    focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2
    hover:bg-sage-100 active:bg-sage-200
    transition-colors duration-200
  "
  aria-label="Share contact information"
>
  Share Contact
</button>
```

#### Custom CSS Organization
```css
/* app/globals.css */

/* Design tokens */
:root {
  --font-size-xs: 13px;
  --font-size-sm: 15px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  
  --color-sage: #7A9E99;
  --color-sage-light: #8fb0ab;
  --color-sage-dark: #6b8a86;
  
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}

/* Component-specific styles */
.contact-exchange-card {
  @apply p-6 border border-sage-200 bg-sage-50 rounded-lg;
}

.contact-exchange-card h3 {
  @apply font-semibold text-sage-900 mb-2;
}

.contact-exchange-card p {
  @apply text-sm text-sage-700 leading-relaxed;
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-sage: #4a6963;
    --color-sage-light: #5a7d78;
  }
}
```

## 🧪 Testing Workflow

### Test-Driven Development

#### 1. Write Failing Test First
```typescript
// components/ContactExchange.test.tsx
import { render, screen, fireEvent, waitFor } from '@/tests/utils';
import { ContactExchange } from './ContactExchange';

describe('ContactExchange', () => {
  it('shows contact sharing prompt for unauthorized users', () => {
    const mockRequest = {
      id: 'request-1',
      user_id: 'user-1',
      helper_id: null,
    };

    render(
      <ContactExchange 
        request={mockRequest}
        currentUserId="unauthorized-user"
      />
    );
    
    expect(screen.getByText(/Contact Information Protected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Offer Help/i })).toBeInTheDocument();
  });
});
```

#### 2. Implement Feature
```typescript
// Implement minimal code to make test pass
export function ContactExchange({ request, currentUserId }: ContactExchangeProps): ReactElement {
  const canViewContacts = currentUserId === request.user_id || currentUserId === request.helper_id;

  if (!canViewContacts) {
    return (
      <Card className="p-6 border-sage-200 bg-sage-50">
        <h3>Contact Information Protected</h3>
        <Button>Offer Help & Share Contact</Button>
      </Card>
    );
  }

  return <div>Contact info shown</div>;
}
```

#### 3. Refactor and Enhance
```typescript
// Add full implementation with error handling, loading states, etc.
```

### Testing Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test components/ContactExchange.test.tsx

# Run E2E tests
npm run test:e2e

# Run accessibility tests only
npm run test:a11y

# Run security-related tests
npm run test -- --grep "security"

# Update snapshots
npm run test -- --updateSnapshot
```

## 🚀 Daily Development Routine

### Morning Routine (30 minutes)

```bash
# 1. Pull latest changes
git checkout develop
git pull origin develop

# 2. Update dependencies if needed
npm update

# 3. Check for security vulnerabilities
npm audit

# 4. Ensure local environment is working
supabase status
npm run dev

# 5. Review any failed CI/CD builds
gh run list --limit 5
```

### Before Starting Feature Work

```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Run full test suite
npm run test:ci

# 3. Check current build
npm run build

# 4. Start development server
npm run dev

# 5. Open relevant documentation
code FEATURE_IMPLEMENTATION_PLAN.md
```

### During Development

```bash
# Commit frequently with descriptive messages
git add .
git commit -m "feat(feature): implement core functionality

- Add main component structure
- Include basic error handling
- Add initial tests"

# Push to remote regularly
git push origin feature/new-feature-name

# Run tests before each push
npm run test && git push
```

### End of Day Routine

```bash
# 1. Ensure all changes are committed
git status

# 2. Push final changes
git push origin feature/new-feature-name

# 3. Update or create PR if ready
gh pr create --draft --title "WIP: New feature implementation"

# 4. Clean up local environment
npm run clean
docker system prune -f  # If using Docker
```

## 🔄 Code Review Guidelines

### For Authors

**Before Requesting Review:**
- [ ] All tests passing locally
- [ ] Code self-reviewed for quality
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No TODO comments without GitHub issues
- [ ] Accessibility tested
- [ ] Mobile responsiveness verified

**PR Description Should Include:**
- Summary of changes
- Testing performed
- Performance impact
- Security considerations
- Breaking changes (if any)
- Screenshots for UI changes

### For Reviewers

**Review Focus Areas:**
1. **Functionality** - Does the code work as intended?
2. **Security** - Are there any security vulnerabilities?
3. **Performance** - Will this impact application performance?
4. **Accessibility** - Does this meet WCAG 2.1 AA standards?
5. **Maintainability** - Is the code readable and well-structured?
6. **Testing** - Are tests comprehensive and meaningful?

**Review Process:**
```bash
# Check out the PR
gh pr checkout 123

# Install dependencies (if package.json changed)
npm install

# Run the full test suite
npm run test:ci

# Test the feature manually
npm run dev

# Check bundle size impact
npm run build
npm run analyze

# Review security implications
npm audit
```

**Providing Feedback:**
- Be constructive and specific
- Explain the "why" behind suggestions
- Offer alternatives when possible
- Recognize good practices
- Focus on the code, not the person

## 📚 Documentation Standards

### Code Documentation

```typescript
/**
 * ContactExchange Component
 * 
 * Handles secure contact information sharing between helpers and requesters
 * in the Care Collective platform. Implements privacy controls and consent
 * management for community safety.
 * 
 * @example
 * ```tsx
 * <ContactExchange 
 *   request={helpRequest}
 *   currentUserId="user-123"
 *   onExchangeComplete={() => console.log('Exchange completed')}
 * />
 * ```
 */
export function ContactExchange({
  /** The help request for which contact is being shared */
  request,
  /** ID of the currently authenticated user */
  currentUserId,
  /** Callback function called when contact exchange completes successfully */
  onExchangeComplete
}: ContactExchangeProps): ReactElement {
  // Implementation...
}

/**
 * Validates and sanitizes contact exchange data
 * 
 * @param data - Raw contact exchange data from form
 * @returns Validated and sanitized contact exchange object
 * @throws {ValidationError} When data fails validation
 */
export function validateContactExchange(data: unknown): ContactExchangeData {
  // Validation logic...
}
```

### README Updates

When adding new features, update relevant README sections:

```markdown
## Features

### Contact Exchange System
Secure contact information sharing with privacy controls:
- Explicit consent required for information sharing
- Audit logging for all exchanges
- Privacy levels (public, helpers only, after match)
- Support for future messaging integration

### Usage

```typescript
// Basic contact exchange
const exchange = await createContactExchange({
  request_id: 'req_123',
  consent: true
});

// With custom message
const exchange = await createContactExchange({
  request_id: 'req_123', 
  consent: true,
  message: 'Happy to help with your groceries!'
});
```
```

### API Documentation

Keep API_DOCUMENTATION.md current with any endpoint changes:

```markdown
### POST /api/contact-exchange
Create new contact exchange between helper and requester.

**Request Body:**
- `request_id` (required): UUID of help request
- `consent` (required): Boolean, must be true
- `message` (optional): Personal message from helper

**Response:**
```json
{
  "data": {
    "id": "exchange_123",
    "request_id": "req_456", 
    "status": "active",
    "contact_info": { ... }
  }
}
```
```

## ⚡ Performance Optimization Workflow

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for duplicate dependencies
npx duplicate-package-checker

# Audit bundle composition
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### Performance Testing

```bash
# Lighthouse CI (local)
npm install -g @lhci/cli
lhci autorun

# Core Web Vitals testing
npm run test:performance

# Load testing (if applicable)
npm run test:load
```

### Optimization Checklist

- [ ] Images optimized (WebP, AVIF)
- [ ] Fonts loaded efficiently  
- [ ] Code split by routes
- [ ] Lazy loading implemented
- [ ] Bundle size under limits
- [ ] No render-blocking resources
- [ ] Database queries optimized
- [ ] Caching strategies implemented

---

**Document Status**: Active  
**Last Updated**: January 2025  
**Next Review**: Quarterly  
**Maintained by**: Development Team  

This development workflow ensures consistent, high-quality development practices across the Care Collective platform while maintaining focus on community needs, security, and accessibility.