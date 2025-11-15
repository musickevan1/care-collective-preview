# Care Collective Documentation

Welcome to the Care Collective documentation hub. This is your guide to understanding the project structure, architecture, and how to contribute.

---

## 🚀 Quick Start

**New to the project?**
- Start here: [`docs/guides/getting-started.md`](./guides/getting-started.md)
- Then read: [`docs/reference/CLAUDE.md`](./reference/CLAUDE.md) - Full project guidelines

**Want to continue development?**
- Check: [`docs/project/STATUS.md`](./project/STATUS.md) - Current project status
- Then read: [`docs/project/NEXT_STEPS.md`](./project/NEXT_STEPS.md) - What to work on next

**Looking for technical details?**
- See: [`docs/reference/`](./reference/) - Architecture, patterns, API reference

---

## 📚 Documentation Structure

### [`docs/project/`](./project/) - Active Project Management
- **`STATUS.md`** - Current project status, completed work, blockers
- **`NEXT_STEPS.md`** - Continuation guide for next session
- **`PHASE_PLANS.md`** - Overview of all phases and their status

### [`docs/guides/`](./guides/) - How-To Guides
- **`getting-started.md`** - Developer onboarding
- **`testing.md`** - Testing strategies and best practices
- **`debugging.md`** - Debugging common issues
- **`adding-features.md`** - How to add new features
- **`deployment.md`** - Deployment procedures

### [`docs/reference/`](./reference/) - Technical Reference
- **`CLAUDE.md`** - Core project guidelines, architecture, patterns
- **`api-endpoints.md`** - API route documentation
- **`database-schema.md`** - Database structure and relationships
- **`security-patterns.md`** - Security best practices
- **`component-patterns.md`** - React component patterns
- **`FILE_SIZE_VIOLATIONS.md`** - Files exceeding size limits (for future refactoring)

### [`docs/archive/`](./archive/) - Historical Documentation

**Important**: Archive contains historical context for reference, not active work

- **`debugging-sessions/`** - Historical debugging notes and session summaries
- **`session-handoffs/`** - Old handoff notes between sessions
- **`database-scripts/`** - Database migration and backup scripts
- **`prp-methodology/`** - PRP (Planning, Research, Production) methodology docs
- **`2025-*/`** - Historical archives by month

### [`docs/beta-testing/`](./beta-testing/) - Beta Testing
- Beta test reports and feedback
- Known issues and workarounds
- Beta-specific documentation

### [`docs/deployment/`](./deployment/) - Deployment Documentation
- Deployment procedures and history
- Vercel configuration
- Environment setup

---

## 🔄 How to Use This Documentation

**When starting a development session:**
1. Read [`docs/project/STATUS.md`](./project/STATUS.md) - Understand current state
2. Check [`docs/project/NEXT_STEPS.md`](./project/NEXT_STEPS.md) - See what to work on
3. Consult [`docs/reference/CLAUDE.md`](./reference/CLAUDE.md) - Review guidelines
4. Follow relevant guide from [`docs/guides/`](./guides/)

**When fixing a bug:**
1. Check [`docs/archive/debugging-sessions/`](./archive/debugging-sessions/) - See if similar issue was fixed before
2. Review [`docs/guides/debugging.md`](./guides/debugging.md) - Get debugging strategies
3. Update [`docs/project/STATUS.md`](./project/STATUS.md) - Document your fix

**When adding a feature:**
1. Read [`docs/guides/adding-features.md`](./guides/adding-features.md)
2. Review [`docs/reference/component-patterns.md`](./reference/component-patterns.md)
3. Update [`docs/project/STATUS.md`](./project/STATUS.md) - Document progress
4. Add tests per [`docs/guides/testing.md`](./guides/testing.md)

**When deploying:**
1. Follow [`docs/guides/deployment.md`](./guides/deployment.md)
2. Check [`docs/deployment/`](./deployment/) for history
3. Update [`docs/project/STATUS.md`](./project/STATUS.md) - Mark as deployed

---

## 📋 Root-Level Files

**`/CLAUDE.md`**
- Essential project guidelines, kept in root for quick access
- Also available at: `docs/reference/CLAUDE.md`

**`/PROJECT_STATUS.md`**
- Current project status, kept in root for quick access
- Also available at: `docs/project/STATUS.md`

**`/README.md`**
- Project overview and setup (in root)

---

## 🗺️ Navigation Tips

**I need to...**
| Task | Location |
|------|----------|
| Start working | [`docs/project/NEXT_STEPS.md`](./project/NEXT_STEPS.md) |
| Understand the project | [`docs/reference/CLAUDE.md`](./reference/CLAUDE.md) |
| Add a new feature | [`docs/guides/adding-features.md`](./guides/adding-features.md) |
| Write tests | [`docs/guides/testing.md`](./guides/testing.md) |
| Fix a bug | [`docs/guides/debugging.md`](./guides/debugging.md) |
| Deploy changes | [`docs/guides/deployment.md`](./guides/deployment.md) |
| Find historical context | [`docs/archive/`](./archive/) |
| Understand a pattern | [`docs/reference/component-patterns.md`](./reference/component-patterns.md) |
| Check API endpoints | [`docs/reference/api-endpoints.md`](./reference/api-endpoints.md) |

---

## 🎯 Key Files at a Glance

| File | Purpose | Access |
|------|---------|--------|
| `docs/project/STATUS.md` | What's done, current status | Check first |
| `docs/project/NEXT_STEPS.md` | What to work on next | Before starting |
| `docs/reference/CLAUDE.md` | Project guidelines & rules | Reference |
| `docs/guides/testing.md` | How to test changes | When testing |
| `docs/guides/debugging.md` | Debugging strategies | When stuck |

---

## 📞 Need Help?

- **Not sure where to start?** → Read [`docs/guides/getting-started.md`](./guides/getting-started.md)
- **Debugging an issue?** → Check [`docs/guides/debugging.md`](./guides/debugging.md) and `docs/archive/debugging-sessions/`
- **Looking for old info?** → Check [`docs/archive/`](./archive/)
- **Want to know the rules?** → Read [`docs/reference/CLAUDE.md`](./reference/CLAUDE.md)
- **Ready to code?** → Read [`docs/guides/adding-features.md`](./guides/adding-features.md)

---

## 📝 Legend

- 🚀 - Getting started
- 📚 - Reference material
- 🔧 - How-to guides
- 📋 - Project management
- 🗂️ - Archive (historical context)

---

**Last Updated**: November 15, 2025
**Documentation Reorganization**: Phase 1 Complete
**Next**: Create getting-started and other guides
