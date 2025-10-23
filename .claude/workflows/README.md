# Development Workflows

This directory contains guides and documentation for Care Collective's development workflows.

## Available Workflows

### 📋 [PR Review Checklist](../pr-review-checklist.md)
Comprehensive checklist for reviewing pull requests before merging. Covers:
- Safety & Security
- Code Quality
- Testing (80% coverage)
- Accessibility (WCAG 2.1 AA)
- Mobile-First Design
- Performance
- Documentation

**Use this**: Before approving any PR to develop or main.

---

### 🔀 [PR Workflow Guide](./pr-workflow.md)
Complete guide to the branch-based PR development workflow. Covers:
- Branch strategy (main → develop → feature)
- Standard feature development
- Hotfix process
- PR creation and review
- Deployment to staging and production
- Troubleshooting

**Use this**: When starting new features, creating PRs, or deploying.

---

### 🤖 [Multi-Agent Delegation Guide](./multi-agent-guide.md)
Guide to using parallel agent delegation for efficient development. Covers:
- Agent roles and responsibilities
- Parallel execution patterns
- Orchestration examples
- Best practices
- Anti-patterns to avoid

**Use this**: For complex features, major refactoring, or coordinating multiple work streams.

---

## Quick Start

### Starting a New Feature

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: your feature description 🤖 Generated with Claude Code"

# 4. Push and create PR
git push -u origin feature/your-feature-name
gh pr create --base develop
```

### Reviewing a PR

```bash
# 1. Check out PR branch
gh pr checkout <pr-number>

# 2. Run automated checks
npm run type-check  # Must pass (0 errors)
npm run lint        # Must pass (0 warnings)
npm run test        # Must pass (80%+ coverage)
npm run build       # Must succeed

# 3. Review against checklist
# See ../pr-review-checklist.md

# 4. Approve or request changes
gh pr review --approve
# or
gh pr review --request-changes --body "Changes needed: ..."
```

### Using Multi-Agent Delegation

```typescript
// For complex tasks, use parallel agents:

// ✅ Efficient (parallel in single message)
[
  Task(Feature Agent): "Implement new feature",
  Task(Testing Agent): "Write comprehensive tests",
  Task(Security Agent): "Audit security implications",
  Task(Docs Agent): "Update documentation"
]

// ❌ Inefficient (sequential)
Task(Feature Agent): "Implement"
// wait...
Task(Testing Agent): "Test"
// wait...
Task(Docs Agent): "Document"
```

---

## Workflow Tiers

### Tier 1: Basic Git Flow
- Direct commits to main
- Manual deployment
- **Status**: Previous workflow (deprecated)

### Tier 1.5: PR-Based Development (Current)
- Develop branch for integration
- PR reviews with checklist
- Staging deployments
- **Status**: Active (this system)

### Tier 2: CI/CD Automation (Future)
- Automated checks via GitHub Actions
- Playwright tests in CI
- Lighthouse scans
- **Status**: Planned

### Tier 3: Full Multi-Agent (Advanced)
- Automated orchestration
- Parallel specialist agents
- AI PR reviews
- **Status**: Experimental

---

## Key Principles

### 1. Safety First
- All PRs reviewed before merge
- Critical items must pass (security, accessibility)
- Hotfixes only for urgent issues

### 2. Quality Gates
- 0 TypeScript errors
- 0 ESLint warnings
- 80%+ test coverage
- WCAG 2.1 AA compliance
- Mobile-first verified

### 3. Parallel Efficiency
- Use multi-agent delegation for complex tasks
- Maximize independent parallel work
- Minimize sequential dependencies

### 4. Clear Communication
- Descriptive PR titles and descriptions
- Detailed review feedback
- Session documentation
- Status updates

---

## Branch Protection Rules

### `main` (Production)
- ✅ Requires PR approval
- ✅ Must pass all checks
- ✅ No direct pushes (except hotfixes)
- ✅ Deployed with `npx vercel --prod`

### `develop` (Staging)
- ✅ Requires PR approval
- ✅ Must pass all checks
- ✅ Integration testing ground
- ✅ Deployed with `npx vercel`

### `feature/*` (Development)
- ⚠️ No protection (rapid iteration)
- ✅ Auto-preview deployment
- ✅ Must pass checks before PR

---

## Resources

### Internal Documentation
- [CLAUDE.md](../../CLAUDE.md) - Complete development guide
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - Current project status
- [Master Plan](../../docs/context-engineering/master-plan.md) - Phase planning

### External Resources
- [Vercel Deployment Docs](https://vercel.com/docs)
- [GitHub PR Best Practices](https://docs.github.com/en/pull-requests)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Getting Help

### Workflow Questions
- Review this README
- Check specific workflow guides
- Ask in project discussions

### Technical Issues
- Check troubleshooting section in pr-workflow.md
- Review Vercel logs: `npx vercel logs`
- Check Supabase logs in dashboard

### Process Improvements
- Suggest changes via PR
- Document pain points
- Iterate on workflow

---

*Care Collective Development Workflows - v1.0 - January 2025*
