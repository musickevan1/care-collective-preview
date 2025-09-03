/**
 * @fileoverview Test Integration and Issue Tracking Setup
 * 
 * Integrates the issue tracking system with the test suite to automatically
 * capture and document issues discovered during testing.
 */

import { afterEach, beforeAll, afterAll } from 'vitest';
import { issueTracker, reportTestIssue, IssueCategory } from './utils/issue-tracker';

/**
 * Test execution context for tracking issues
 */
interface TestContext {
  currentTest?: string;
  currentSuite?: string;
  failures: Array<{
    test: string;
    error: Error;
    category: IssueCategory;
  }>;
}

const testContext: TestContext = {
  failures: [],
};

/**
 * Setup issue tracking for the test suite
 */
beforeAll(() => {
  console.log('🧪 Initializing Care Collective test suite with issue tracking');
  
  // Clear previous test run failures
  testContext.failures = [];
  
  // Log test run start
  console.log(`📊 Starting test run at ${new Date().toISOString()}`);
});

/**
 * Process any failures and update issue tracker
 */
afterEach((context) => {
  // In Vitest, we can access test context but failures are handled differently
  // This is a placeholder for the integration pattern
  if (testContext.failures.length > 0) {
    console.log(`⚠️ Processing ${testContext.failures.length} test failures`);
    
    testContext.failures.forEach(failure => {
      reportTestIssue(
        failure.test,
        extractPageFromTest(failure.test),
        failure.error,
        failure.category
      );
    });
    
    // Clear processed failures
    testContext.failures = [];
  }
});

/**
 * Generate final report after all tests complete
 */
afterAll(async () => {
  console.log('📋 Generating final test report');
  
  const stats = issueTracker.getStatistics();
  
  console.log('📊 Test Results Summary:');
  console.log(`   Total Issues Found: ${stats.total}`);
  console.log(`   Critical Issues: ${stats.bySeverity.Critical}`);
  console.log(`   High Priority: ${stats.byPriority['Must Fix']}`);
  
  // Generate markdown report
  const markdownReport = issueTracker.generateMarkdownReport();
  
  try {
    const fs = await import('fs');
    fs.writeFileSync('TESTING_REPORT.md', markdownReport);
    console.log('📄 Test report saved to TESTING_REPORT.md');
  } catch (error) {
    console.error('❌ Could not save test report:', error);
  }
  
  // Log critical issues to console for immediate attention
  const criticalIssues = issueTracker.getIssues({ severity: ['Critical'] });
  if (criticalIssues.length > 0) {
    console.error('🚨 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach(issue => {
      console.error(`   #${issue.id}: ${issue.title} (${issue.page})`);
    });
  }
  
  console.log('✅ Test suite completed');
});

/**
 * Helper function to extract page/component from test file path
 */
function extractPageFromTest(testName: string): string {
  // Extract from test file patterns
  const patterns = [
    /tests\/.*\/(.*?)\.test\.(tsx?|jsx?)/,
    /app\/(.*?)\/.*test/,
    /(.*?)\.test/,
    /test.*\/(.*?)\//,
  ];

  for (const pattern of patterns) {
    const match = testName.match(pattern);
    if (match) {
      return match[1].replace(/[-_]/g, ' ');
    }
  }

  return 'Unknown Page';
}

/**
 * Custom test helpers for issue tracking
 */
export const testHelpers = {
  /**
   * Report an authentication issue
   */
  reportAuthIssue(testName: string, error: Error) {
    return reportTestIssue(testName, '/auth', error, 'Authentication Issues', 'Critical');
  },

  /**
   * Report a form validation issue
   */
  reportFormIssue(testName: string, formPage: string, error: Error) {
    return reportTestIssue(testName, formPage, error, 'Form and Validation Issues', 'High');
  },

  /**
   * Report a database/API issue
   */
  reportDatabaseIssue(testName: string, error: Error) {
    return reportTestIssue(testName, '/api', error, 'Database and API Issues', 'High');
  },

  /**
   * Report a UI/UX issue
   */
  reportUIIssue(testName: string, page: string, error: Error) {
    return reportTestIssue(testName, page, error, 'UI/UX Issues', 'Medium');
  },

  /**
   * Report an accessibility issue
   */
  reportAccessibilityIssue(testName: string, page: string, error: Error) {
    return reportTestIssue(testName, page, error, 'Accessibility Issues', 'High');
  },

  /**
   * Report a performance issue
   */
  reportPerformanceIssue(testName: string, page: string, error: Error) {
    return reportTestIssue(testName, page, error, 'Performance Issues', 'Medium');
  },

  /**
   * Add a test failure to be processed
   */
  addFailure(testName: string, error: Error, category: IssueCategory) {
    testContext.failures.push({ test: testName, error, category });
  },

  /**
   * Get current issue statistics
   */
  getStats() {
    return issueTracker.getStatistics();
  },

  /**
   * Get issues for development team
   */
  getIssuesForDev() {
    return issueTracker.getIssuesForDevelopment();
  },

  /**
   * Mark an issue as fixed (for regression testing)
   */
  markIssueFixed(issueId: string, fixedBy: string = 'Test Suite') {
    return issueTracker.markIssueFixed(issueId, fixedBy);
  },

  /**
   * Create a quick issue manually during testing
   */
  createIssue(
    title: string,
    page: string,
    actualBehavior: string,
    expectedBehavior: string,
    category: IssueCategory
  ) {
    return issueTracker.createQuickIssue(
      title,
      page,
      actualBehavior,
      expectedBehavior,
      category,
      'Medium',
      'Manual Testing'
    );
  }
};

/**
 * Test utilities for Care Collective specific scenarios
 */
export const careCollectiveTestUtils = {
  /**
   * Test authentication state consistency
   */
  async testAuthConsistency(clientAuth: any, serverAuth: any) {
    if (clientAuth?.user?.id !== serverAuth?.user?.id) {
      testHelpers.addFailure(
        'Authentication State Synchronization',
        new Error('Client and server authentication states are inconsistent'),
        'Authentication Issues'
      );
    }
  },

  /**
   * Test help request creation flow
   */
  async testHelpRequestFlow(formData: any, result: any) {
    if (!result.success && result.error?.message?.includes('must be logged in')) {
      testHelpers.addFailure(
        'Help Request Creation Auth Check',
        new Error(result.error.message),
        'Authentication Issues'
      );
    }
  },

  /**
   * Test contact exchange privacy
   */
  async testContactExchangePrivacy(exchangeData: any, result: any) {
    if (result.contactShared && !exchangeData.consentGiven) {
      testHelpers.addFailure(
        'Contact Exchange Privacy Violation',
        new Error('Contact information shared without explicit consent'),
        'Database and API Issues'
      );
    }
  },

  /**
   * Test accessibility compliance
   */
  async testAccessibility(element: HTMLElement, requirements: string[]) {
    const missingRequirements = [];
    
    if (requirements.includes('aria-label') && !element.getAttribute('aria-label')) {
      missingRequirements.push('aria-label');
    }
    
    if (requirements.includes('keyboard-nav') && element.tabIndex < 0) {
      missingRequirements.push('keyboard navigation');
    }
    
    if (missingRequirements.length > 0) {
      testHelpers.addFailure(
        'Accessibility Compliance',
        new Error(`Missing accessibility requirements: ${missingRequirements.join(', ')}`),
        'Accessibility Issues'
      );
    }
  },

  /**
   * Test responsive design
   */
  async testResponsiveDesign(element: HTMLElement, viewportWidth: number) {
    const rect = element.getBoundingClientRect();
    
    if (rect.width > viewportWidth) {
      testHelpers.addFailure(
        'Responsive Design',
        new Error(`Element width (${rect.width}px) exceeds viewport (${viewportWidth}px)`),
        'UI/UX Issues'
      );
    }
    
    // Check touch targets on mobile
    if (viewportWidth < 768 && (rect.width < 44 || rect.height < 44)) {
      const isInteractive = element.matches('button, input, a, [role="button"]');
      if (isInteractive) {
        testHelpers.addFailure(
          'Touch Target Size',
          new Error(`Interactive element too small for mobile: ${rect.width}x${rect.height}px`),
          'Accessibility Issues'
        );
      }
    }
  },

  /**
   * Test performance metrics
   */
  async testPerformance(operationName: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    const thresholds = {
      'page-load': 3000,      // 3 seconds
      'form-submit': 5000,    // 5 seconds
      'api-call': 10000,      // 10 seconds
      'database-query': 2000, // 2 seconds
    };

    const threshold = thresholds[operationName as keyof typeof thresholds] || 5000;
    
    if (duration > threshold) {
      testHelpers.addFailure(
        'Performance Issue',
        new Error(`${operationName} took ${duration}ms, threshold is ${threshold}ms`),
        'Performance Issues'
      );
    }
  }
};

/**
 * Export the test context for advanced usage
 */
export { testContext, issueTracker };