# Pull Request Workflow Guide

## Overview

This guide documents the PR-based development workflow for Care Collective. It ensures code quality, safety, and accessibility through systematic review before production deployment.

---

## Branch Strategy (Tier 1.5)

```
main (production)
 └── develop (integration)
      ├── feature/feature-name
      ├── fix/bug-description
      └── hotfix/urgent-security-fix
```

### Branch Purposes

- **`main`**: Production-ready code deployed to `https://care-collective-preview.vercel.app`
- **`develop`**: Integration branch for staging/testing before production
- **`feature/*`**: New features or enhancements
- **`fix/*`**: Bug fixes and improvements
- **`hotfix/*`**: Critical security or safety patches (bypass to main)

---

## Standard Feature Development Workflow

### 1. Create Feature Branch

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch with descriptive name
git checkout -b feature/message-read-receipts

# Naming conventions:
# feature/description-of-feature
# fix/description-of-bug
# refactor/what-youre-refactoring
```

### 2. Development Phase

```bash
# Make changes incrementally
# Commit frequently with clear messages

git add path/to/changed/files
git commit -m "feat: add read receipt indicator component

- Create ReadReceiptIcon component
- Add read_at timestamp to messages table
- Update MessageBubble to show read status

🤖 Generated with Claude Code"

# Push to remote regularly
git push -u origin feature/message-read-receipts
```

**Commit Message Format**:
```
<type>: <short description>

- Bullet point details
- What changed and why
- Related issues or context

🤖 Generated with Claude Code

<type> options:
- feat: New feature
- fix: Bug fix
- refactor: Code restructuring
- docs: Documentation only
- test: Adding tests
- style: Formatting changes
- perf: Performance improvement
- security: Security patch
- a11y: Accessibility improvement
```

### 3. Pre-PR Checklist

Before creating PR, verify:

```bash
# Type checking (must pass - 0 errors)
npm run type-check

# Linting (must pass - 0 warnings)
npm run lint

# Tests (must pass - 80%+ coverage)
npm run test

# Build (must succeed)
npm run build
```

**Manual Checks**:
- [ ] Code follows CLAUDE.md patterns
- [ ] Files under 500 lines
- [ ] No JSX.Element (use ReactElement)
- [ ] Zod schemas for data validation
- [ ] Accessibility maintained (WCAG 2.1 AA)
- [ ] Mobile-first design verified
- [ ] Privacy/security not compromised

### 4. Create Pull Request

```bash
# Using GitHub CLI (recommended)
gh pr create \
  --base develop \
  --title "feat: Add message read receipts" \
  --body "$(cat <<'EOF'
## Summary
Implements read receipts for messages to improve user communication awareness.

## Changes
- Add `read_at` timestamp column to `messages` table
- Create `ReadReceiptIcon` component with accessibility
- Update `MessageBubble` to display read status
- Add real-time subscription for read status updates

## Testing
- [x] Unit tests for ReadReceiptIcon (95% coverage)
- [x] Integration tests for read receipt flow
- [x] Accessibility: keyboard navigation works
- [x] Accessibility: screen reader announces read status
- [x] Mobile: 44px touch targets maintained
- [x] Type-check passes (0 errors)
- [x] Lint passes (0 warnings)
- [x] Build succeeds

## Database Changes
- Migration: `20250122_add_read_receipts.sql`
- RLS policies updated for `messages.read_at`
- Tested rollback plan

## Screenshots
[Include screenshots of UI changes]

## Privacy/Security Review
- No PII exposed
- Read status only visible to conversation participants
- RLS policies enforce proper access control

## Accessibility Review
- Read receipt icon has aria-label
- Status changes announced to screen readers
- Color not sole indicator (uses icon + text)
- Keyboard accessible

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Manual PR Creation** (via GitHub web):
1. Go to repository on GitHub
2. Click "Pull Requests" → "New Pull Request"
3. Base: `develop`, Compare: `feature/message-read-receipts`
4. Fill in title and description using template above
5. Add labels: `feature`, `needs-review`, etc.
6. Request reviewers if applicable

### 5. PR Review Process

**Automated Checks** (GitHub Actions - if configured):
- ✅ TypeScript compilation (`npm run type-check`)
- ✅ ESLint (`npm run lint`)
- ✅ Test suite (`npm run test`)
- ✅ Build process (`npm run build`)
- ✅ Preview deployment (Vercel automatic)

**AI Agent Review** (Manual - using Claude Code):
1. Read `.claude/pr-review-checklist.md`
2. Review each section systematically
3. Check critical items (Safety, Accessibility, Mobile)
4. Verify code patterns match CLAUDE.md
5. Post review comments on specific lines
6. Provide final recommendation

**Human Review**:
1. Verify business logic
2. Test preview deployment manually
3. Check community impact
4. Approve or request changes

### 6. Address Review Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address PR review feedback

- Improve aria-label specificity
- Add loading state to read receipt
- Fix edge case when message deleted

🤖 Generated with Claude Code"

# Push updates
git push origin feature/message-read-receipts

# PR automatically updates with new commits
```

### 7. Merge to Develop

After approval:

```bash
# Option 1: Via GitHub CLI
gh pr merge --squash --delete-branch

# Option 2: Via GitHub web interface
# Click "Squash and merge"
# Delete branch after merge

# Pull latest develop
git checkout develop
git pull origin develop
```

**Merge Strategy**: Use **squash merge** to keep develop history clean.

### 8. Deploy to Staging

```bash
# Deploy develop branch for integration testing
git checkout develop
git pull origin develop
npx vercel

# Test staging deployment
# URL will be auto-generated (preview URL)
# Verify:
# - All features work
# - No regressions
# - Performance acceptable
# - Mobile experience good
```

### 9. Prepare for Production

When develop is stable and ready:

```bash
# Create release PR from develop to main
gh pr create \
  --base main \
  --title "Release: v1.3.0 - Message Read Receipts" \
  --body "$(cat <<'EOF'
## Release v1.3.0

### New Features
- Message read receipts with accessibility support
- Real-time read status updates

### Bug Fixes
- None

### Security Updates
- None

### Database Migrations
- `20250122_add_read_receipts.sql` (backwards compatible)

### Environment Variables
- None required

## Pre-Production Checklist
- [x] All develop tests pass
- [x] Type-check passes (0 errors)
- [x] Lint passes (0 warnings)
- [x] Build succeeds
- [x] Staging tested thoroughly
- [x] Database migration tested
- [x] Rollback plan documented
- [x] Performance verified
- [x] Accessibility verified (WCAG 2.1 AA)
- [x] Mobile tested (iOS + Android)
- [x] Security reviewed

## Deployment Plan
1. Merge develop → main
2. Run database migration
3. Deploy: `npx vercel --prod`
4. Verify production deployment
5. Monitor for errors (first 30 minutes)
6. Tag release: `git tag v1.3.0`

## Rollback Plan
If issues occur:
1. Revert deployment in Vercel dashboard
2. Rollback database migration (if needed)
3. Investigate issue
4. Fix in develop and redeploy

🤖 Generated with Claude Code
EOF
)"
```

### 10. Production Deployment

```bash
# After release PR approved
git checkout main
git merge develop --no-ff  # Keep merge commit for history
git push origin main

# Deploy to production
npx vercel --prod

# Verify deployment
npx vercel inspect $(npx vercel ls --prod | head -n1) --logs

# Tag release
git tag -a v1.3.0 -m "Release v1.3.0: Message read receipts"
git push origin v1.3.0

# Celebrate! 🎉
```

### 11. Post-Production

```bash
# Monitor production
# - Check Vercel logs
# - Check Supabase logs
# - Monitor error tracking (if configured)
# - Watch user reports

# If stable after 24 hours, close release PR and document success

# Update PROJECT_STATUS.md if needed
```

---

## Hotfix Workflow (Critical Issues Only)

Use this workflow ONLY for:
- Security vulnerabilities
- Data loss risks
- Service outages
- Critical accessibility failures

### Hotfix Process

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/security-sql-injection

# 2. Make minimal fix
# Focus: Fix the critical issue ONLY
# Don't add features or refactor

git add .
git commit -m "hotfix: patch SQL injection vulnerability in search

- Sanitize user input in search query
- Add parameterized query
- Security: Prevents SQL injection attack

🤖 Generated with Claude Code"

# 3. Push and create PR to main
git push -u origin hotfix/security-sql-injection

gh pr create \
  --base main \
  --title "HOTFIX: SQL injection vulnerability" \
  --label "hotfix,security,critical" \
  --body "$(cat <<'EOF'
## CRITICAL SECURITY HOTFIX

### Issue
SQL injection vulnerability in search feature allows unauthorized data access.

### Fix
- Sanitize all user input in search queries
- Use parameterized queries
- Add input validation

### Testing
- [x] Exploit attempt blocked
- [x] Search functionality works
- [x] Type-check passes
- [x] Tests pass

### Security Review
- Vulnerability patched
- No other injection vectors found
- Input validation comprehensive

### Deployment
URGENT - Deploy immediately after review

🤖 Generated with Claude Code
EOF
)"

# 4. Fast-track review and merge
# Reviewer checks fix, approves quickly

gh pr merge --squash

# 5. Deploy to production immediately
git checkout main
git pull origin main
npx vercel --prod

# 6. Verify fix in production
# Test that vulnerability is patched
# Ensure no regressions

# 7. Backport to develop
git checkout develop
git merge main
git push origin develop

# 8. Post-mortem
# Document what happened, how fixed, how to prevent
# Update security documentation
```

---

## PR Review Workflow (For Reviewers)

### Review Checklist

Use `.claude/pr-review-checklist.md` as comprehensive guide.

**Quick Review Steps**:

1. **Automated Checks**:
   ```bash
   git checkout feature/branch-name
   npm run type-check  # Must pass
   npm run lint        # Must pass
   npm run test        # Must pass
   npm run build       # Must succeed
   ```

2. **Code Review**:
   - Files under 500 lines
   - Functions under 50 lines
   - No JSX.Element
   - Proper Zod schemas
   - No exposed secrets
   - RLS policies updated

3. **Safety Review**:
   - No contact info exposure
   - Privacy maintained
   - Input validation present
   - No new security risks

4. **Accessibility Review**:
   - WCAG 2.1 AA compliance
   - Semantic HTML
   - ARIA labels present
   - Keyboard navigation
   - 44px touch targets
   - Color contrast

5. **Testing Review**:
   - 80%+ coverage maintained
   - Critical paths tested
   - Edge cases covered

6. **Documentation Review**:
   - PR description complete
   - Code comments for complex logic
   - CLAUDE.md updated if needed

### Review Feedback Template

**Approve**:
```markdown
## ✅ Approved

Great work! All checks pass.

### Highlights
- Excellent test coverage (92%)
- Accessibility properly implemented
- Clean, readable code

### Minor Suggestions (non-blocking)
- Consider extracting `validateInput` to a shared utility

Approved for merge.
```

**Request Changes**:
```markdown
## ⚠️ Changes Requested

Thanks for the PR! A few critical items need addressing before merge.

### Critical (Must Fix)
- [ ] **Security**: Input not validated in `search.ts:42`
  - Use Zod schema to validate user input
  - Sanitize before database query

- [ ] **Accessibility**: Button missing aria-label (`ReadReceipt.tsx:18`)
  - Add descriptive aria-label
  - Ensure screen readers announce read status

### Required (Should Fix)
- [ ] **Testing**: Coverage dropped to 74% (below 80% requirement)
  - Add tests for new `handleReadReceipt` function
  - Test error cases

### Suggestions (Nice to Have)
- Consider memoizing `formatReadTime` for performance

Please address critical and required items. Happy to re-review when ready!
```

---

## Troubleshooting

### PR Conflicts with Develop

```bash
# Update feature branch with latest develop
git checkout feature/your-feature
git fetch origin
git merge origin/develop

# Resolve conflicts
# Edit conflicted files
git add .
git commit -m "merge: resolve conflicts with develop"
git push origin feature/your-feature
```

### Failed Automated Checks

```bash
# Type errors
npm run type-check
# Fix errors, commit, push

# Lint errors
npm run lint
# Fix warnings, commit, push

# Test failures
npm run test
# Fix failing tests, commit, push

# Build failures
npm run build
# Fix build errors, commit, push
```

### Preview Deployment Failed

```bash
# Check Vercel logs
npx vercel logs <deployment-url>

# Common issues:
# - Environment variables missing
# - Build command failed
# - Runtime errors

# Fix issues, commit, push
# Vercel auto-deploys on new push
```

---

## Best Practices

### PR Size
- **Ideal**: 200-400 lines changed
- **Max**: 800 lines changed
- **Over 800 lines**: Consider splitting into multiple PRs

### PR Scope
- **One feature per PR**: Easier to review
- **Atomic changes**: Can be merged or reverted independently
- **Clear purpose**: Single, well-defined goal

### PR Description
- **Summary**: What and why
- **Changes**: Specific modifications
- **Testing**: How verified
- **Screenshots**: For UI changes
- **Migration**: For database changes

### Communication
- **Respond to reviews**: Address feedback promptly
- **Ask questions**: If feedback unclear
- **Update PR**: When requirements change
- **Close if obsolete**: Don't leave stale PRs

---

## Templates

### Feature PR Template

```markdown
## Summary
[Brief description of feature]

## Changes
- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

## Testing
- [x] Unit tests (X% coverage)
- [x] Integration tests
- [x] Accessibility verified
- [x] Mobile tested
- [x] Type-check passes
- [x] Lint passes
- [x] Build succeeds

## Screenshots
[Add screenshots for UI changes]

## Database Changes
[List any migrations or schema changes]

## Security/Privacy Review
[Any security or privacy implications]

🤖 Generated with Claude Code
```

### Bug Fix PR Template

```markdown
## Bug Description
[What was broken]

## Root Cause
[Why it was broken]

## Fix
[How you fixed it]

## Testing
- [x] Bug no longer reproduces
- [x] Regression tests added
- [x] Related functionality tested
- [x] Type-check passes
- [x] Lint passes
- [x] Build succeeds

## Regression Prevention
[How to prevent this in future]

🤖 Generated with Claude Code
```

---

## Metrics & Goals

### Cycle Time Goals
- Feature branch creation → PR creation: < 1 day
- PR creation → first review: < 4 hours
- Review → merge: < 1 day
- Merge to develop → production: < 3 days

### Quality Goals
- All PRs pass automated checks: 100%
- Test coverage maintained: 80%+
- Accessibility compliance: WCAG 2.1 AA
- Zero critical security issues

### Process Goals
- PR description complete: 100%
- Review checklist used: 100%
- Stale PRs (>7 days): < 10%
- Hotfix frequency: < 1 per month

---

*Care Collective PR Workflow - Systematic development with safety, quality, and accessibility*
