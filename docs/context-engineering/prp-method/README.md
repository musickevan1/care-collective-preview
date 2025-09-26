# PRP Method: Planning, Research, Production

## Overview

The PRP (Planning, Research, Production) method is an advanced context engineering strategy designed to maximize development efficiency while working with AI assistance. This methodology is specifically tailored for the Care Collective platform's mutual aid mission and technical requirements.

## Core Philosophy

### Context as a Precious Resource
- **Limited context window**: Every token counts toward meaningful progress
- **Strategic planning**: Front-load analysis to minimize context waste
- **Knowledge preservation**: Document insights to prevent repetitive research

### Quality Through Structure
- **Systematic approach**: Each phase builds upon the previous
- **Clear deliverables**: Defined outputs prevent scope creep
- **Measurable progress**: Tangible milestones track advancement

## The Three Phases

### 🎯 Planning Phase
**Goal**: Strategic analysis and comprehensive task breakdown

**Key Activities**:
- **Requirements analysis**: Understand what needs to be built/fixed
- **Architecture assessment**: Analyze existing codebase patterns
- **Task decomposition**: Break complex work into manageable chunks
- **Resource estimation**: Predict context usage and session requirements
- **Risk identification**: Spot potential blockers early

**Deliverables**:
- Detailed implementation plan
- Task priority matrix
- Resource allocation strategy
- Risk mitigation plan

### 🔍 Research Phase
**Goal**: Comprehensive understanding with minimal context consumption

**Key Activities**:
- **Codebase exploration**: Map relevant files and patterns
- **Dependency analysis**: Understand component relationships
- **Pattern identification**: Find existing solutions and approaches
- **Constraint mapping**: Document limitations and requirements
- **Best practice review**: Align with Care Collective guidelines

**Deliverables**:
- Comprehensive codebase map
- Implementation patterns documented
- Constraint and requirement matrix
- Recommended approaches

### 🚀 Production Phase
**Goal**: Focused implementation with maximum efficiency

**Key Activities**:
- **Systematic implementation**: Follow planned approach strictly
- **Quality assurance**: Test and validate as you build
- **Progress tracking**: Update status in real-time
- **Documentation updates**: Maintain current project state
- **Integration testing**: Ensure new code works with existing system

**Deliverables**:
- Working implementation
- Updated tests and documentation
- Progress status updates
- Integration verification

## PRP Method Application

### For New Features

#### Planning Phase (Context: 15-25%)
```markdown
1. Analyze feature requirements and user stories
2. Map integration points with existing system
3. Break down into implementable components
4. Estimate effort and identify dependencies
5. Create implementation roadmap
```

#### Research Phase (Context: 20-30%)
```markdown
1. Study existing similar implementations
2. Identify reusable patterns and components
3. Document technical constraints and requirements
4. Map data flow and component interactions
5. Validate approach with existing architecture
```

#### Production Phase (Context: 45-65%)
```markdown
1. Implement components following established patterns
2. Write tests for new functionality
3. Update documentation and type definitions
4. Integrate with existing codebase
5. Validate complete feature functionality
```

### For Bug Fixes

#### Planning Phase (Context: 10-15%)
```markdown
1. Reproduce and isolate the issue
2. Analyze root cause and impact scope
3. Identify affected components and dependencies
4. Plan minimal-impact resolution strategy
```

#### Research Phase (Context: 15-25%)
```markdown
1. Study relevant code sections
2. Understand data flow and component interactions
3. Research similar issues and solutions
4. Validate proposed fix approach
```

#### Production Phase (Context: 60-75%)
```markdown
1. Implement targeted fix
2. Add regression tests
3. Verify fix doesn't break related functionality
4. Update relevant documentation
```

### For Refactoring

#### Planning Phase (Context: 25-35%)
```markdown
1. Identify refactoring goals and success metrics
2. Map all affected components and dependencies
3. Plan incremental refactoring strategy
4. Identify backward compatibility requirements
5. Create rollback plan
```

#### Research Phase (Context: 20-30%)
```markdown
1. Analyze current architecture patterns
2. Research modern best practices
3. Identify reusable patterns and abstractions
4. Map migration path for existing functionality
```

#### Production Phase (Context: 35-50%)
```markdown
1. Implement refactoring incrementally
2. Maintain functionality throughout process
3. Update tests and documentation continuously
4. Validate performance and behavior
```

## Success Metrics

### Planning Phase Success
- [ ] Clear, actionable task breakdown
- [ ] Realistic time and resource estimates
- [ ] Identified risks with mitigation strategies
- [ ] Defined success criteria

### Research Phase Success
- [ ] Comprehensive understanding of relevant codebase
- [ ] Documented patterns and constraints
- [ ] Validated implementation approach
- [ ] Clear path forward identified

### Production Phase Success
- [ ] Working implementation meets requirements
- [ ] All tests pass and coverage maintained
- [ ] Documentation updated and accurate
- [ ] Integration successful and stable

## Care Collective Specific Adaptations

### Community Safety Priority
- **Privacy implications**: Always consider in planning phase
- **Accessibility requirements**: Research phase must validate WCAG compliance
- **Security considerations**: Production phase includes security validation

### Development Efficiency
- **Missouri community focus**: Plan for geographic and demographic context
- **Mobile-first approach**: Research phase validates mobile patterns
- **Incremental deployment**: Production phase supports gradual rollout

### Quality Assurance
- **80% test coverage**: Planning phase includes test strategy
- **TypeScript strict mode**: Research phase validates type safety
- **Error handling**: Production phase includes comprehensive error scenarios

## Templates and Tools

See the following files for specific implementation guidance:
- [`planning-phase.md`](./planning-phase.md) - Planning phase templates and checklists
- [`research-phase.md`](./research-phase.md) - Research patterns and techniques
- [`production-phase.md`](./production-phase.md) - Production implementation strategies

## Integration with Master Plan

The PRP method integrates with the master planning system to:
- **Track phase progress** across development cycles
- **Allocate context resources** efficiently
- **Maintain project coherence** across sessions
- **Document lessons learned** for future application

---

*The PRP method is designed to maximize development efficiency while maintaining the high quality standards required for the Care Collective mutual aid platform.*