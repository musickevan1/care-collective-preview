# Testing Strategy - Care Collective
*Comprehensive Testing Guide for Production Quality*

## 🎯 Testing Philosophy

Our testing strategy ensures the Care Collective platform maintains high quality, accessibility, and security standards through comprehensive automated and manual testing at multiple levels.

### Core Principles
1. **Test Early, Test Often**: Write tests alongside code
2. **80% Coverage Minimum**: Critical paths must have 100% coverage
3. **Accessibility First**: Every component must pass WCAG 2.1 AA
4. **Security by Default**: All inputs validated, all outputs sanitized
5. **Real User Scenarios**: Tests reflect actual user workflows

## 📊 Testing Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /    \ - Critical user journeys
      /------\ - Cross-browser testing
     /        \ Integration Tests (30%)
    /          \ - API endpoints
   /            \ - Database operations
  /--------------\ Unit Tests (60%)
 /                \ - Components
/                  \ - Business logic
```

## 🧪 Testing Framework Setup

### 1. Installation

```bash
# Core testing dependencies
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D jsdom happy-dom
npm install -D @axe-core/react axe-playwright

# E2E testing
npm install -D playwright @playwright/test

# Mocking utilities
npm install -D msw @mswjs/data
```

### 2. Configuration Files

#### 2.1 Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        '*.config.js',
        '.next/',
        'coverage/',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
    },
  },
});
```

#### 2.2 Test Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

#### 2.3 Testing Utilities
```typescript
// tests/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper functions
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

export const mockHelpRequest = {
  id: 'test-request-id',
  title: 'Need help with groceries',
  description: 'Unable to get to the store this week',
  category: 'groceries',
  urgency: 'normal',
  status: 'open',
  user_id: mockUser.id,
  created_at: new Date().toISOString(),
};
```

## 🔬 Unit Testing

### Component Testing

#### Basic Component Test
```typescript
// components/StatusBadge.test.tsx
import { render, screen } from '@/tests/utils';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders with correct status text', () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('applies correct styling for urgent status', () => {
    render(<StatusBadge status="open" urgency="urgent" />);
    const badge = screen.getByText(/urgent/i);
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('uses sage color for in-progress status', () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByText('In Progress');
    expect(badge).toHaveClass('bg-sage-100');
  });

  it('uses dusty rose color for open status', () => {
    render(<StatusBadge status="open" />);
    const badge = screen.getByText('Open');
    expect(badge).toHaveClass('bg-dusty-rose-100');
  });
});
```

#### Interactive Component Test
```typescript
// components/ContactExchange.test.tsx
import { render, screen, waitFor } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { ContactExchange } from './ContactExchange';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

describe('ContactExchange', () => {
  const mockRequest = {
    id: 'request-1',
    user_id: 'user-1',
    helper_id: null,
  };

  it('shows protected state for unauthorized users', () => {
    render(
      <ContactExchange 
        request={mockRequest}
        currentUserId="unauthorized-user"
      />
    );
    
    expect(screen.getByText(/Contact Information Protected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Offer Help/i })).toBeInTheDocument();
  });

  it('shows contact info for authorized users', () => {
    render(
      <ContactExchange 
        request={{ ...mockRequest, helper_id: 'user-2' }}
        currentUserId="user-2"
      />
    );
    
    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected/i)).not.toBeInTheDocument();
  });

  it('handles offer help action', async () => {
    const user = userEvent.setup();
    const onExchangeComplete = vi.fn();

    render(
      <ContactExchange 
        request={mockRequest}
        currentUserId="helper-user"
        onExchangeComplete={onExchangeComplete}
      />
    );

    const button = screen.getByRole('button', { name: /Offer Help/i });
    await user.click(button);

    await waitFor(() => {
      expect(onExchangeComplete).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.post('/api/contact-exchange', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const user = userEvent.setup();
    render(
      <ContactExchange 
        request={mockRequest}
        currentUserId="helper-user"
      />
    );

    await user.click(screen.getByRole('button', { name: /Offer Help/i }));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
// hooks/useRealtime.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeUpdates } from './useRealtime';
import { mockSupabaseClient } from '@/tests/mocks/supabase';

describe('useRealtimeUpdates', () => {
  it('subscribes to updates on mount', () => {
    const { result } = renderHook(() => 
      useRealtimeUpdates('request-1')
    );

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('request-1');
    expect(result.current.isConnected).toBe(false);
  });

  it('updates state when receiving realtime data', async () => {
    const { result } = renderHook(() => 
      useRealtimeUpdates('request-1')
    );

    act(() => {
      mockSupabaseClient.triggerRealtimeUpdate({
        id: 'request-1',
        status: 'in_progress',
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 'request-1',
        status: 'in_progress',
      });
    });
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => 
      useRealtimeUpdates('request-1')
    );

    unmount();

    expect(mockSupabaseClient.unsubscribe).toHaveBeenCalled();
  });
});
```

## 🔗 Integration Testing

### API Route Testing

```typescript
// app/api/help-requests/route.test.ts
import { POST, GET } from './route';
import { createMockRequest } from '@/tests/mocks/request';
import { prismaMock } from '@/tests/mocks/prisma';

describe('POST /api/help-requests', () => {
  it('creates a new help request with valid data', async () => {
    const mockRequest = createMockRequest({
      method: 'POST',
      body: {
        title: 'Need help with groceries',
        description: 'Cannot get to store',
        category: 'groceries',
        urgency: 'normal',
      },
    });

    prismaMock.helpRequest.create.mockResolvedValue({
      id: 'new-request-id',
      title: 'Need help with groceries',
      // ... other fields
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(prismaMock.helpRequest.create).toHaveBeenCalled();
  });

  it('validates input data', async () => {
    const mockRequest = createMockRequest({
      method: 'POST',
      body: {
        title: 'abc', // Too short
        category: 'invalid', // Invalid category
      },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toContain('Title must be at least 5 characters');
  });

  it('applies rate limiting', async () => {
    // Simulate multiple requests
    for (let i = 0; i < 15; i++) {
      const mockRequest = createMockRequest({
        method: 'POST',
        body: { /* valid data */ },
        ip: '192.168.1.1',
      });

      const response = await POST(mockRequest);
      
      if (i >= 10) {
        expect(response.status).toBe(429);
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    }
  });
});
```

### Database Testing

```typescript
// lib/database/help-requests.test.ts
import { createHelpRequest, getHelpRequests } from './help-requests';
import { createTestDatabase, cleanupDatabase } from '@/tests/helpers/database';

describe('Help Request Database Operations', () => {
  beforeEach(async () => {
    await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  it('creates and retrieves help requests', async () => {
    const requestData = {
      title: 'Test Request',
      description: 'Test description',
      category: 'groceries',
      urgency: 'normal',
      user_id: 'test-user',
    };

    const created = await createHelpRequest(requestData);
    expect(created.id).toBeDefined();

    const retrieved = await getHelpRequests();
    expect(retrieved).toContainEqual(expect.objectContaining({
      title: 'Test Request',
    }));
  });

  it('filters requests by status', async () => {
    await createHelpRequest({ 
      title: 'Open Request',
      status: 'open',
      // ... other fields
    });

    await createHelpRequest({ 
      title: 'Closed Request',
      status: 'closed',
      // ... other fields
    });

    const openRequests = await getHelpRequests({ status: 'open' });
    expect(openRequests).toHaveLength(1);
    expect(openRequests[0].title).toBe('Open Request');
  });
});
```

## ♿ Accessibility Testing

### Component Accessibility

```typescript
// components/RequestForm.test.tsx
import { render, screen } from '@/tests/utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { RequestForm } from './RequestForm';

expect.extend(toHaveNoViolations);

describe('RequestForm Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<RequestForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper form labels', () => {
    render(<RequestForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('shows error messages accessibly', async () => {
    const user = userEvent.setup();
    render(<RequestForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  });

  it('maintains focus order', async () => {
    const user = userEvent.setup();
    render(<RequestForm />);
    
    const elements = [
      screen.getByLabelText(/title/i),
      screen.getByLabelText(/description/i),
      screen.getByLabelText(/category/i),
      screen.getByLabelText(/urgency/i),
      screen.getByRole('button', { name: /submit/i }),
    ];

    for (const element of elements) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<RequestForm />);
    
    const select = screen.getByLabelText(/category/i);
    select.focus();
    
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(select.value).not.toBe('');
  });

  it('has sufficient color contrast', () => {
    const { container } = render(<RequestForm />);
    
    const labels = container.querySelectorAll('label');
    labels.forEach(label => {
      const styles = window.getComputedStyle(label);
      // This would use a real contrast calculation library
      expect(styles.color).toBeDefined();
    });
  });
});
```

### Screen Reader Testing

```typescript
// tests/accessibility/screen-reader.test.tsx
import { render, screen } from '@/tests/utils';
import { HelpRequestCard } from '@/components/HelpRequestCard';

describe('Screen Reader Compatibility', () => {
  const mockRequest = {
    id: '1',
    title: 'Need help with groceries',
    description: 'Cannot get to store this week',
    category: 'groceries',
    urgency: 'urgent',
    status: 'open',
    user: { name: 'John Doe' },
  };

  it('has proper heading structure', () => {
    render(<HelpRequestCard request={mockRequest} />);
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Need help with groceries');
  });

  it('uses semantic HTML', () => {
    const { container } = render(<HelpRequestCard request={mockRequest} />);
    
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('provides context through ARIA labels', () => {
    render(<HelpRequestCard request={mockRequest} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-labelledby');
    
    const status = screen.getByText(/urgent/i);
    expect(status).toHaveAttribute('aria-label', 'Request urgency: urgent');
  });

  it('announces dynamic content changes', async () => {
    const { rerender } = render(<HelpRequestCard request={mockRequest} />);
    
    const updatedRequest = { ...mockRequest, status: 'in_progress' };
    rerender(<HelpRequestCard request={updatedRequest} />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Status updated to in progress');
  });
});
```

## 🌐 End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/help-request-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Help Request User Flow', () => {
  test('user can create and view help request', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to create request
    await page.click('text=Need Help');
    await expect(page).toHaveURL('/requests/new');
    
    // Fill form
    await page.fill('[name="title"]', 'Need help with groceries');
    await page.fill('[name="description"]', 'Cannot get to store this week');
    await page.selectOption('[name="category"]', 'groceries');
    await page.selectOption('[name="urgency"]', 'normal');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify creation
    await expect(page).toHaveURL(/\/requests\/[\w-]+/);
    await expect(page.locator('h1')).toContainText('Need help with groceries');
    
    // Verify in list
    await page.goto('/requests');
    await expect(page.locator('text=Need help with groceries')).toBeVisible();
  });

  test('helper can offer assistance', async ({ page }) => {
    // Navigate to request as helper
    await page.goto('/requests/test-request-id');
    
    // Offer help
    await page.click('text=Offer Help');
    
    // Verify contact exchange
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('request appears in dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('h2:has-text("My Active Requests")')).toBeVisible();
    await expect(page.locator('.request-card')).toHaveCount(3);
  });
});
```

### Mobile Testing

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test.describe('Mobile Experience', () => {
  test('mobile navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Open mobile menu
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    
    // Navigate
    await page.click('nav >> text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('touch targets are adequate size', async ({ page }) => {
    await page.goto('/requests/new');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('forms are mobile optimized', async ({ page }) => {
    await page.goto('/requests/new');
    
    // Check that inputs don't cause zoom
    const input = page.locator('input[type="text"]').first();
    const fontSize = await input.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });
});
```

## 🔒 Security Testing

### Input Validation Testing

```typescript
// tests/security/validation.test.ts
import { validateHelpRequest } from '@/lib/validation';

describe('Security: Input Validation', () => {
  it('prevents XSS in text fields', () => {
    const maliciousInput = {
      title: '<script>alert("XSS")</script>',
      description: 'Normal description',
      category: 'groceries',
    };

    const result = validateHelpRequest(maliciousInput);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('HTML tags are not allowed');
  });

  it('prevents SQL injection', () => {
    const sqlInjection = {
      title: "'; DROP TABLE users; --",
      description: 'Normal description',
      category: 'groceries',
    };

    const result = validateHelpRequest(sqlInjection);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid characters detected');
  });

  it('validates data types', () => {
    const invalidTypes = {
      title: 123, // Should be string
      category: 'invalid_category',
      urgency: 'super_urgent', // Invalid enum
    };

    const result = validateHelpRequest(invalidTypes);
    expect(result.success).toBe(false);
  });

  it('enforces length limits', () => {
    const tooLong = {
      title: 'a'.repeat(101),
      description: 'b'.repeat(501),
      category: 'groceries',
    };

    const result = validateHelpRequest(tooLong);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Title must be less than 100 characters');
  });
});
```

### Authentication Testing

```typescript
// tests/security/auth.test.ts
import { attemptLogin } from '@/lib/auth';
import { rateLimiter } from '@/lib/security/rate-limiter';

describe('Security: Authentication', () => {
  it('rate limits login attempts', async () => {
    const ip = '192.168.1.1';
    
    // Attempt multiple logins
    for (let i = 0; i < 10; i++) {
      await attemptLogin({
        email: 'test@example.com',
        password: 'wrong_password',
        ip,
      });
    }

    // Should be rate limited
    const result = await attemptLogin({
      email: 'test@example.com',
      password: 'correct_password',
      ip,
    });

    expect(result.error).toBe('Too many attempts');
    expect(result.retryAfter).toBeDefined();
  });

  it('validates password strength', () => {
    const weakPasswords = [
      'short',
      '12345678',
      'password',
      'qwerty123',
    ];

    weakPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
    });
  });

  it('prevents timing attacks', async () => {
    const validEmail = 'exists@example.com';
    const invalidEmail = 'notexists@example.com';
    
    const start1 = Date.now();
    await attemptLogin({ email: validEmail, password: 'wrong' });
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await attemptLogin({ email: invalidEmail, password: 'wrong' });
    const time2 = Date.now() - start2;
    
    // Response times should be similar
    expect(Math.abs(time1 - time2)).toBeLessThan(50);
  });
});
```

## 📈 Performance Testing

### Component Performance

```typescript
// tests/performance/render.test.ts
import { render } from '@/tests/utils';
import { HelpRequestList } from '@/components/HelpRequestList';

describe('Performance: Rendering', () => {
  it('renders large lists efficiently', () => {
    const requests = Array.from({ length: 1000 }, (_, i) => ({
      id: `request-${i}`,
      title: `Request ${i}`,
      // ... other fields
    }));

    const startTime = performance.now();
    render(<HelpRequestList requests={requests} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(500); // 500ms threshold
  });

  it('implements virtualization for long lists', () => {
    const { container } = render(
      <HelpRequestList requests={largeDataset} virtualized />
    );

    // Should only render visible items
    const renderedItems = container.querySelectorAll('.request-card');
    expect(renderedItems.length).toBeLessThan(50); // Window size dependent
  });

  it('memoizes expensive calculations', () => {
    const calculateSpy = vi.fn();
    
    const { rerender } = render(
      <ExpensiveComponent onCalculate={calculateSpy} data={data} />
    );

    // Re-render with same props
    rerender(<ExpensiveComponent onCalculate={calculateSpy} data={data} />);

    expect(calculateSpy).toHaveBeenCalledTimes(1); // Not recalculated
  });
});
```

## 🎯 Testing Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:a11y": "vitest run --grep accessibility",
    "test:security": "vitest run --grep security",
    "test:ci": "vitest run --coverage && playwright test"
  }
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run accessibility tests
        run: npm run test:a11y
```

## 📊 Testing Metrics & Coverage

### Coverage Requirements

```typescript
// vitest.coverage.config.ts
export default {
  thresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './components/': {
      statements: 90,
      branches: 85,
    },
    './lib/security/': {
      statements: 100,
      branches: 100,
    },
    './app/api/': {
      statements: 85,
      branches: 80,
    },
  },
};
```

### Coverage Report Analysis

```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
npx vite preview --outDir coverage

# Check specific file coverage
npx vitest run --coverage --reporter=json --outputFile=coverage.json
cat coverage.json | jq '.coverage["components/ContactExchange.tsx"]'
```

## 🐛 Debugging Tests

### Debug Utilities

```typescript
// tests/debug-utils.ts
export function debugComponent(component: ReactElement) {
  const { debug, container } = render(component);
  
  console.log('=== Component Debug ===');
  debug();
  
  console.log('=== Accessibility Tree ===');
  console.log(prettyDOM(container));
  
  console.log('=== ARIA Attributes ===');
  const elements = container.querySelectorAll('[aria-label], [aria-describedby]');
  elements.forEach(el => {
    console.log(el.tagName, {
      label: el.getAttribute('aria-label'),
      describedby: el.getAttribute('aria-describedby'),
    });
  });
}

// Usage in tests
it('debug problematic component', () => {
  debugComponent(<ProblematicComponent />);
});
```

### Visual Regression Testing

```typescript
// tests/visual/snapshot.test.ts
import { test, expect } from '@playwright/test';

test('visual regression: dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('visual regression: mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page).toHaveScreenshot('mobile-home.png');
});
```

## 📝 Testing Best Practices

### Do's
1. ✅ Write tests alongside code
2. ✅ Test user behavior, not implementation
3. ✅ Use semantic queries (getByRole, getByLabelText)
4. ✅ Test error states and edge cases
5. ✅ Mock external dependencies
6. ✅ Keep tests focused and isolated
7. ✅ Use descriptive test names

### Don'ts
1. ❌ Test implementation details
2. ❌ Use arbitrary waits (use waitFor instead)
3. ❌ Share state between tests
4. ❌ Test third-party libraries
5. ❌ Ignore flaky tests
6. ❌ Skip accessibility tests

## 🔄 Continuous Testing

### Test Monitoring Dashboard

```typescript
// scripts/test-metrics.ts
import { readFileSync } from 'fs';

function analyzeTestMetrics() {
  const coverage = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf-8'));
  const testResults = JSON.parse(readFileSync('test-results.json', 'utf-8'));
  
  return {
    coverage: {
      statements: calculateCoverage(coverage, 'statements'),
      branches: calculateCoverage(coverage, 'branches'),
      functions: calculateCoverage(coverage, 'functions'),
      lines: calculateCoverage(coverage, 'lines'),
    },
    tests: {
      total: testResults.numTotalTests,
      passed: testResults.numPassedTests,
      failed: testResults.numFailedTests,
      duration: testResults.time,
    },
    slowestTests: getTop10SlowestTests(testResults),
    flakyTests: identifyFlakyTests(testResults),
  };
}
```

---

**Document Status**: Active  
**Last Updated**: January 2025  
**Next Review**: After each sprint  
**Coverage Target**: 80% minimum  
**Owner**: QA Team  

This comprehensive testing strategy ensures the Care Collective platform maintains high quality standards through automated testing at every level, from unit tests to end-to-end scenarios, with special emphasis on accessibility and security.