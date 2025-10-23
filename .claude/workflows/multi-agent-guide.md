# Multi-Agent Delegation Guide

## Overview

This guide explains how to use parallel agent delegation to maximize development efficiency for Care Collective. By running specialized agents in parallel, you can complete complex tasks faster while maintaining quality and safety standards.

---

## Agent Roles & Responsibilities

### 1. Orchestrator Agent (Planning & Coordination)

**Purpose**: Break down complex tasks into parallel work streams

**Responsibilities**:
- Read `docs/context-engineering/master-plan.md` for current phase
- Analyze user request and break into subtasks
- Identify dependencies between tasks
- Delegate independent tasks to specialist agents in parallel
- Coordinate results and ensure consistency
- Update project status documents

**When to Use**:
- Complex feature requests with multiple components
- Phase transitions in master plan
- Large refactoring efforts
- Multi-system integrations

**Example**:
```typescript
// User Request: "Implement message encryption feature"

// Orchestrator breaks down:
Tasks:
1. Implement ContactEncryptionService extension
2. Add encryption to message sending flow
3. Create comprehensive test suite
4. Update RLS policies for encrypted messages
5. Document encryption patterns in CLAUDE.md
6. Update privacy compliance docs

// Identifies parallel groups:
Group A (Independent): Tasks 1, 3, 5, 6
Group B (Depends on A): Tasks 2, 4

// Delegates Group A in parallel:
[
  Task(Feature Agent): "Implement ContactEncryptionService",
  Task(Testing Agent): "Write encryption tests",
  Task(Docs Agent): "Document encryption patterns"
]
```

---

### 2. Feature Agent (Implementation)

**Purpose**: Implement new features and functionality

**Responsibilities**:
- Write production-quality code
- Follow CLAUDE.md patterns strictly
- Validate all data with Zod schemas
- Ensure TypeScript compliance (no JSX.Element)
- Keep files under 500 lines
- Use Server Components by default
- Implement proper error handling

**When to Use**:
- New feature implementation
- API endpoint creation
- Component development
- Service layer additions

**Example Tasks**:
- "Implement message read receipts feature"
- "Create admin dashboard analytics component"
- "Add contact exchange consent flow"
- "Build notification system"

**Output Expectations**:
- Fully functional code
- Type-safe implementations
- Proper error boundaries
- Following established patterns

---

### 3. Testing Agent (Quality Assurance)

**Purpose**: Ensure 80%+ test coverage and quality

**Responsibilities**:
- Write comprehensive unit tests
- Create integration tests
- Test accessibility (WCAG 2.1 AA)
- Verify mobile responsiveness
- Test edge cases and error conditions
- Maintain or improve coverage percentage
- Document test scenarios

**When to Use**:
- Parallel with feature implementation
- After refactoring
- For critical safety features
- Regression testing after bug fixes

**Example Tasks**:
- "Write tests for message encryption service"
- "Test contact exchange privacy flow end-to-end"
- "Verify accessibility of new admin panel"
- "Test mobile responsiveness of request list"

**Output Expectations**:
- 80%+ coverage for new code
- All edge cases tested
- Accessibility tests pass
- Mobile tests pass
- Clear test descriptions

---

### 4. Security Agent (Safety & Privacy)

**Purpose**: Ensure community safety and privacy compliance

**Responsibilities**:
- Audit RLS policies for new tables
- Review privacy implications
- Check input validation
- Scan for exposed secrets or PII
- Verify consent mechanisms
- Review contact exchange flows
- Check rate limiting
- Audit authentication/authorization

**When to Use**:
- Any database schema changes
- Contact exchange features
- User data handling
- Authentication changes
- Privacy-sensitive features

**Example Tasks**:
- "Audit RLS policies for encrypted messages"
- "Review contact exchange consent implementation"
- "Verify no PII exposed in error messages"
- "Check rate limiting on message sending"

**Output Expectations**:
- Security audit report
- RLS policy verification
- Privacy compliance confirmation
- Vulnerability assessment
- Recommendations for improvements

---

### 5. Documentation Agent (Knowledge Management)

**Purpose**: Keep documentation current and comprehensive

**Responsibilities**:
- Update CLAUDE.md with new patterns
- Create session summaries in `docs/sessions/`
- Document API changes
- Update phase plans
- Create migration guides
- Document breaking changes
- Update PROJECT_STATUS.md

**When to Use**:
- After implementing new features
- When patterns change
- For complex implementations
- After completing project phases

**Example Tasks**:
- "Update CLAUDE.md with encryption patterns"
- "Create session summary for message feature"
- "Document new Zod schemas"
- "Update Phase 2.3 status in master plan"

**Output Expectations**:
- Clear, accurate documentation
- Code examples included
- Migration guides if needed
- Updated status tracking

---

### 6. PR Review Agent (Quality Gate)

**Purpose**: Systematic PR review before merge

**Responsibilities**:
- Review against `.claude/pr-review-checklist.md`
- Run automated checks (type-check, lint, test)
- Verify accessibility compliance
- Check security implications
- Assess performance impact
- Provide detailed feedback
- Recommend approve or request changes

**When to Use**:
- Before merging any PR to develop
- Before production releases
- For hotfix verification

**Example Tasks**:
- "Review PR #42 against checklist"
- "Verify accessibility of new admin features"
- "Check security implications of contact exchange"

**Output Expectations**:
- Detailed review comments
- Reference specific line numbers
- Clear recommendations
- Link to relevant CLAUDE.md sections

---

## Parallel Execution Patterns

### Pattern 1: Independent Tasks (Maximum Parallelism)

**Use When**: Tasks have no dependencies

**Example**:
```typescript
// User: "Add read receipts feature"

// ✅ EFFICIENT: All tasks run simultaneously
[
  Task(Feature Agent): "Implement ReadReceiptIcon component and add read_at to messages",
  Task(Testing Agent): "Write tests for read receipt functionality",
  Task(Security Agent): "Audit RLS policies for messages.read_at column",
  Task(Docs Agent): "Document read receipt implementation in CLAUDE.md"
]

// All agents work in parallel
// Total time: ~max(agent times) instead of sum(agent times)
```

### Pattern 2: Sequential with Parallel Substeps

**Use When**: Some tasks depend on others, but substeps are independent

**Example**:
```typescript
// User: "Implement and deploy message encryption"

// Phase 1: Independent preparation (PARALLEL)
[
  Task(Feature Agent): "Implement ContactEncryptionService extension",
  Task(Testing Agent): "Create test fixtures for encryption testing",
  Task(Security Agent): "Review encryption algorithm choice and key management",
  Task(Docs Agent): "Draft encryption documentation"
]

// Wait for Phase 1 completion

// Phase 2: Integration (depends on Phase 1)
[
  Task(Feature Agent): "Integrate encryption into message sending flow",
  Task(Testing Agent): "Write integration tests for encrypted messaging",
  Task(Security Agent): "Verify end-to-end encryption implementation"
]

// Wait for Phase 2 completion

// Phase 3: Deployment preparation (PARALLEL)
[
  Task(Docs Agent): "Finalize documentation and create migration guide",
  Task(PR Review Agent): "Review all changes against checklist",
  Task(Testing Agent): "Run full test suite and verify coverage"
]
```

### Pattern 3: Exploration then Implementation

**Use When**: Need to understand codebase before making changes

**Example**:
```typescript
// User: "Add notification system for help requests"

// Phase 1: Exploration (PARALLEL)
[
  Task(Explore Agent, thorough): "How does the current messaging system work?",
  Task(Explore Agent, thorough): "What notification patterns exist in the codebase?",
  Task(Explore Agent, medium): "How are real-time updates currently handled?"
]

// Wait for exploration results

// Phase 2: Planning
// Orchestrator: Review exploration findings
// Orchestrator: Design notification architecture

// Phase 3: Implementation (PARALLEL)
[
  Task(Feature Agent): "Implement notification service",
  Task(Testing Agent): "Write notification tests",
  Task(Security Agent): "Audit notification permissions",
  Task(Docs Agent): "Document notification system"
]
```

### Pattern 4: Hotfix with Verification

**Use When**: Critical issue needs immediate fix with thorough verification

**Example**:
```typescript
// User: "URGENT: SQL injection in search"

// Phase 1: Parallel investigation and fix
[
  Task(Security Agent): "Identify all vulnerable endpoints",
  Task(Feature Agent): "Implement parameterized queries for search",
  Task(Testing Agent): "Create exploit attempt tests"
]

// Phase 2: Verification (PARALLEL)
[
  Task(Security Agent): "Verify exploit is blocked and no other vectors exist",
  Task(Testing Agent): "Verify all search functionality still works",
  Task(PR Review Agent): "Fast-track review against security checklist"
]

// Phase 3: Deployment
// Single agent: Deploy hotfix immediately
```

---

## Orchestration Examples

### Example 1: Full Feature Development

**Request**: "Add admin analytics dashboard"

**Orchestrator Plan**:
```markdown
## Task Breakdown

### Phase 1: Data & API (Parallel)
1. Feature Agent: Create analytics queries and API endpoints
2. Testing Agent: Write API tests
3. Security Agent: Audit RLS for analytics tables
4. Docs Agent: Document analytics API

### Phase 2: UI Components (Parallel, depends on Phase 1)
1. Feature Agent: Build analytics dashboard components
2. Testing Agent: Write component tests
3. Security Agent: Verify admin authorization
4. Docs Agent: Update admin documentation

### Phase 3: Integration (Parallel)
1. Feature Agent: Connect components to API
2. Testing Agent: Write E2E tests
3. PR Review Agent: Review against checklist
4. Docs Agent: Create session summary

### Phase 4: Deployment
1. Orchestrator: Create PR
2. Orchestrator: Deploy to staging
3. Orchestrator: Production release
```

**Execution**:
```typescript
// Phase 1: Data & API
[
  Task(Feature Agent): "Create analytics queries for help requests, users, and messages. Build API endpoints at /api/admin/analytics",
  Task(Testing Agent): "Write tests for analytics queries and API endpoints",
  Task(Security Agent): "Audit RLS policies for analytics access. Verify only admins can access",
  Task(Docs Agent): "Document analytics API endpoints, query parameters, and response formats"
]

// After Phase 1 completes...

// Phase 2: UI Components
[
  Task(Feature Agent): "Build AnalyticsDashboard, StatsCard, and ChartComponents with accessibility",
  Task(Testing Agent): "Write component tests including accessibility and mobile responsiveness",
  Task(Security Agent): "Verify admin authorization on all dashboard routes",
  Task(Docs Agent): "Update admin documentation with dashboard usage guide"
]

// After Phase 2 completes...

// Phase 3: Integration
[
  Task(Feature Agent): "Connect dashboard components to analytics API with error handling",
  Task(Testing Agent): "Write E2E tests for full analytics flow",
  Task(PR Review Agent): "Review all changes against .claude/pr-review-checklist.md",
  Task(Docs Agent): "Create comprehensive session summary in docs/sessions/"
]
```

### Example 2: Bug Fix with Testing

**Request**: "Fix: Message timestamps show wrong timezone"

**Orchestrator Plan**:
```markdown
## Task Breakdown

### Phase 1: Investigation (Parallel)
1. Explore Agent: Find all timestamp formatting code
2. Security Agent: Check if timezone issue could expose user location data

### Phase 2: Fix (Parallel, depends on Phase 1)
1. Feature Agent: Fix timestamp formatting to use user's local timezone
2. Testing Agent: Write tests for different timezones
3. Docs Agent: Document timezone handling pattern

### Phase 3: Review
1. PR Review Agent: Verify fix doesn't break existing functionality
```

**Execution**:
```typescript
// Phase 1: Investigation
[
  Task(Explore Agent, quick): "Find all code that formats message timestamps",
  Task(Security Agent): "Assess if timezone display could reveal user location inadvertently"
]

// After investigation...

// Phase 2: Fix
[
  Task(Feature Agent): "Update formatTimestamp utility to use user's local timezone. Apply to all message displays",
  Task(Testing Agent): "Write tests for UTC, EST, PST, and edge case timezones",
  Task(Docs Agent): "Document proper timestamp formatting pattern in CLAUDE.md"
]

// After fix...

// Phase 3: Review
[
  Task(PR Review Agent): "Review timestamp fix. Verify no regressions in date/time displays"
]
```

### Example 3: Security Enhancement

**Request**: "Implement rate limiting for message sending"

**Orchestrator Plan**:
```markdown
## Task Breakdown

### Phase 1: Research & Planning (Parallel)
1. Explore Agent: How is rate limiting currently handled (if at all)?
2. Security Agent: Determine appropriate rate limits for community safety
3. Docs Agent: Research rate limiting best practices

### Phase 2: Implementation (Parallel)
1. Feature Agent: Implement rate limiting middleware
2. Testing Agent: Write rate limiting tests
3. Security Agent: Verify rate limits can't be bypassed
4. Docs Agent: Document rate limiting configuration

### Phase 3: Database & Monitoring (Parallel, depends on Phase 2)
1. Feature Agent: Add rate limit tracking table
2. Security Agent: Create RLS policies for rate limit data
3. Testing Agent: Test rate limit reset logic
4. Docs Agent: Document rate limit monitoring
```

**Execution**:
```typescript
// Phase 1: Research
[
  Task(Explore Agent, medium): "Search codebase for existing rate limiting implementations",
  Task(Security Agent): "Analyze message sending patterns and recommend safe rate limits",
  Task(Docs Agent): "Research rate limiting best practices for mutual aid platforms"
]

// Phase 2: Implementation
[
  Task(Feature Agent): "Create rate limiting middleware using recommended limits (50 msgs/day normal, adjust for urgent)",
  Task(Testing Agent): "Write tests for rate limit enforcement, reset, and bypass conditions",
  Task(Security Agent): "Attempt to bypass rate limits through various methods",
  Task(Docs Agent): "Document rate limiting configuration and user impact"
]

// Phase 3: Database & Monitoring
[
  Task(Feature Agent): "Add rate_limit_tracking table and implement reset logic",
  Task(Security Agent): "Create RLS policies ensuring users can't manipulate their own limits",
  Task(Testing Agent): "Test rate limit reset at midnight UTC and edge cases",
  Task(Docs Agent): "Document rate limit monitoring dashboard for admins"
]
```

---

## Anti-Patterns (Avoid These)

### ❌ Sequential When Parallel Possible

**Bad**:
```typescript
// Inefficient: Each agent waits for previous
Task(Feature Agent): "Implement encryption"
// Wait...
Task(Testing Agent): "Write tests"
// Wait...
Task(Docs Agent): "Update docs"
// Total time: Sum of all agents
```

**Good**:
```typescript
// Efficient: All agents work simultaneously
[
  Task(Feature Agent): "Implement encryption",
  Task(Testing Agent): "Write tests",
  Task(Docs Agent): "Update docs"
]
// Total time: Max of all agents (usually fastest)
```

### ❌ Too Many Agents for Simple Tasks

**Bad**:
```typescript
// Overkill for simple fix
[
  Task(Feature Agent): "Fix typo in button text",
  Task(Testing Agent): "Test button text",
  Task(Docs Agent): "Document button text change",
  Task(PR Review Agent): "Review typo fix"
]
```

**Good**:
```typescript
// Just fix it directly
// Edit button text
// Commit with clear message
// Simple change doesn't need multi-agent orchestration
```

### ❌ Unclear Task Boundaries

**Bad**:
```typescript
[
  Task(Feature Agent): "Do everything for read receipts",
  Task(Testing Agent): "Test some stuff"
]
```

**Good**:
```typescript
[
  Task(Feature Agent): "Implement ReadReceiptIcon component and add read_at column to messages table with migration",
  Task(Testing Agent): "Write unit tests for ReadReceiptIcon and integration tests for read status updates"
]
```

### ❌ Ignoring Dependencies

**Bad**:
```typescript
// Integration depends on service existing!
[
  Task(Feature Agent): "Integrate encryption into messages",
  Task(Feature Agent): "Implement ContactEncryptionService"
]
// Integration task will fail - service doesn't exist yet
```

**Good**:
```typescript
// Phase 1: Create foundation
[
  Task(Feature Agent): "Implement ContactEncryptionService"
]
// Wait for completion
// Phase 2: Integration
[
  Task(Feature Agent): "Integrate encryption into message sending"
]
```

---

## Communication Between Agents

### Orchestrator → Specialist

**Clear Instructions**:
- Specific scope and deliverables
- Context from CLAUDE.md
- Reference to related phase plans
- Expected output format
- Dependencies on other agents
- Timeline expectations

**Example**:
```markdown
Task(Feature Agent):
"Implement ContactEncryptionService extension for message encryption.

Context:
- Extends existing ContactEncryptionService in lib/security/
- Phase 2.2 of master plan
- Must support sensitivity detection

Requirements:
- Add analyzeSensitivity(content) method
- Implement encryptMessage(content, senderId, recipientId, conversationId)
- Use existing crypto utilities
- Follow CLAUDE.md encryption patterns

Output:
- Fully typed TypeScript
- Zod schemas for validation
- Error handling with proper boundaries
- < 200 lines per file

Dependencies:
- None (base service exists)
"
```

### Specialist → Orchestrator

**Status Updates**:
- Completion confirmation
- Issues encountered
- Deviations from plan
- Recommendations
- Next steps

**Example**:
```markdown
Feature Agent Report:

✅ Completed: ContactEncryptionService extension

Implementation:
- Added analyzeSensitivity() method (lib/messaging/encryption.ts:42)
- Implemented encryptMessage() with proper validation (lib/messaging/encryption.ts:68)
- Created messageEncryptionSchema with Zod (lib/messaging/encryption.ts:12)
- All files under 200 lines

Issues:
- None

Recommendations:
- Consider caching sensitivity analysis results (currently runs on every message)
- May want to add encryption key rotation in future phase

Next Steps:
- Ready for integration into message sending flow
- Testing Agent can now write tests against this implementation
```

---

## Best Practices

### 1. Start with Orchestration

**Always**:
- Analyze request complexity
- Break into logical tasks
- Identify dependencies
- Plan parallel groups
- Delegate clearly

**Don't**:
- Jump straight to implementation
- Try to do everything in one agent
- Ignore task dependencies

### 2. Maximize Parallelism

**Look for**:
- Independent tasks
- Different domains (API vs UI)
- Different concerns (implementation vs testing)

**Parallelize**:
- Feature + Testing + Docs + Security
- Multiple independent features
- Research + Planning tasks

### 3. Clear Task Definitions

**Include**:
- Specific scope
- Expected output
- File locations
- Pattern references
- Dependencies

**Avoid**:
- Vague instructions
- Open-ended tasks
- Undefined deliverables

### 4. Maintain Context

**Always Provide**:
- Reference to CLAUDE.md
- Phase plan context
- Related documentation
- Existing patterns

**Helps**:
- Consistency across agents
- Following established patterns
- Avoiding duplicate work

### 5. Verify Completion

**Check**:
- All tasks completed
- Output meets expectations
- No conflicting changes
- Documentation updated
- Tests pass

**Before**:
- Creating PR
- Merging to develop
- Production deployment

---

## Metrics & Optimization

### Efficiency Metrics

**Track**:
- Time saved vs sequential execution
- Number of agents used per feature
- Task completion success rate
- Rework percentage

**Goals**:
- 50%+ time savings on complex features
- 3-4 agents average per feature
- 90%+ completion success rate
- < 10% rework needed

### Quality Metrics

**Track**:
- Test coverage per agent output
- Accessibility compliance rate
- Security issues found by Security Agent
- Documentation completeness

**Goals**:
- 80%+ test coverage maintained
- 100% WCAG 2.1 AA compliance
- 0 critical security issues
- 100% CLAUDE.md updated

---

## Quick Reference

### Agent Selection Matrix

| Task Type | Primary Agent | Supporting Agents |
|-----------|---------------|-------------------|
| New Feature | Feature Agent | Testing, Security, Docs |
| Bug Fix | Feature Agent | Testing |
| Security Patch | Security Agent | Feature, Testing |
| Refactoring | Feature Agent | Testing, Docs |
| Documentation | Docs Agent | - |
| Code Review | PR Review Agent | - |
| Research | Explore Agent | - |
| Database Schema | Feature Agent | Security, Testing |

### Parallelism Decision Tree

```
Can tasks run independently?
├─ Yes → Parallel execution (single message, multiple Task calls)
└─ No → Are there parallel substeps?
    ├─ Yes → Sequential phases with parallel substeps
    └─ No → Sequential execution (separate messages)
```

### Orchestration Checklist

- [ ] Analyzed task complexity
- [ ] Broke down into logical subtasks
- [ ] Identified dependencies
- [ ] Grouped parallel tasks
- [ ] Wrote clear task descriptions
- [ ] Specified expected outputs
- [ ] Provided context and references
- [ ] Planned verification steps
- [ ] Determined success criteria

---

*Care Collective Multi-Agent Guide - Efficient parallel development with quality and safety*
