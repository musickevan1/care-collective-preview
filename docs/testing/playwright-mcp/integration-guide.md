# Playwright MCP Integration Guide for Care Collective

This comprehensive guide covers the complete setup and integration of Playwright MCP server for testing the Care Collective mutual aid platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [MCP Server Setup](#mcp-server-setup)
3. [Care Collective Configuration](#care-collective-configuration)
4. [Testing Environment Setup](#testing-environment-setup)
5. [Basic Usage Patterns](#basic-usage-patterns)
6. [Care Collective Specific Patterns](#care-collective-specific-patterns)
7. [Integration with Existing Tests](#integration-with-existing-tests)
8. [Best Practices](#best-practices)

## Prerequisites

Before integrating Playwright MCP with Care Collective, ensure you have:

- **Claude Code** with MCP server support
- **Care Collective development environment** running locally
- **Supabase local setup** with test database
- **Node.js 18+** and npm installed
- **Basic understanding** of the Care Collective architecture

### Verify Current Setup

```bash
# Ensure development server starts successfully
npm run dev

# Verify Supabase is running
npm run db:start

# Check existing test setup
npm run test:run

# Verify build process
npm run build
```

## MCP Server Setup

The Playwright MCP server is configured through Claude Code's MCP settings. This integration provides browser automation capabilities directly through the Claude Code interface.

### Available MCP Functions

The Playwright MCP server provides these key functions for Care Collective testing:

#### Browser Management
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Capture accessibility snapshots
- `mcp__playwright__browser_take_screenshot` - Visual documentation
- `mcp__playwright__browser_resize` - Device simulation testing

#### User Interactions
- `mcp__playwright__browser_click` - Button and link interactions
- `mcp__playwright__browser_type` - Form input testing
- `mcp__playwright__browser_fill_form` - Multi-field form completion
- `mcp__playwright__browser_hover` - Hover state testing

#### Accessibility Testing
- `mcp__playwright__browser_evaluate` - Custom accessibility checks
- Built-in axe-core integration for WCAG compliance
- Keyboard navigation testing capabilities

#### Mobile Testing
- Device simulation through browser resize
- Touch interaction testing
- Responsive design validation

## Care Collective Configuration

### Environment Setup

Create a dedicated test environment configuration:

```bash
# Create test environment file
cat > .env.test.playwright << EOF
# Care Collective Playwright Test Environment
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Test-specific configurations
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
EOF
```

### Test Database Setup

Ensure your Supabase test database includes necessary test data:

```sql
-- Insert test users for Care Collective testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'test-user-1',
  'testuser@carecollective.test',
  crypt('testpassword', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Insert test profile
INSERT INTO profiles (
  id,
  name,
  location,
  created_at
) VALUES (
  'test-user-1',
  'Test Community Member',
  'Springfield, MO',
  now()
);

-- Insert test help requests for workflow testing
INSERT INTO help_requests (
  id,
  user_id,
  title,
  description,
  category,
  urgency,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-user-1',
  'Need groceries for elderly neighbor',
  'Looking for someone to pick up groceries for my elderly neighbor who cannot get out.',
  'groceries',
  'normal',
  'open',
  now()
);
```

## Testing Environment Setup

### Development Server Configuration

Create a dedicated test server configuration:

```json
// package.json - Add test-specific scripts
{
  "scripts": {
    "test:e2e:dev": "NODE_ENV=test next dev -p 3001",
    "test:e2e:setup": "npm run db:reset && npm run test:e2e:dev",
    "test:playwright:setup": "npm run test:e2e:setup"
  }
}
```

### Test Data Management

Create test data fixtures for consistent testing:

```typescript
// tests/fixtures/playwright-fixtures.ts
export const testUser = {
  email: 'testuser@carecollective.test',
  password: 'testpassword',
  name: 'Test Community Member',
  location: 'Springfield, MO'
};

export const testHelpRequest = {
  title: 'Need groceries for elderly neighbor',
  description: 'Looking for someone to pick up groceries for my elderly neighbor who cannot get out.',
  category: 'groceries',
  urgency: 'normal'
};

export const urgentHelpRequest = {
  title: 'Medical emergency - need ride to hospital',
  description: 'Need immediate transportation to emergency room.',
  category: 'medical',
  urgency: 'critical'
};
```

## Basic Usage Patterns

### Starting a Test Session

```markdown
# Example Claude Code interaction for basic test

Navigate to the Care Collective homepage and verify it loads correctly:

1. Navigate to http://localhost:3000
2. Take a screenshot to document the homepage
3. Verify the main heading "Care Collective" is visible
4. Check that the "Browse Help Requests" button is accessible
```

### Navigation Testing

```markdown
# Test help request browsing flow

1. Navigate to http://localhost:3000
2. Click on "Browse Help Requests" button
3. Verify the requests page loads with help request cards
4. Take a screenshot of the help requests listing
5. Verify accessibility with screen reader navigation
```

### Form Testing

```markdown
# Test help request creation form

1. Navigate to http://localhost:3000/requests/new
2. Fill the form with test data:
   - Title: "Need groceries for elderly neighbor"
   - Description: "Looking for someone to pick up groceries"
   - Category: Select "groceries"
   - Urgency: Select "normal"
3. Click "Submit Request" button
4. Verify successful submission and redirect
```

## Care Collective Specific Patterns

### Privacy-First Testing

```markdown
# Test contact exchange privacy protection

1. Navigate to a help request detail page
2. Verify contact information is NOT visible initially
3. Click "Offer Help" button
4. Verify consent dialog appears
5. Test that contact info only shows after explicit consent
6. Verify audit trail is created for contact sharing
```

### Accessibility-First Testing

```markdown
# Test WCAG 2.1 AA compliance

1. Navigate to any page
2. Run accessibility scan using axe-core
3. Verify no violations for:
   - Color contrast (4.5:1 minimum)
   - Touch targets (44px minimum)
   - Keyboard navigation
   - Screen reader compatibility
4. Test keyboard-only navigation through entire page
```

### Mobile-First Testing

```markdown
# Test mobile experience

1. Resize browser to mobile dimensions (375x667)
2. Navigate through key user flows
3. Verify touch targets are appropriately sized
4. Test gesture interactions (scroll, tap, swipe)
5. Verify responsive design adapts correctly
6. Test with different mobile device profiles
```

### Community Safety Testing

```markdown
# Test moderation and safety features

1. Navigate to admin panel (if admin user)
2. Test content moderation workflows
3. Verify user restriction capabilities
4. Test reporting mechanisms
5. Verify inappropriate content handling
```

## Integration with Existing Tests

### Complement Vitest Unit Tests

The Playwright MCP integration works alongside existing Vitest tests:

```typescript
// Integration approach - NOT replacing existing tests

// Unit Tests (Vitest) - Continue as-is
describe('HelpRequestCard', () => {
  it('displays request information correctly', () => {
    // Component-level testing
  });
});

// E2E Tests (Playwright MCP) - New capabilities
// Use Claude Code to test complete user journeys
// Example: "Test the complete help request creation and response flow"
```

### Test Data Coordination

Ensure test data consistency between unit and E2E tests:

```typescript
// Shared test fixtures
export const sharedTestData = {
  helpRequests: {
    standard: testHelpRequest,
    urgent: urgentHelpRequest
  },
  users: {
    community_member: testUser,
    admin_user: testAdminUser
  }
};
```

## Best Practices

### 1. Community Safety First

- **Always test privacy flows** - Verify contact information protection
- **Test consent mechanisms** - Ensure explicit consent is required
- **Validate security features** - Test authentication and authorization
- **Verify audit trails** - Ensure sensitive actions are logged

### 2. Accessibility Non-Negotiable

- **Include accessibility checks** in every test scenario
- **Test keyboard navigation** for all interactive elements
- **Verify screen reader compatibility** with semantic HTML
- **Check color contrast** meets WCAG 2.1 AA requirements

### 3. Mobile-First Approach

- **Start with mobile dimensions** for all test scenarios
- **Test touch interactions** alongside click interactions
- **Verify responsive behavior** at multiple breakpoints
- **Test with slow network conditions** to simulate real usage

### 4. Real-World Scenarios

- **Test crisis situations** - Urgent requests and emergency flows
- **Test community interactions** - Multi-user workflows
- **Test geographic context** - Location-based features
- **Test accessibility needs** - Various user capabilities

### 5. Documentation and Maintenance

- **Document test scenarios** with clear steps and expectations
- **Maintain test data** with realistic community scenarios
- **Update tests** when features change
- **Share knowledge** with team members through clear documentation

## Example Test Scenarios

### Complete User Journey Test

```markdown
# Test: Complete Help Request Workflow

## Scenario: Community member creates and receives help for groceries

### Steps:
1. **Setup**: Start with clean test database
2. **Registration**: New user signs up for Care Collective
3. **Profile**: User completes profile with location
4. **Request Creation**: User creates grocery help request
5. **Browse**: Another user browses available requests
6. **Response**: Second user offers help
7. **Contact Exchange**: Users exchange contact information
8. **Resolution**: Request is marked as completed

### Verification Points:
- Privacy: Contact info only shared after consent
- Accessibility: All interactions keyboard accessible
- Mobile: Flow works on mobile devices
- Security: All actions properly authenticated
- Community: Appropriate content and interactions
```

### Accessibility Comprehensive Test

```markdown
# Test: WCAG 2.1 AA Compliance Verification

## Scenario: Complete accessibility audit of core pages

### Pages to Test:
1. Homepage (/)
2. Help Requests Listing (/requests)
3. Create Request (/requests/new)
4. Request Detail (/requests/[id])
5. User Dashboard (/dashboard)

### Validation Points:
- axe-core automated scanning (0 violations)
- Keyboard navigation (tab order, focus indicators)
- Screen reader compatibility (semantic structure)
- Color contrast ratios (4.5:1 minimum)
- Touch target sizes (44px minimum)
- Alternative text for images
- Form labels and error messages
```

## Troubleshooting

### Common Issues

1. **Server Not Running**: Ensure `npm run dev` is active
2. **Database Connection**: Verify Supabase local instance
3. **Authentication Issues**: Check test user credentials
4. **Timeout Errors**: Increase wait times for slow operations
5. **Accessibility Violations**: Review and fix before testing

### Debugging Tips

- **Use screenshots** to visualize current page state
- **Check console logs** for JavaScript errors
- **Verify network requests** in browser dev tools
- **Test step-by-step** to isolate issues
- **Use browser snapshot** for detailed page inspection

## Next Steps

1. **Choose your first test scenario** from the [test-scenarios](./test-scenarios/) directory
2. **Follow the examples** in the [examples](./examples/) directory
3. **Customize for your specific needs** using Care Collective patterns
4. **Integrate with your development workflow** using the best practices above

---

*This integration guide ensures comprehensive, accessible, and privacy-first testing of the Care Collective mutual aid platform using Playwright MCP capabilities.*