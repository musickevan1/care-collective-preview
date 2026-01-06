/**
 * @fileoverview Comprehensive E2E Site Audit for Care Collective
 * 
 * This test suite systematically explores all pages of the site,
 * tests core functionality, and documents issues for remediation.
 * 
 * SAFETY: This test follows strict guardrails - see docs/testing/E2E_TESTING_PLAN.md
 * 
 * Usage:
 *   E2E_ADMIN_EMAIL=x E2E_ADMIN_PASSWORD=y npx playwright test comprehensive-site-audit.spec.ts
 * 
 * @version 1.0.0
 * @date January 2026
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BASE_URL = process.env.E2E_BASE_URL || 'https://www.swmocarecollective.org';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL || '';
const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD || '';

// Test data prefix for identification and cleanup
const TEST_PREFIX = '[E2E-TEST]';

// Report date for file naming
const REPORT_DATE = new Date().toISOString().split('T')[0];

// Screenshot directory
const SCREENSHOT_DIR = path.join(process.cwd(), `docs/reports/screenshots/e2e-${REPORT_DATE}`);

// Issue tracking
interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  page: string;
  title: string;
  description: string;
  screenshot?: string;
  viewport: string;
}

const issues: Issue[] = [];
let issueCounter = 1;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir(): void {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Generate unique issue ID
 */
function generateIssueId(): string {
  return `E2E-${REPORT_DATE}-${String(issueCounter++).padStart(3, '0')}`;
}

/**
 * Take a screenshot with consistent naming
 */
async function takeScreenshot(
  page: Page, 
  pageName: string, 
  viewport: 'desktop' | 'mobile',
  state: string = 'loaded'
): Promise<string> {
  ensureScreenshotDir();
  const timestamp = Date.now();
  const filename = `${pageName}-${viewport}-${state}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: state === 'full',
    animations: 'disabled'
  });
  
  console.log(`  Screenshot: ${filename}`);
  return filename;
}

/**
 * Log an issue found during testing
 */
function logIssue(
  severity: Issue['severity'],
  category: string,
  page: string,
  title: string,
  description: string,
  viewport: string,
  screenshot?: string
): void {
  const issue: Issue = {
    id: generateIssueId(),
    severity,
    category,
    page,
    title,
    description,
    screenshot,
    viewport
  };
  issues.push(issue);
  console.log(`  [${severity.toUpperCase()}] ${issue.id}: ${title}`);
}

/**
 * Check for common accessibility issues
 */
async function checkAccessibility(page: Page, pageName: string, viewport: string): Promise<void> {
  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    logIssue('medium', 'accessibility', pageName, 
      `${imagesWithoutAlt} images missing alt text`,
      `Found ${imagesWithoutAlt} <img> elements without alt attributes`,
      viewport
    );
  }

  // Check for buttons without accessible names
  const buttonsWithoutLabel = await page.locator('button:not([aria-label])').evaluateAll(buttons => 
    buttons.filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label')).length
  );
  if (buttonsWithoutLabel > 0) {
    logIssue('medium', 'accessibility', pageName,
      `${buttonsWithoutLabel} buttons without accessible names`,
      `Found ${buttonsWithoutLabel} <button> elements without text or aria-label`,
      viewport
    );
  }

  // Check for links without href
  const linksWithoutHref = await page.locator('a:not([href])').count();
  if (linksWithoutHref > 0) {
    logIssue('low', 'accessibility', pageName,
      `${linksWithoutHref} links without href`,
      `Found ${linksWithoutHref} <a> elements without href attribute`,
      viewport
    );
  }

  // Check for form inputs without labels
  const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([aria-labelledby]):not([id])').count();
  if (inputsWithoutLabels > 0) {
    logIssue('medium', 'accessibility', pageName,
      `${inputsWithoutLabels} form inputs without labels`,
      `Found ${inputsWithoutLabels} <input> elements that may lack proper labeling`,
      viewport
    );
  }
}

/**
 * Check for console errors
 */
async function checkConsoleErrors(page: Page, pageName: string, viewport: string): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      errors.push(text);
      // Don't log common/expected errors
      if (!text.includes('favicon') && !text.includes('404')) {
        logIssue('medium', 'functionality', pageName,
          'Console error detected',
          text.substring(0, 200),
          viewport
        );
      }
    }
  });
  
  return errors;
}

/**
 * Check page load performance
 */
async function checkPerformance(page: Page, pageName: string, viewport: string): Promise<void> {
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      loadTime: nav.loadEventEnd - nav.startTime,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      firstByte: nav.responseStart - nav.requestStart,
    };
  });

  if (timing.loadTime > 5000) {
    logIssue('medium', 'performance', pageName,
      `Slow page load: ${Math.round(timing.loadTime)}ms`,
      `Page took ${Math.round(timing.loadTime)}ms to fully load (target: <3000ms)`,
      viewport
    );
  }
}

/**
 * Login helper function
 */
async function login(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]:not([disabled])', { timeout: 10000 });
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    
    // Give it a moment to settle
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`  Login result URL: ${currentUrl}`);
    
    // Check for error message on page
    const errorVisible = await page.locator('text=/invalid|error|failed/i').isVisible().catch(() => false);
    if (errorVisible) {
      console.log('  Login error message visible on page');
      return false;
    }
    
    return !currentUrl.includes('/login');
  } catch (error) {
    console.error('Login failed:', error);
    // Take a screenshot of the failure state
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `login-failed-${Date.now()}.png`),
      fullPage: true 
    }).catch(() => {});
    return false;
  }
}

// =============================================================================
// TEST SUITE: PUBLIC PAGES
// =============================================================================

test.describe('Public Pages Audit', () => {
  test.describe.configure({ mode: 'serial' });

  const publicPages = [
    { path: '/', name: 'landing', title: 'Landing Page' },
    { path: '/about', name: 'about', title: 'About Page' },
    { path: '/resources', name: 'resources', title: 'Resources Page' },
    { path: '/contact', name: 'contact', title: 'Contact Page' },
    { path: '/login', name: 'login', title: 'Login Page' },
    { path: '/signup', name: 'signup', title: 'Signup Page' },
    { path: '/privacy-policy', name: 'privacy-policy', title: 'Privacy Policy' },
    { path: '/terms', name: 'terms', title: 'Terms of Service' },
    { path: '/waitlist', name: 'waitlist', title: 'Waitlist Page' },
  ];

  for (const pageInfo of publicPages) {
    test(`${pageInfo.title} - Desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      console.log(`\nTesting: ${pageInfo.title} (Desktop)`);
      
      // Navigate and wait
      const response = await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Check HTTP status
      if (response && response.status() >= 400) {
        logIssue('critical', 'functionality', pageInfo.name,
          `Page returns ${response.status()} error`,
          `HTTP ${response.status()} when accessing ${pageInfo.path}`,
          'desktop'
        );
      }
      
      // Take screenshot
      await takeScreenshot(page, pageInfo.name, 'desktop');
      
      // Check accessibility
      await checkAccessibility(page, pageInfo.name, 'desktop');
      
      // Check performance
      await checkPerformance(page, pageInfo.name, 'desktop');
      
      // Page-specific checks
      if (pageInfo.path === '/') {
        // Landing page specific checks
        const heroExists = await page.locator('section').first().isVisible();
        expect(heroExists).toBeTruthy();
        
        const ctaButton = page.locator('a:has-text("Join"), button:has-text("Join")').first();
        const ctaVisible = await ctaButton.isVisible().catch(() => false);
        if (!ctaVisible) {
          logIssue('high', 'ui-ux', pageInfo.name,
            'Primary CTA button not visible',
            'Could not find visible "Join" call-to-action button on landing page',
            'desktop'
          );
        }
      }
      
      if (pageInfo.path === '/login') {
        // Login page checks
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
      }
      
      if (pageInfo.path === '/signup') {
        // Signup page checks
        const formExists = await page.locator('form').isVisible();
        if (!formExists) {
          logIssue('critical', 'functionality', pageInfo.name,
            'Signup form not found',
            'Could not locate the signup form on the page',
            'desktop'
          );
        }
      }
    });

    test(`${pageInfo.title} - Mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      console.log(`\nTesting: ${pageInfo.title} (Mobile)`);
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await takeScreenshot(page, pageInfo.name, 'mobile');
      
      // Check for horizontal scroll (common mobile issue)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        logIssue('medium', 'mobile', pageInfo.name,
          'Horizontal scroll detected on mobile',
          'Page content extends beyond viewport width, causing horizontal scrolling',
          'mobile'
        );
      }
      
      // Check touch target sizes
      const smallButtons = await page.locator('button, a').evaluateAll(elements => {
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        }).length;
      });
      
      if (smallButtons > 0) {
        logIssue('low', 'accessibility', pageInfo.name,
          `${smallButtons} touch targets below 44px`,
          `Found ${smallButtons} interactive elements smaller than recommended 44x44px touch target`,
          'mobile'
        );
      }
    });
  }
});

// =============================================================================
// TEST SUITE: AUTHENTICATED MEMBER PAGES
// =============================================================================

test.describe('Authenticated Member Pages', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.skip(!MEMBER_EMAIL || !MEMBER_PASSWORD, 'Member credentials not provided');

  test.beforeAll(async ({ browser }) => {
    if (!MEMBER_EMAIL || !MEMBER_PASSWORD) {
      console.log('Skipping member tests - no credentials provided');
      return;
    }
  });

  const memberPages = [
    { path: '/dashboard', name: 'dashboard', title: 'Dashboard' },
    { path: '/requests', name: 'requests', title: 'Help Requests List' },
    { path: '/requests/new', name: 'requests-new', title: 'Create Help Request' },
    { path: '/requests/my-requests', name: 'my-requests', title: 'My Requests' },
    { path: '/messages', name: 'messages', title: 'Messages' },
    { path: '/profile', name: 'profile', title: 'Profile' },
    { path: '/privacy', name: 'privacy-settings', title: 'Privacy Settings' },
  ];

  test('Login as member', async ({ page }) => {
    console.log('\nLogging in as member...');
    const success = await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    
    if (!success) {
      logIssue('critical', 'functionality', 'login',
        'Member login failed',
        `Could not log in with member credentials: ${MEMBER_EMAIL}`,
        'desktop'
      );
    }
    
    expect(success).toBeTruthy();
    await takeScreenshot(page, 'member-login-success', 'desktop');
  });

  for (const pageInfo of memberPages) {
    test(`${pageInfo.title} - Desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      // Login first
      await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
      
      console.log(`\nTesting: ${pageInfo.title} (Desktop - Authenticated)`);
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Check if redirected to login (auth failed)
      if (page.url().includes('/login')) {
        logIssue('critical', 'functionality', pageInfo.name,
          'Authentication redirect on protected page',
          `Redirected to login when accessing ${pageInfo.path} - session may have expired`,
          'desktop'
        );
        return;
      }
      
      await takeScreenshot(page, pageInfo.name, 'desktop');
      await checkAccessibility(page, pageInfo.name, 'desktop');
      
      // Page-specific checks
      if (pageInfo.path === '/dashboard') {
        // Check for dashboard cards
        const cards = await page.locator('[class*="card"], [class*="Card"]').count();
        if (cards === 0) {
          logIssue('medium', 'ui-ux', pageInfo.name,
            'No dashboard cards found',
            'Expected to find dashboard cards/widgets but found none',
            'desktop'
          );
        }
      }
      
      if (pageInfo.path === '/requests') {
        // Check request listing
        const requestCards = await page.locator('article, [role="article"]').count();
        console.log(`  Found ${requestCards} request cards`);
      }
      
      if (pageInfo.path === '/messages') {
        // Check messages layout
        const conversationList = await page.locator('[class*="conversation"], [class*="Conversation"]').count();
        console.log(`  Found ${conversationList} conversation elements`);
      }
    });

    test(`${pageInfo.title} - Mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
      
      console.log(`\nTesting: ${pageInfo.title} (Mobile - Authenticated)`);
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('/login')) {
        await takeScreenshot(page, pageInfo.name, 'mobile');
      }
    });
  }
});

// =============================================================================
// TEST SUITE: ADMIN PAGES (OBSERVATION ONLY)
// =============================================================================

test.describe('Admin Pages Audit (Observation Only)', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin credentials not provided');

  const adminPages = [
    { path: '/admin', name: 'admin-dashboard', title: 'Admin Dashboard' },
    { path: '/admin/applications', name: 'admin-applications', title: 'Applications' },
    { path: '/admin/users', name: 'admin-users', title: 'User Management' },
    { path: '/admin/help-requests', name: 'admin-help-requests', title: 'Help Request Management' },
    { path: '/admin/cms', name: 'admin-cms', title: 'CMS Dashboard' },
    { path: '/admin/messaging/moderation', name: 'admin-moderation', title: 'Message Moderation' },
    { path: '/admin/reports', name: 'admin-reports', title: 'Reports' },
    { path: '/admin/performance', name: 'admin-performance', title: 'Performance' },
    { path: '/admin/privacy', name: 'admin-privacy', title: 'Privacy Dashboard' },
  ];

  test('Login as admin', async ({ page }) => {
    console.log('\nLogging in as admin...');
    const success = await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    
    if (!success) {
      logIssue('critical', 'functionality', 'login',
        'Admin login failed',
        `Could not log in with admin credentials: ${ADMIN_EMAIL}`,
        'desktop'
      );
    }
    
    expect(success).toBeTruthy();
    await takeScreenshot(page, 'admin-login-success', 'desktop');
  });

  for (const pageInfo of adminPages) {
    test(`${pageInfo.title} - Screenshot Only`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      
      console.log(`\nObserving: ${pageInfo.title} (SCREENSHOT ONLY - NO ACTIONS)`);
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Check access
      if (page.url().includes('/login') || page.url().includes('/access-denied')) {
        logIssue('high', 'functionality', pageInfo.name,
          'Admin page access denied',
          `Could not access ${pageInfo.path} - may require different permissions`,
          'desktop'
        );
        await takeScreenshot(page, `${pageInfo.name}-access-denied`, 'desktop');
        return;
      }
      
      await takeScreenshot(page, pageInfo.name, 'desktop');
      
      // Note: NO INTERACTIONS with admin features per safety guidelines
      console.log('  (No interactions performed - observation only)');
    });
  }
});

// =============================================================================
// TEST SUITE: CORE USER FLOWS
// =============================================================================

test.describe('Core User Flows', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.skip(!MEMBER_EMAIL || !MEMBER_PASSWORD, 'Member credentials not provided');

  test('Flow: View Help Requests', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('\nTesting Flow: View Help Requests');
    
    await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await page.goto('/requests');
    await page.waitForLoadState('networkidle');
    
    // Check if requests load
    const requestsExist = await page.locator('article, [class*="request"], [class*="Request"]').first().isVisible().catch(() => false);
    
    if (!requestsExist) {
      // Check for empty state
      const emptyState = await page.locator('text=/no requests|empty|none/i').isVisible().catch(() => false);
      if (emptyState) {
        console.log('  Empty state displayed (no requests available)');
      } else {
        logIssue('high', 'functionality', 'requests',
          'Help requests not displaying',
          'Neither request cards nor empty state message visible on requests page',
          'desktop'
        );
      }
    }
    
    await takeScreenshot(page, 'flow-view-requests', 'desktop');
  });

  test('Flow: Create Help Request Form Validation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('\nTesting Flow: Create Help Request Form Validation');
    
    await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await page.goto('/requests/new');
    await page.waitForLoadState('networkidle');
    
    // Check form exists
    const formExists = await page.locator('form').isVisible();
    if (!formExists) {
      logIssue('critical', 'functionality', 'requests-new',
        'Create request form not found',
        'Could not find form on /requests/new page',
        'desktop'
      );
      return;
    }
    
    // Test validation by submitting empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation messages
    const validationErrors = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
    if (validationErrors === 0) {
      logIssue('medium', 'functionality', 'requests-new',
        'Form validation messages not visible',
        'Expected validation errors when submitting empty form, but none displayed',
        'desktop'
      );
    }
    
    await takeScreenshot(page, 'flow-create-request-validation', 'desktop');
    
    // NOTE: Not actually creating a request - just testing form validation
    console.log('  (Form validation tested - no request created)');
  });

  test('Flow: Messages Interface Check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('\nTesting Flow: Messages Interface');
    
    await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    
    // Check messages interface loads
    const messagesLoaded = await page.locator('[class*="message"], [class*="Message"], [class*="conversation"], [class*="Conversation"]').first().isVisible().catch(() => false);
    
    if (!messagesLoaded) {
      // Check for empty state
      const emptyState = await page.locator('text=/no messages|no conversations|inbox empty/i').isVisible().catch(() => false);
      if (emptyState) {
        console.log('  Empty state displayed (no conversations)');
      } else {
        logIssue('medium', 'ui-ux', 'messages',
          'Messages interface unclear',
          'Neither message list nor clear empty state visible',
          'desktop'
        );
      }
    }
    
    await takeScreenshot(page, 'flow-messages-interface', 'desktop');
  });
});

// =============================================================================
// REPORT GENERATION
// =============================================================================

test.afterAll(async () => {
  console.log('\n========================================');
  console.log('GENERATING E2E TEST REPORT');
  console.log('========================================\n');
  
  // Count issues by severity
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;
  
  console.log(`Issues Found: ${issues.length}`);
  console.log(`  Critical: ${criticalCount}`);
  console.log(`  High: ${highCount}`);
  console.log(`  Medium: ${mediumCount}`);
  console.log(`  Low: ${lowCount}`);
  
  // Generate markdown report
  const report = generateMarkdownReport();
  
  // Save report
  const reportPath = path.join(process.cwd(), `docs/reports/e2e-testing-report-${REPORT_DATE}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved: ${reportPath}`);
  
  // Save issues as JSON for vulcan-todo integration
  const issuesPath = path.join(process.cwd(), `docs/reports/e2e-issues-${REPORT_DATE}.json`);
  fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2));
  console.log(`Issues JSON saved: ${issuesPath}`);
});

function generateMarkdownReport(): string {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');
  const lowIssues = issues.filter(i => i.severity === 'low');
  
  return `# E2E Testing Report - ${REPORT_DATE}

## Summary

| Metric | Value |
|--------|-------|
| **Total Issues Found** | ${issues.length} |
| **Critical** | ${criticalIssues.length} |
| **High** | ${highIssues.length} |
| **Medium** | ${mediumIssues.length} |
| **Low** | ${lowIssues.length} |
| **Test URL** | ${BASE_URL} |
| **Screenshots** | \`docs/reports/screenshots/e2e-${REPORT_DATE}/\` |

---

## Critical Issues

${criticalIssues.length === 0 ? '_No critical issues found._\n' : criticalIssues.map(i => `
### ${i.id}: ${i.title}

- **Page:** ${i.page}
- **Category:** ${i.category}
- **Viewport:** ${i.viewport}
- **Description:** ${i.description}
${i.screenshot ? `- **Screenshot:** ${i.screenshot}` : ''}
`).join('\n')}

---

## High Priority Issues

${highIssues.length === 0 ? '_No high priority issues found._\n' : highIssues.map(i => `
### ${i.id}: ${i.title}

- **Page:** ${i.page}
- **Category:** ${i.category}
- **Viewport:** ${i.viewport}
- **Description:** ${i.description}
${i.screenshot ? `- **Screenshot:** ${i.screenshot}` : ''}
`).join('\n')}

---

## Medium Priority Issues

${mediumIssues.length === 0 ? '_No medium priority issues found._\n' : mediumIssues.map(i => `
| ${i.id} | ${i.page} | ${i.title} | ${i.category} | ${i.viewport} |
`).join('')}

${mediumIssues.length > 0 ? `
| ID | Page | Issue | Category | Viewport |
|----|------|-------|----------|----------|
${mediumIssues.map(i => `| ${i.id} | ${i.page} | ${i.title} | ${i.category} | ${i.viewport} |`).join('\n')}
` : ''}

---

## Low Priority Issues

${lowIssues.length === 0 ? '_No low priority issues found._\n' : `
| ID | Page | Issue | Category | Viewport |
|----|------|-------|----------|----------|
${lowIssues.map(i => `| ${i.id} | ${i.page} | ${i.title} | ${i.category} | ${i.viewport} |`).join('\n')}
`}

---

## Next Steps

1. Review critical and high priority issues immediately
2. Create vulcan-todo tasks for each issue using:
   \`\`\`
   # Run the issue import script (see docs/reports/e2e-issues-${REPORT_DATE}.json)
   \`\`\`
3. Address issues in priority order
4. Re-run E2E tests after fixes

---

*Report generated: ${new Date().toISOString()}*
*Test framework: Playwright*
`;
}
