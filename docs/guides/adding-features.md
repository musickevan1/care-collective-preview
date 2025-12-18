# Adding Features Guide

This guide covers the process of adding new features to Care Collective.

## Feature Development Workflow

1. **Plan**: Review requirements and create implementation plan
2. **Branch**: Create feature branch from main
3. **Implement**: Build the feature following project patterns
4. **Test**: Write tests and verify functionality
5. **Review**: Submit PR and address feedback
6. **Deploy**: Merge to main (auto-deploys to Vercel)

## Project Patterns

### File Organization
- Max 500 lines per file
- Components under 200 lines
- Functions under 50 lines
- Co-locate tests with components

### Component Structure
```typescript
// components/feature/FeatureName.tsx
import { ReactElement } from 'react';

interface FeatureNameProps {
  // Props definition
}

export function FeatureName({ ...props }: FeatureNameProps): ReactElement {
  // Implementation
}
```

## TODO: Sections to Complete

- [ ] Database migration patterns
- [ ] Adding new API routes
- [ ] Creating reusable components
- [ ] State management patterns
- [ ] Real-time feature implementation
- [ ] Privacy and consent considerations

## Critical Considerations (from CLAUDE.md)

- Never expose contact info without consent
- Validate all user input with Zod schemas
- Maintain WCAG 2.1 AA accessibility
- Mobile-first design approach
- Consider offline graceful degradation

## Related Documentation

- [Development Roadmap](/docs/development/IMPLEMENTATION_ROADMAP.md)
- [Feature Flags](/docs/development/FEATURE_FLAGS.md)

---
*Last updated: December 2025*
