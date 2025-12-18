# Care Collective Documentation

Welcome to the Care Collective documentation hub. This guide helps you navigate the project structure and find what you need.

---

## Quick Start

**New to the project?**
- Start with: [Getting Started Guide](./guides/getting-started.md)
- Then read: [CLAUDE.md](/CLAUDE.md) - Full project guidelines

**Continuing development?**
- Check: [PROJECT_STATUS.md](/PROJECT_STATUS.md) - Current project status
- Reference: [Context Engineering](./context-engineering/) - Master plans and methodology

**Looking for technical details?**
- See: [Development Docs](./development/) - Setup guides and patterns
- Check: [Database Docs](./database/) - Schema and migrations

---

## Documentation Structure

### [guides/](./guides/) - How-To Guides
Essential developer guides with step-by-step instructions.

| Guide | Purpose |
|-------|---------|
| [getting-started.md](./guides/getting-started.md) | Project setup and first contribution |
| [testing.md](./guides/testing.md) | Testing patterns and commands |
| [debugging.md](./guides/debugging.md) | Common issues and solutions |
| [adding-features.md](./guides/adding-features.md) | Feature development workflow |
| [deployment.md](./guides/deployment.md) | Deployment procedures |

### [development/](./development/) - Active Development Docs
Technical guides and current development documentation.

| Key Files | Purpose |
|-----------|---------|
| ENVIRONMENT_SETUP_GUIDE.md | Development environment setup |
| ERROR_HANDLING_GUIDE.md | Error handling patterns |
| FEATURE_FLAGS.md | Feature flag configuration |
| MOBILE_OPTIMIZATION.md | Mobile-first development |
| DATABASE_PERFORMANCE_OPTIMIZATIONS.md | Query optimization |

### [context-engineering/](./context-engineering/) - AI Context
Master plans and methodology for AI-assisted development.

- **master-plan.md** - Overall project roadmap
- **phase-plans/** - Individual phase planning
- **prp-method/** - Planning, Research, Production methodology

### [client/](./client/) - Client Documentation
Client meeting notes, feedback, and alignment documents.

### [database/](./database/) - Database Documentation
Schema documentation, migration guides, and database patterns.

### [security/](./security/) - Security Documentation
Security patterns, privacy implementation, and compliance.

### [testing/](./testing/) - Testing Documentation
Testing playbooks, scenarios, and test infrastructure.

### [deployment/](./deployment/) - Deployment Documentation
Deployment procedures, environment configuration, and history.

### [launch-2026/](./launch-2026/) - Future Planning
Planning and preparation for 2026 launch milestones.

### [archive/](./archive/) - Historical Documentation
Date-based archive of completed work and historical context.

```
archive/
├── 2025-07/    # July 2025 (project start)
├── 2025-08/    # August 2025
├── 2025-09/    # September 2025
├── 2025-10/    # October 2025
├── 2025-11/    # November 2025
├── 2025-12/    # December 2025
└── legacy/     # Undated/mislabeled content
```

---

## Root-Level Files

These files are kept in the project root for quick access:

| File | Purpose |
|------|---------|
| `/CLAUDE.md` | Core project guidelines and AI assistant context |
| `/PROJECT_STATUS.md` | Current project status dashboard |
| `/README.md` | Project overview and setup instructions |

---

## Navigation Quick Reference

| I need to... | Go to... |
|--------------|----------|
| Start working on the project | [Getting Started](./guides/getting-started.md) |
| Understand project guidelines | [CLAUDE.md](/CLAUDE.md) |
| Add a new feature | [Adding Features Guide](./guides/adding-features.md) |
| Write or run tests | [Testing Guide](./guides/testing.md) |
| Debug an issue | [Debugging Guide](./guides/debugging.md) |
| Deploy changes | [Deployment Guide](./guides/deployment.md) |
| Find historical context | [Archive](./archive/) |
| Check current status | [PROJECT_STATUS.md](/PROJECT_STATUS.md) |
| Review phase plans | [Context Engineering](./context-engineering/) |

---

## Documentation Guidelines

**Where to create new docs:**
- **Guides** (how-to) → `docs/guides/`
- **Technical reference** → `docs/development/`
- **Client work** → `docs/client/`
- **Session/phase work** → Archive after 30 days

**Naming conventions:**
- Guides: `topic-name.md` (lowercase, kebab-case)
- Session work: `YYYY-MM-DD-topic.md`
- Phase docs: `phase-X-Y-description.md`

**When to archive:**
- Completed phase summaries
- Session prompts older than 30 days
- Debugging sessions once resolved
- Implementation plans once implemented

---

**Last Updated**: December 2025
