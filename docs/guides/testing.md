# Testing Guide

This guide covers testing patterns, commands, and best practices for Care Collective.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.test.ts

# Run tests in watch mode
npm run test -- --watch
```

## Test Structure

```
tests/
├── unit/           # Unit tests for utilities and hooks
├── components/     # Component tests with React Testing Library
├── integration/    # Integration tests for API and database
└── e2e/           # End-to-end tests with Playwright
```

## TODO: Sections to Complete

- [ ] Writing unit tests for utilities
- [ ] Component testing patterns
- [ ] Mocking Supabase client
- [ ] Testing authentication flows
- [ ] Accessibility testing with axe-core
- [ ] E2E test scenarios

## Testing Priorities (from CLAUDE.md)

1. Help request functionality
2. Contact exchange privacy
3. Status updates
4. Accessibility compliance
5. Mobile responsiveness

## Related Documentation

- [Development Testing Plan](/docs/development/TESTING_PLAN.md)
- [Debugging Guide](/docs/guides/debugging.md)

---
*Last updated: December 2025*
