# Care Collective Testing Framework

This document describes the comprehensive testing setup for the Care Collective mutual aid platform.

## Testing Stack

- **Vitest**: Fast, modern test runner with TypeScript support
- **React Testing Library**: Component testing focused on user behavior
- **JSDOM**: Browser environment simulation
- **MSW**: Mock Service Worker for API mocking
- **@vitest/coverage-v8**: Code coverage reporting with 80% threshold

## Test Structure

### Test Files
```
tests/
├── setup.ts              # Global test configuration
├── utils.tsx              # Custom render with providers
├── mocks/
│   └── supabase.ts        # Supabase client mocking
├── fixtures/
│   └── helpRequests.ts    # Test data fixtures
└── accessibility.test.tsx # WCAG compliance tests
```

### Component Tests
```
components/
├── ui/
│   └── button.test.tsx           # Button component tests
├── StatusBadge.test.tsx          # Status display tests
├── ContactExchange.test.tsx      # Privacy-critical contact sharing
└── ErrorBoundary.test.tsx        # Error handling tests

app/
├── login/
│   └── page.test.tsx            # Authentication flow tests
└── requests/new/
    └── page.test.tsx            # Help request creation tests
```

## Coverage Requirements

The testing framework enforces 80% code coverage across:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Test Commands

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Run with coverage reporting
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

## Care Collective Testing Priorities

### 1. Privacy & Security (CRITICAL)
- Contact information sharing consent
- Authentication flows
- Data validation and sanitization
- Audit trail verification

### 2. Accessibility (WCAG 2.1 AA)
- Screen reader compatibility
- Keyboard navigation
- Touch target sizes (44px minimum)
- Color contrast ratios
- Semantic HTML structure

### 3. Core Functionality
- Help request creation/management
- User authentication
- Status updates and notifications
- Mobile-first responsive design

### 4. Error Handling
- Graceful error boundaries
- Network failure scenarios
- Invalid data handling
- User-friendly error messages

## Testing Patterns

### Component Testing
```typescript
// Test component behavior, not implementation
it('displays help request with proper accessibility', () => {
  render(<HelpRequestCard request={mockRequest} />);
  
  expect(screen.getByRole('article')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  expect(screen.getByText('Need groceries picked up')).toBeInTheDocument();
});
```

### Privacy Testing
```typescript
// Ensure contact info is only shown to authorized users
it('only displays contact info to authorized participants', () => {
  render(
    <ContactExchange 
      isHelper={false}
      isRequester={false}
    />
  );
  
  expect(screen.queryByText('Contact Shared')).not.toBeInTheDocument();
});
```

### Accessibility Testing
```typescript
// Test keyboard navigation and screen reader support
it('supports keyboard navigation', async () => {
  const user = userEvent.setup();
  
  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();
  
  await user.keyboard('{Enter}');
  expect(mockHandler).toHaveBeenCalled();
});
```

## Mock Data

### Help Request Fixtures
- `mockHelpRequest`: Standard help request
- `mockProfile`: User profile data
- `mockContactExchange`: Contact sharing data
- `createMockHelpRequest()`: Factory for custom requests

### Supabase Mocking
- Authentication state management
- Database query mocking
- Error simulation
- Real-time subscription mocking

## CI/CD Integration

The testing framework is configured for continuous integration:

```yaml
# Example GitHub Actions configuration
- name: Run tests
  run: npm run test:run

- name: Check coverage
  run: npm run test:coverage
```

## Development Guidelines

### Writing Tests
1. **Test user behavior, not implementation details**
2. **Use semantic queries** (`getByRole`, `getByLabelText`)
3. **Test accessibility** in every component test
4. **Mock external dependencies** (Supabase, APIs)
5. **Use descriptive test names** that explain the behavior

### Test Organization
1. **Group by functionality** (Privacy, Accessibility, etc.)
2. **Start with happy path**, then edge cases
3. **Test error states** and loading states
4. **Include mobile interaction** testing

### Care Collective Specific
1. **Privacy is paramount** - test all contact sharing flows
2. **Accessibility is non-negotiable** - WCAG 2.1 AA compliance
3. **Community safety** - test inappropriate content handling
4. **Mobile-first** - test responsive behavior
5. **Graceful degradation** - test with JS disabled

## Troubleshooting

### Common Issues

1. **Act warnings**: Wrap async state updates in `act()`
2. **Mock resolution**: Ensure mocks are setup before components render
3. **Async testing**: Use `waitFor()` for async operations
4. **Focus management**: Some focus tests may be flaky in JSDOM

### Performance
- Tests run in parallel by default
- Use `--no-coverage` for faster development runs
- Mock heavy dependencies to improve speed

## Future Enhancements

1. **Visual regression testing** with Chromatic
2. **E2E testing** with Playwright
3. **Performance testing** with Lighthouse CI
4. **Accessibility testing** with axe-core integration

---

This testing framework ensures the Care Collective platform is reliable, accessible, and safe for community members to use in times of need.