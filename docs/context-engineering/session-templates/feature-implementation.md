# Feature Implementation Session Template

## Pre-Session Setup

### Context Engineering Checklist
- [ ] **Review Master Plan**: Check current phase status and priorities
- [ ] **PRP Method Ready**: Planning, Research, Production phases outlined
- [ ] **Session Goal**: Clear, specific feature implementation objective
- [ ] **Success Criteria**: Defined, measurable completion requirements
- [ ] **Context Allocation**: Planned distribution across PRP phases

### Feature Implementation Preparation
```markdown
## Feature: [Feature Name]

### Session Objective
**What**: [Specific feature being implemented]
**Why**: [Business/community value]
**Success**: [How we'll know it's complete]
**Context Budget**: [Estimated token usage distribution]

### Prerequisites
- [ ] Requirements clearly understood
- [ ] Existing codebase patterns researched
- [ ] Integration points identified
- [ ] Testing strategy planned
```

## Planning Phase Template (15-25% Context)

### Requirements Analysis
```markdown
### User Story
As a [user type], I want [functionality] so that [benefit]

### Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

### Care Collective Specific Requirements
- [ ] **Community Safety**: [Safety implications and measures]
- [ ] **Accessibility**: [WCAG 2.1 AA compliance requirements]
- [ ] **Privacy**: [Privacy protection measures needed]
- [ ] **Mobile-First**: [Mobile experience requirements]
```

### Technical Planning
```markdown
### Architecture Integration
**Integration Points**: [Where does this connect to existing system?]
**Data Requirements**: [What data structures/API changes needed?]
**Component Impact**: [Which components will be created/modified?]
**Database Changes**: [Any schema modifications required?]

### Implementation Approach
**Existing Patterns**: [What existing patterns can be leveraged?]
**New Components**: [What new components need to be created?]
**Testing Strategy**: [How will this be tested?]
**Deployment Plan**: [Any special deployment considerations?]
```

### Task Breakdown
```markdown
### Implementation Tasks
1. **[Task Category 1]** (Est: X% of context)
   - [ ] Specific task 1
   - [ ] Specific task 2
   - [ ] Specific task 3

2. **[Task Category 2]** (Est: X% of context)
   - [ ] Specific task 1
   - [ ] Specific task 2

3. **[Task Category 3]** (Est: X% of context)
   - [ ] Specific task 1
   - [ ] Specific task 2

### Risk Assessment
- **High Risk**: [Major concerns that could block progress]
- **Medium Risk**: [Issues that might slow progress]
- **Mitigation**: [How to handle identified risks]
```

## Research Phase Template (20-30% Context)

### Codebase Research
```markdown
### Existing Pattern Analysis
**Similar Components**: [List components with similar functionality]
- `[ComponentPath]`: [What patterns does it use?]
- `[ComponentPath]`: [What patterns does it use?]

**Reusable Utilities**: [What utilities can be leveraged?]
- `[UtilityPath]`: [What does it do and how to use it?]

**Integration Examples**: [How do similar features integrate?]
- [Example 1]: [Integration pattern]
- [Example 2]: [Integration pattern]
```

### Pattern Documentation
```markdown
### Key Patterns Identified
1. **[Pattern Name]**
   - **Where Used**: [File paths]
   - **How It Works**: [Pattern description]
   - **When to Use**: [Application guidance]

2. **[Pattern Name]**
   - **Where Used**: [File paths]
   - **How It Works**: [Pattern description]
   - **When to Use**: [Application guidance]

### Care Collective Specific Patterns
**Safety Patterns**: [How are safety concerns handled?]
**Validation Patterns**: [How is input validation done?]
**Accessibility Patterns**: [How is accessibility implemented?]
**Error Handling**: [How are errors handled consistently?]
```

### Integration Validation
```markdown
### Integration Points Validated
- [ ] **Database Integration**: [How to connect with existing schema]
- [ ] **API Integration**: [How to integrate with existing APIs]
- [ ] **Component Integration**: [How to integrate with UI components]
- [ ] **State Management**: [How to integrate with existing state patterns]

### Constraints Identified
- **Technical Constraints**: [Limitations to work within]
- **Performance Constraints**: [Performance requirements to meet]
- **Security Constraints**: [Security measures required]
```

## Production Phase Template (45-65% Context)

### Implementation Progress Tracking
```markdown
## Implementation Status

### Current Progress
- **Phase**: [Planning/Research/Production]
- **Tasks Completed**: [X/Y tasks done]
- **Context Used**: [X% of allocated context]
- **Estimated Remaining**: [Time/context remaining]

### Completed This Session
- [✓] Task 1: [Description and outcome]
- [✓] Task 2: [Description and outcome]
- [✓] Task 3: [Description and outcome]

### Currently Working On
- [🔄] Task: [Current task and progress]

### Next Steps
- [ ] Next immediate task
- [ ] Following task
- [ ] Quality validation task
```

### Implementation Checklist
```markdown
### Core Implementation
- [ ] **File Structure Created**
  - [ ] Component/service files created with proper naming
  - [ ] Test files created alongside implementation
  - [ ] Types defined in appropriate locations

- [ ] **Business Logic Implemented**
  - [ ] Core functionality working
  - [ ] Error handling implemented
  - [ ] Input validation in place
  - [ ] Integration with existing services

- [ ] **User Interface** (if applicable)
  - [ ] Components follow established patterns
  - [ ] Accessibility requirements met (WCAG 2.1 AA)
  - [ ] Mobile-responsive design
  - [ ] Loading and error states handled

### Quality Assurance
- [ ] **Testing**
  - [ ] Unit tests written and passing
  - [ ] Integration tests added (if needed)
  - [ ] Accessibility tests included
  - [ ] Edge cases covered

- [ ] **Code Quality**
  - [ ] TypeScript types complete and correct
  - [ ] ESLint passes with no warnings
  - [ ] Code follows Care Collective patterns
  - [ ] Performance acceptable

- [ ] **Security & Privacy**
  - [ ] Input sanitization implemented
  - [ ] Privacy requirements met
  - [ ] Security measures appropriate
  - [ ] Audit logging added (if needed)
```

### Care Collective Compliance
```markdown
### Community Safety Checklist
- [ ] **Privacy Protection**: Contact/sensitive data properly protected
- [ ] **Content Moderation**: Appropriate moderation hooks integrated
- [ ] **User Safety**: Safety measures for vulnerable users
- [ ] **Community Trust**: Features support community building

### Technical Standards
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Mobile Performance**: Acceptable on mobile devices
- [ ] **Error Handling**: Graceful error handling implemented
- [ ] **Documentation**: Implementation documented appropriately
```

## Session Wrap-up Template

### Session Summary
```markdown
## Session Results

### Objectives Achieved
- [✓] [Primary objective and outcome]
- [✓] [Secondary objective and outcome]
- [Partial] [Partially completed objective and current state]

### Code Changes Made
- **Files Created**: [List of new files]
- **Files Modified**: [List of modified files]
- **Tests Added**: [List of new tests]

### Quality Metrics
- **TypeScript**: [Compilation status]
- **Tests**: [Test status and coverage impact]
- **Performance**: [Any performance impact]
- **Accessibility**: [Accessibility compliance status]
```

### Handoff Information
```markdown
### Status for Next Session
**Current State**: [Where the implementation stands]
**Next Steps**: [What needs to be done next]
**Blockers**: [Any issues that need resolution]
**Context Notes**: [Important context for next session]

### Commit Information
**Commit Message**: [Descriptive commit message]
**Changes Summary**: [Summary of what was implemented]
**Testing Notes**: [How to test the new functionality]
```

### Lessons Learned
```markdown
### What Worked Well
- [Technique/approach that was effective]
- [Pattern that saved time]
- [Decision that proved correct]

### What Could Be Improved
- [Process that could be optimized]
- [Knowledge gap that slowed progress]
- [Decision that should be reconsidered]

### For Future Sessions
- [Recommendation for similar work]
- [Pattern to remember and reuse]
- [Approach to avoid or modify]
```

## Context Management Tips

### Efficient Context Usage
1. **Stay Focused**: Resist scope creep during implementation
2. **Use Existing Patterns**: Don't reinvent solutions
3. **Test Incrementally**: Validate as you build
4. **Document Decisions**: Record important choices
5. **Commit Frequently**: Save progress regularly

### When Context Runs Low
1. **Prioritize Core**: Complete working functionality first
2. **Defer Polish**: Styling and minor improvements can wait
3. **Document State**: Record where you left off
4. **Plan Next**: Set up next session for success

---

*This template is designed for efficient feature implementation following Care Collective development standards and the PRP context engineering methodology.*