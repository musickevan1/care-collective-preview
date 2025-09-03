/**
 * @fileoverview Issue Tracking and Documentation System
 * 
 * Provides utilities for tracking, categorizing, and documenting issues
 * discovered during testing as outlined in the TESTING_PLAN.md.
 * Implements the issue documentation format and automated detection.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Issue severity levels as defined in TESTING_PLAN.md
 */
export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

/**
 * Issue priority levels for development team
 */
export type IssuePriority = 'Must Fix' | 'Should Fix' | 'Nice to Have';

/**
 * Issue categories based on expected issue types in TESTING_PLAN.md
 */
export type IssueCategory = 
  | 'Authentication Issues'
  | 'Form and Validation Issues'
  | 'Database and API Issues'
  | 'UI/UX Issues'
  | 'Accessibility Issues'
  | 'Performance Issues';

/**
 * Issue structure following the template in TESTING_PLAN.md
 */
export interface Issue {
  id: string;
  title: string;
  page: string;
  component?: string;
  severity: IssueSeverity;
  category: IssueCategory;
  priority: IssuePriority;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  rootCause?: string;
  suggestedFix?: string;
  browserDevice?: string;
  screenshots?: string[];
  testCase?: string;
  discoveredAt: string;
  discoveredBy: string;
  status: 'Open' | 'In Progress' | 'Fixed' | 'Closed';
  fixedAt?: string;
  fixedBy?: string;
  notes?: string;
}

/**
 * Issue tracking class for managing discovered issues
 */
export class IssueTracker {
  private issues: Issue[] = [];
  private issuesFilePath: string;
  private nextIssueId = 1;

  constructor(baseDir: string = process.cwd()) {
    this.issuesFilePath = join(baseDir, 'TESTING_ISSUES.json');
    this.loadExistingIssues();
  }

  /**
   * Load existing issues from file
   */
  private loadExistingIssues(): void {
    if (existsSync(this.issuesFilePath)) {
      try {
        const data = readFileSync(this.issuesFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.issues = parsed.issues || [];
        this.nextIssueId = Math.max(...this.issues.map(i => parseInt(i.id)), 0) + 1;
      } catch (error) {
        console.warn('Could not load existing issues:', error);
        this.issues = [];
      }
    }
  }

  /**
   * Save issues to file
   */
  private saveIssues(): void {
    const data = {
      issues: this.issues,
      metadata: {
        totalIssues: this.issues.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0',
      },
    };

    try {
      writeFileSync(this.issuesFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Could not save issues:', error);
    }
  }

  /**
   * Create a new issue
   */
  public createIssue(issueData: Omit<Issue, 'id' | 'discoveredAt' | 'status'>): Issue {
    const issue: Issue = {
      ...issueData,
      id: this.nextIssueId.toString(),
      discoveredAt: new Date().toISOString(),
      status: 'Open',
    };

    this.issues.push(issue);
    this.nextIssueId++;
    this.saveIssues();

    console.log(`🐛 New issue created: #${issue.id} - ${issue.title}`);
    return issue;
  }

  /**
   * Update an existing issue
   */
  public updateIssue(issueId: string, updates: Partial<Issue>): Issue | null {
    const issueIndex = this.issues.findIndex(i => i.id === issueId);
    
    if (issueIndex === -1) {
      console.warn(`Issue #${issueId} not found`);
      return null;
    }

    const issue = { ...this.issues[issueIndex], ...updates };
    this.issues[issueIndex] = issue;
    this.saveIssues();

    console.log(`📝 Updated issue #${issueId}: ${issue.title}`);
    return issue;
  }

  /**
   * Get all issues with optional filtering
   */
  public getIssues(filter?: {
    severity?: IssueSeverity[];
    category?: IssueCategory[];
    status?: Issue['status'][];
    priority?: IssuePriority[];
  }): Issue[] {
    if (!filter) return [...this.issues];

    return this.issues.filter(issue => {
      if (filter.severity && !filter.severity.includes(issue.severity)) return false;
      if (filter.category && !filter.category.includes(issue.category)) return false;
      if (filter.status && !filter.status.includes(issue.status)) return false;
      if (filter.priority && !filter.priority.includes(issue.priority)) return false;
      return true;
    });
  }

  /**
   * Get issue statistics
   */
  public getStatistics(): {
    total: number;
    bySeverity: Record<IssueSeverity, number>;
    byCategory: Record<IssueCategory, number>;
    byStatus: Record<Issue['status'], number>;
    byPriority: Record<IssuePriority, number>;
  } {
    const stats = {
      total: this.issues.length,
      bySeverity: {} as Record<IssueSeverity, number>,
      byCategory: {} as Record<IssueCategory, number>,
      byStatus: {} as Record<Issue['status'], number>,
      byPriority: {} as Record<IssuePriority, number>,
    };

    // Initialize counters
    (['Critical', 'High', 'Medium', 'Low'] as IssueSeverity[]).forEach(s => {
      stats.bySeverity[s] = 0;
    });

    (['Open', 'In Progress', 'Fixed', 'Closed'] as Issue['status'][]).forEach(s => {
      stats.byStatus[s] = 0;
    });

    (['Must Fix', 'Should Fix', 'Nice to Have'] as IssuePriority[]).forEach(p => {
      stats.byPriority[p] = 0;
    });

    // Count issues
    this.issues.forEach(issue => {
      stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
      stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Generate markdown report following TESTING_PLAN.md format
   */
  public generateMarkdownReport(): string {
    const stats = this.getStatistics();
    const criticalIssues = this.getIssues({ severity: ['Critical'] });
    const highPriorityIssues = this.getIssues({ priority: ['Must Fix'] });

    let report = `# Care Collective Testing Issues Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Issues**: ${stats.total}
- **Critical Issues**: ${stats.bySeverity.Critical}
- **Must Fix**: ${stats.byPriority['Must Fix']}
- **Open Issues**: ${stats.byStatus.Open}

## Statistics

### By Severity
${Object.entries(stats.bySeverity)
  .map(([severity, count]) => `- **${severity}**: ${count}`)
  .join('\n')}

### By Category
${Object.entries(stats.byCategory)
  .map(([category, count]) => `- **${category}**: ${count}`)
  .join('\n')}

### By Status
${Object.entries(stats.byStatus)
  .map(([status, count]) => `- **${status}**: ${count}`)
  .join('\n')}

## Critical Issues (Must Address Immediately)

${criticalIssues.length === 0 ? 'No critical issues found! 🎉' : criticalIssues.map(issue => this.formatIssueMarkdown(issue)).join('\n\n---\n\n')}

## High Priority Issues

${highPriorityIssues.length === 0 ? 'No high priority issues found! ✅' : highPriorityIssues.map(issue => this.formatIssueMarkdown(issue)).join('\n\n---\n\n')}

## All Issues

${this.issues.map(issue => this.formatIssueMarkdown(issue)).join('\n\n---\n\n')}

## Recommendations

${this.generateRecommendations()}
`;

    return report;
  }

  /**
   * Format individual issue as markdown following TESTING_PLAN.md template
   */
  private formatIssueMarkdown(issue: Issue): string {
    return `## Issue #${issue.id}: ${issue.title}

**Page/Component**: ${issue.page}${issue.component ? ` / ${issue.component}` : ''}

**Severity**: ${issue.severity}

**Category**: ${issue.category}

**Priority**: ${issue.priority}

**Status**: ${issue.status}

**Steps to Reproduce**:
${issue.stepsToReproduce.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Expected Behavior**: 
${issue.expectedBehavior}

**Actual Behavior**: 
${issue.actualBehavior}

${issue.rootCause ? `**Root Cause**: 
${issue.rootCause}` : ''}

${issue.suggestedFix ? `**Suggested Fix**: 
${issue.suggestedFix}` : ''}

${issue.browserDevice ? `**Browser/Device**: 
${issue.browserDevice}` : ''}

**Discovered**: ${new Date(issue.discoveredAt).toLocaleDateString()} by ${issue.discoveredBy}

${issue.testCase ? `**Test Case**: ${issue.testCase}` : ''}

${issue.notes ? `**Notes**: 
${issue.notes}` : ''}`;
  }

  /**
   * Generate recommendations based on issue patterns
   */
  private generateRecommendations(): string {
    const stats = this.getStatistics();
    const recommendations: string[] = [];

    // Authentication issues
    if (stats.byCategory['Authentication Issues'] > 0) {
      recommendations.push('🔐 **Authentication**: Review session synchronization and token management');
    }

    // Accessibility issues
    if (stats.byCategory['Accessibility Issues'] > 0) {
      recommendations.push('♿ **Accessibility**: Run automated accessibility audits and conduct manual testing with screen readers');
    }

    // Performance issues
    if (stats.byCategory['Performance Issues'] > 0) {
      recommendations.push('⚡ **Performance**: Consider implementing lazy loading and optimizing bundle sizes');
    }

    // Mobile issues (inferred from UI/UX issues)
    if (stats.byCategory['UI/UX Issues'] > 2) {
      recommendations.push('📱 **Mobile Experience**: Focus on responsive design testing across various devices');
    }

    // Database issues
    if (stats.byCategory['Database and API Issues'] > 0) {
      recommendations.push('🗄️ **Database**: Review error handling and implement proper retry mechanisms');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ **Great job!** No major patterns detected in current issues.');
    }

    return recommendations.join('\n\n');
  }

  /**
   * Export issues to JSON format for external tools
   */
  public exportToJson(): string {
    return JSON.stringify({
      issues: this.issues,
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Quick issue creation for common testing scenarios
   */
  public createQuickIssue(
    title: string,
    page: string,
    actualBehavior: string,
    expectedBehavior: string,
    category: IssueCategory,
    severity: IssueSeverity = 'Medium',
    discoveredBy: string = 'Automated Test'
  ): Issue {
    return this.createIssue({
      title,
      page,
      actualBehavior,
      expectedBehavior,
      category,
      severity,
      priority: severity === 'Critical' ? 'Must Fix' : 
               severity === 'High' ? 'Should Fix' : 'Nice to Have',
      stepsToReproduce: ['Navigate to ' + page, 'Observe behavior'],
      discoveredBy,
    });
  }

  /**
   * Bulk issue creation from test results
   */
  public createIssuesFromTestResults(testResults: Array<{
    testName: string;
    page: string;
    error: string;
    category: IssueCategory;
    severity?: IssueSeverity;
  }>): Issue[] {
    return testResults.map(result => 
      this.createQuickIssue(
        `Test Failure: ${result.testName}`,
        result.page,
        `Test failed with error: ${result.error}`,
        'Test should pass without errors',
        result.category,
        result.severity || 'Medium',
        'Test Suite'
      )
    );
  }

  /**
   * Get issues ready for development team
   */
  public getIssuesForDevelopment(): Issue[] {
    return this.getIssues({ status: ['Open'] })
      .sort((a, b) => {
        // Sort by priority then severity
        const priorityOrder = { 'Must Fix': 3, 'Should Fix': 2, 'Nice to Have': 1 };
        const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Mark issues as fixed when tests pass
   */
  public markIssueFixed(issueId: string, fixedBy: string, notes?: string): Issue | null {
    return this.updateIssue(issueId, {
      status: 'Fixed',
      fixedAt: new Date().toISOString(),
      fixedBy,
      notes: notes ? `${notes}\n\n---\nFixed: ${new Date().toISOString()}` : undefined,
    });
  }

  /**
   * Get issues by test case for regression testing
   */
  public getIssuesByTestCase(testCase: string): Issue[] {
    return this.issues.filter(issue => issue.testCase === testCase);
  }
}

/**
 * Global issue tracker instance for use in tests
 */
export const issueTracker = new IssueTracker();

/**
 * Helper function to create issues from test failures
 */
export function reportTestIssue(
  testName: string,
  page: string,
  error: Error,
  category: IssueCategory,
  severity: IssueSeverity = 'Medium'
): Issue {
  return issueTracker.createIssue({
    title: `Test Failure: ${testName}`,
    page,
    component: extractComponentFromTest(testName),
    severity,
    category,
    priority: severity === 'Critical' ? 'Must Fix' : 
             severity === 'High' ? 'Should Fix' : 'Nice to Have',
    stepsToReproduce: [
      'Run the test suite',
      `Execute test: ${testName}`,
      'Observe the failure',
    ],
    expectedBehavior: 'Test should pass without errors',
    actualBehavior: `Test failed with error: ${error.message}`,
    rootCause: error.stack || error.message,
    testCase: testName,
    discoveredBy: 'Automated Test Suite',
    browserDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js Test Environment',
  });
}

/**
 * Extract component name from test description
 */
function extractComponentFromTest(testName: string): string | undefined {
  // Common patterns in test names
  const patterns = [
    /(\w+)\.test\.(tsx?|jsx?)/,
    /(\w+Component)/,
    /test.*(\w+Page)/,
    /(\w+)\s+should/,
  ];

  for (const pattern of patterns) {
    const match = testName.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}