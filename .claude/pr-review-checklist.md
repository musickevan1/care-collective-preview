# Pull Request Review Checklist

## Overview
This checklist ensures all PRs meet Care Collective's safety, accessibility, and quality standards before merging to `main`.

---

## 🛡️ Safety & Security (CRITICAL - MUST PASS)

### Privacy Protection
- [ ] **No exposed contact info** without explicit consent
- [ ] Contact exchange requires `consent: true` validation
- [ ] Privacy-sensitive data uses encryption service
- [ ] No PII in logs, error messages, or analytics

### Input Validation
- [ ] All user inputs validated with Zod schemas
- [ ] Help request content sanitized
- [ ] Message content moderation applied
- [ ] File uploads validated (type, size, content)

### Database Security
- [ ] RLS policies updated/verified for new tables
- [ ] No direct SQL queries (use Supabase client)
- [ ] Sensitive queries use parameterization
- [ ] Foreign key constraints enforced

### Authentication & Authorization
- [ ] Auth checks on all protected routes
- [ ] User can only access their own data
- [ ] Admin-only features properly gated
- [ ] Session management secure

### Secrets Management
- [ ] No hardcoded API keys, tokens, or secrets
- [ ] Environment variables properly configured
- [ ] No sensitive data in client-side code
- [ ] `.env.local` not committed

---

## 💻 Code Quality (MUST PASS)

### TypeScript
- [ ] **0 TypeScript errors** (`npm run type-check`)
- [ ] **No `JSX.Element`** (use `ReactElement` from 'react')
- [ ] Proper type imports (not `import type`)
- [ ] No `any` types (use proper typing)
- [ ] Zod schemas for all data structures

### Linting
- [ ] **0 ESLint warnings** (`npm run lint`)
- [ ] No console.log in production code
- [ ] Unused imports removed
- [ ] Consistent code formatting

### File Organization
- [ ] **Max 500 lines per file**
- [ ] **Components under 200 lines**
- [ ] **Functions under 50 lines**
- [ ] Clear feature separation (no God files)
- [ ] Co-located tests with components

### Code Patterns
- [ ] Server Components for data fetching
- [ ] Client Components only when needed
- [ ] Proper error boundaries
- [ ] Loading states handled
- [ ] Error states handled

---

## 🧪 Testing (80% COVERAGE REQUIRED)

### Test Coverage
- [ ] **80%+ overall coverage** maintained
- [ ] Critical paths tested (help requests, contact exchange)
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] Tests pass: `npm run test`

### Test Quality
- [ ] Meaningful test descriptions
- [ ] Tests isolated (no interdependencies)
- [ ] Mocks used appropriately
- [ ] Assertions verify behavior, not implementation

### Domain-Specific Tests
- [ ] Help request CRUD operations
- [ ] Contact exchange privacy flow
- [ ] Status update notifications
- [ ] Message moderation logic
- [ ] Admin panel authorization

---

## ♿ Accessibility (WCAG 2.1 AA - MUST PASS)

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Semantic elements (`article`, `nav`, `main`, `aside`)
- [ ] Form labels associated with inputs
- [ ] Button vs link used appropriately

### ARIA & Screen Readers
- [ ] ARIA labels on interactive elements
- [ ] ARIA live regions for dynamic content
- [ ] Status messages announced
- [ ] Error messages associated with fields
- [ ] Tested with screen reader (NVDA/VoiceOver)

### Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip links provided

### Visual Accessibility
- [ ] **Color contrast meets WCAG AA** (4.5:1 text, 3:1 UI)
- [ ] Information not conveyed by color alone
- [ ] Text resizable to 200% without loss
- [ ] No flashing content (seizure risk)

### Touch & Mobile
- [ ] **44px minimum touch targets**
- [ ] Touch targets adequately spaced
- [ ] Mobile gestures intuitive
- [ ] No hover-only interactions

---

## 📱 Mobile-First Design (MUST PASS)

### Responsive Layout
- [ ] Mobile (320px+) works perfectly
- [ ] Tablet (768px+) layout appropriate
- [ ] Desktop (1024px+) optimized
- [ ] No horizontal scroll on mobile

### Mobile UX
- [ ] Simple navigation (max 2 levels)
- [ ] 16px minimum text size
- [ ] Forms easy to complete on mobile
- [ ] Modals/dialogs mobile-friendly
- [ ] Offline graceful degradation

### Performance on Mobile
- [ ] Fast load on 3G connection
- [ ] Images optimized (Next.js Image)
- [ ] Minimal JavaScript bundle
- [ ] Progressive enhancement applied

---

## ⚡ Performance

### Data Fetching
- [ ] Efficient Supabase queries (select only needed columns)
- [ ] Pagination for large lists
- [ ] Proper indexes on queried columns
- [ ] No N+1 query problems

### Rendering Optimization
- [ ] Server Components by default
- [ ] Client Components minimized
- [ ] Memoization where needed (`useMemo`, `useCallback`)
- [ ] Virtualization for long lists (1000+ items)

### Bundle Size
- [ ] Dynamic imports for large components
- [ ] No unnecessary dependencies
- [ ] Tree-shaking verified
- [ ] Code splitting applied

### Caching
- [ ] Proper cache headers configured
- [ ] Stale-while-revalidate for non-critical data
- [ ] Cache invalidation on updates

---

## 📚 Documentation

### Code Documentation
- [ ] Complex logic has comments
- [ ] Public APIs documented
- [ ] Type definitions clear
- [ ] README updated if needed

### CLAUDE.md
- [ ] Updated with new patterns
- [ ] New schemas documented
- [ ] Security considerations noted
- [ ] Examples provided

### Session Documentation
- [ ] Session summary created in `docs/sessions/`
- [ ] Key decisions documented
- [ ] Breaking changes noted
- [ ] Migration guide if needed

### User Documentation
- [ ] Help text updated
- [ ] Error messages clear
- [ ] User-facing changes documented

---

## 🏗️ Architecture & Design

### Component Design
- [ ] Single Responsibility Principle
- [ ] Props properly typed
- [ ] Reusable components extracted
- [ ] Composition over inheritance

### State Management
- [ ] State lifted appropriately
- [ ] No prop drilling (use Context if needed)
- [ ] Server state vs client state separated
- [ ] Optimistic updates where appropriate

### Error Handling
- [ ] Error boundaries in place
- [ ] User-friendly error messages
- [ ] Errors logged appropriately
- [ ] Graceful degradation

### Feature Flags
- [ ] New features behind flags if risky
- [ ] Feature flags documented
- [ ] Rollback plan exists

---

## 🌍 Community & Domain

### Help Request Domain
- [ ] Categories valid (groceries, transport, household, medical, other)
- [ ] Urgency levels correct (normal, urgent, critical)
- [ ] Status flow logical (open → in_progress → closed)
- [ ] Location data validated (Missouri focus)

### Trust & Safety
- [ ] No features enabling exploitation
- [ ] Abuse reporting accessible
- [ ] Content moderation active
- [ ] User restrictions enforced

### Inclusive Design
- [ ] Language inclusive and respectful
- [ ] No assumptions about user capabilities
- [ ] Crisis situations considered
- [ ] Rural connectivity considered

### Community Value
- [ ] Feature supports mutual aid mission
- [ ] Clear value to community members
- [ ] No barriers for urgent requests
- [ ] Builds trust in platform

---

## 🚀 Deployment Readiness

### Pre-Merge Verification
- [ ] Branch up to date with `main`
- [ ] Merge conflicts resolved
- [ ] All CI checks passing
- [ ] Vercel preview deployment tested

### Database Migrations
- [ ] Migration tested locally
- [ ] Rollback plan documented
- [ ] Data integrity verified
- [ ] Backwards compatible if possible

### Environment Variables
- [ ] New env vars documented
- [ ] Added to Vercel project settings
- [ ] Sample values in `.env.example`

### Breaking Changes
- [ ] Breaking changes documented
- [ ] Migration guide provided
- [ ] Users notified if needed
- [ ] Graceful transition plan

---

## 📊 Review Scoring

### Critical (Must Pass - 100%)
- Safety & Security
- Accessibility (WCAG 2.1 AA)
- Mobile-First Design
- TypeScript/Lint errors

### Required (Must Pass - 90%+)
- Testing (80%+ coverage)
- Code Quality
- Performance

### Recommended (Should Pass - 80%+)
- Documentation
- Architecture
- Community & Domain

---

## ✅ Final Checklist

Before approving PR:
- [ ] All critical items pass (100%)
- [ ] All required items pass (90%+)
- [ ] Recommended items mostly pass (80%+)
- [ ] Manual testing completed
- [ ] Screenshots/video for UI changes
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Accessibility manually verified

---

## 🤖 AI Agent Review Notes

When reviewing PRs as an AI agent:

1. **Run automated checks first**:
   ```bash
   npm run type-check  # Must pass
   npm run lint        # Must pass (0 warnings)
   npm run test        # Must pass (80%+ coverage)
   ```

2. **Review code against CLAUDE.md patterns**:
   - Check for forbidden patterns
   - Verify Zod schemas
   - Validate ReactElement usage
   - Check file size limits

3. **Accessibility audit**:
   - Run Lighthouse accessibility scan
   - Check semantic HTML
   - Verify ARIA labels
   - Test keyboard navigation

4. **Security review**:
   - Scan for exposed secrets
   - Verify RLS policies
   - Check input validation
   - Review privacy compliance

5. **Leave detailed comments**:
   - Reference specific line numbers
   - Explain why change is needed
   - Suggest concrete improvements
   - Link to relevant CLAUDE.md sections

6. **Final recommendation**:
   - **Approve**: All critical pass, required pass, recommended mostly pass
   - **Request Changes**: Any critical fail, multiple required fail
   - **Comment**: Minor suggestions, no blocking issues

---

*Care Collective PR Review Checklist - Ensuring community safety, accessibility, and quality standards*
