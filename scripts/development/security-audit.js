#!/usr/bin/env node

/**
 * @fileoverview Care Collective Security Audit Script
 * 
 * This script runs comprehensive security tests and generates a security audit report.
 * It can be used in CI/CD pipelines or run manually for security assessments.
 * 
 * Usage:
 *   npm run db:security-audit
 *   node scripts/security-audit.js
 *   node scripts/security-audit.js --output=json
 *   node scripts/security-audit.js --verbose
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testFiles: [
    'tests/database/rls-policies.test.ts',
    'tests/database/integration-flows.test.ts',
    'tests/database/security-audit.test.ts'
  ],
  outputDir: 'security-reports',
  reportFile: 'security-audit-report.json',
  verbose: process.argv.includes('--verbose'),
  outputFormat: process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'console'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = '') => {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
};

const error = (message) => log(`❌ ERROR: ${message}`, colors.red);
const success = (message) => log(`✅ SUCCESS: ${message}`, colors.green);
const warning = (message) => log(`⚠️  WARNING: ${message}`, colors.yellow);
const info = (message) => log(`ℹ️  INFO: ${message}`, colors.blue);

// Security audit result structure
class SecurityAuditResult {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.overall = 'PENDING';
    this.tests = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    this.categories = {};
    this.vulnerabilities = [];
    this.recommendations = [];
    this.performance = {};
  }

  addTestResult(category, testName, status, details = {}) {
    if (!this.categories[category]) {
      this.categories[category] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: []
      };
    }

    this.categories[category].total++;
    this.categories[category][status]++;
    this.categories[category].tests.push({
      name: testName,
      status,
      ...details
    });

    this.tests.total++;
    this.tests[status]++;
  }

  addVulnerability(severity, description, category, recommendation) {
    this.vulnerabilities.push({
      severity,
      description,
      category,
      recommendation,
      timestamp: new Date().toISOString()
    });
  }

  addRecommendation(priority, description, category) {
    this.recommendations.push({
      priority,
      description,
      category,
      timestamp: new Date().toISOString()
    });
  }

  finalize() {
    // Determine overall security status
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const failedTests = this.tests.failed;
    const successRate = this.tests.total > 0 ? (this.tests.passed / this.tests.total) * 100 : 0;

    if (criticalVulns > 0 || failedTests > this.tests.total * 0.1) {
      this.overall = 'CRITICAL';
    } else if (failedTests > 0 || successRate < 95) {
      this.overall = 'WARNING';
    } else {
      this.overall = 'SECURE';
    }

    this.performance.successRate = successRate;
    this.performance.totalTests = this.tests.total;
  }
}

// Main security audit function
async function runSecurityAudit() {
  info('Starting Care Collective Security Audit...');
  
  const auditResult = new SecurityAuditResult();
  const startTime = Date.now();

  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Run each test file
    for (const testFile of CONFIG.testFiles) {
      await runTestFile(testFile, auditResult);
    }

    // Add performance metrics
    auditResult.performance.totalDuration = Date.now() - startTime;

    // Add general security recommendations
    addSecurityRecommendations(auditResult);

    // Finalize the audit
    auditResult.finalize();

    // Generate and save report
    await generateReport(auditResult);

    // Print summary
    printSummary(auditResult);

    // Exit with appropriate code
    process.exit(auditResult.overall === 'CRITICAL' ? 1 : 0);

  } catch (err) {
    error(`Security audit failed: ${err.message}`);
    if (CONFIG.verbose) {
      console.error(err);
    }
    process.exit(1);
  }
}

// Run individual test file
async function runTestFile(testFile, auditResult) {
  return new Promise((resolve, reject) => {
    info(`Running security tests: ${testFile}`);

    const vitestProcess = spawn('npx', ['vitest', 'run', testFile, '--reporter=json'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    vitestProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    vitestProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    vitestProcess.on('close', (code) => {
      try {
        // Parse test results
        parseTestResults(stdout, stderr, testFile, auditResult);
        
        if (code === 0) {
          success(`Completed: ${testFile}`);
        } else {
          warning(`Tests completed with issues: ${testFile}`);
        }
        
        resolve();
      } catch (parseError) {
        warning(`Failed to parse results for ${testFile}: ${parseError.message}`);
        if (CONFIG.verbose) {
          console.error('STDOUT:', stdout);
          console.error('STDERR:', stderr);
        }
        resolve(); // Continue with other tests
      }
    });

    vitestProcess.on('error', (err) => {
      error(`Failed to run ${testFile}: ${err.message}`);
      reject(err);
    });
  });
}

// Parse test results from vitest output
function parseTestResults(stdout, stderr, testFile, auditResult) {
  try {
    // Try to parse JSON output
    const lines = stdout.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{'));
    
    if (jsonLine) {
      const results = JSON.parse(jsonLine);
      processVitestResults(results, testFile, auditResult);
    } else {
      // Fallback to basic parsing
      processBasicResults(stdout, stderr, testFile, auditResult);
    }
  } catch (error) {
    warning(`Error parsing test results: ${error.message}`);
    processBasicResults(stdout, stderr, testFile, auditResult);
  }
}

// Process structured vitest results
function processVitestResults(results, testFile, auditResult) {
  const category = getTestCategory(testFile);
  
  if (results.testResults) {
    results.testResults.forEach(testResult => {
      const status = testResult.status === 'passed' ? 'passed' : 'failed';
      const details = {
        duration: testResult.duration,
        failureMessage: testResult.failureMessage || null
      };
      
      auditResult.addTestResult(category, testResult.ancestorTitles.join(' > '), status, details);
      
      // Analyze for security vulnerabilities
      analyzeTestForVulnerabilities(testResult, auditResult);
    });
  }
}

// Process basic text output when JSON parsing fails
function processBasicResults(stdout, stderr, testFile, auditResult) {
  const category = getTestCategory(testFile);
  
  // Basic pattern matching for test results
  const passedMatches = stdout.match(/✓|PASS/g) || [];
  const failedMatches = stdout.match(/✗|FAIL/g) || [];
  
  const totalTests = passedMatches.length + failedMatches.length;
  
  for (let i = 0; i < passedMatches.length; i++) {
    auditResult.addTestResult(category, `Test ${i + 1}`, 'passed');
  }
  
  for (let i = 0; i < failedMatches.length; i++) {
    auditResult.addTestResult(category, `Failed Test ${i + 1}`, 'failed');
  }
  
  if (totalTests === 0) {
    warning(`No test results found for ${testFile}`);
    auditResult.addTestResult(category, 'Unknown', 'skipped');
  }
}

// Get test category from filename
function getTestCategory(testFile) {
  if (testFile.includes('rls-policies')) return 'RLS Security';
  if (testFile.includes('integration-flows')) return 'Integration Security';
  if (testFile.includes('security-audit')) return 'Security Audit';
  return 'General Security';
}

// Analyze test results for security vulnerabilities
function analyzeTestForVulnerabilities(testResult, auditResult) {
  if (testResult.status === 'failed') {
    const testName = testResult.ancestorTitles.join(' > ');
    
    // Critical security failures
    if (testName.toLowerCase().includes('contact') && testName.toLowerCase().includes('privacy')) {
      auditResult.addVulnerability(
        'CRITICAL',
        `Contact privacy protection failed: ${testName}`,
        'Privacy Protection',
        'Review and fix contact exchange privacy policies immediately'
      );
    }
    
    if (testName.toLowerCase().includes('admin') && testName.toLowerCase().includes('escalation')) {
      auditResult.addVulnerability(
        'CRITICAL',
        `Privilege escalation vulnerability: ${testName}`,
        'Access Control',
        'Fix admin privilege escalation prevention immediately'
      );
    }
    
    if (testName.toLowerCase().includes('sql injection')) {
      auditResult.addVulnerability(
        'HIGH',
        `SQL injection vulnerability: ${testName}`,
        'Input Validation',
        'Implement proper input sanitization and parameterized queries'
      );
    }
    
    if (testName.toLowerCase().includes('rls')) {
      auditResult.addVulnerability(
        'HIGH',
        `Row Level Security policy failure: ${testName}`,
        'Database Security',
        'Review and fix RLS policies to prevent unauthorized data access'
      );
    }
  }
}

// Add general security recommendations
function addSecurityRecommendations(auditResult) {
  auditResult.addRecommendation(
    'HIGH',
    'Regularly run security audits in CI/CD pipeline',
    'Process'
  );
  
  auditResult.addRecommendation(
    'MEDIUM',
    'Implement automated security monitoring and alerting',
    'Monitoring'
  );
  
  auditResult.addRecommendation(
    'MEDIUM',
    'Conduct periodic penetration testing by external security experts',
    'Testing'
  );
  
  auditResult.addRecommendation(
    'LOW',
    'Maintain security documentation and incident response procedures',
    'Documentation'
  );
}

// Generate security audit report
async function generateReport(auditResult) {
  const reportPath = path.join(CONFIG.outputDir, CONFIG.reportFile);
  
  if (CONFIG.outputFormat === 'json') {
    // JSON report
    fs.writeFileSync(reportPath, JSON.stringify(auditResult, null, 2));
    success(`Security audit report saved: ${reportPath}`);
  } else {
    // Human-readable report
    const htmlReport = generateHtmlReport(auditResult);
    const htmlPath = path.join(CONFIG.outputDir, 'security-audit-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    success(`Security audit report saved: ${htmlPath}`);
    
    // Also save JSON for programmatic access
    fs.writeFileSync(reportPath, JSON.stringify(auditResult, null, 2));
  }
}

// Generate HTML report
function generateHtmlReport(auditResult) {
  const statusColor = {
    'SECURE': '#28a745',
    'WARNING': '#ffc107', 
    'CRITICAL': '#dc3545'
  }[auditResult.overall] || '#6c757d';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Care Collective Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 32px; font-weight: bold; color: #007bff; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .vulnerability { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .vulnerability.HIGH { background: #fff3cd; border-color: #ffeaa7; }
        .vulnerability.MEDIUM { background: #d1ecf1; border-color: #bee5eb; }
        .vulnerability.LOW { background: #d4edda; border-color: #c3e6cb; }
        .test-category { margin: 20px 0; }
        .test-category h3 { color: #495057; }
        .test-result { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .test-result.passed { background: #d4edda; color: #155724; }
        .test-result.failed { background: #f8d7da; color: #721c24; }
        .test-result.skipped { background: #fff3cd; color: #856404; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Care Collective Security Audit Report</h1>
            <div class="status">Overall Status: ${auditResult.overall}</div>
            <p>Generated: ${auditResult.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${auditResult.tests.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value" style="color: #28a745;">${auditResult.tests.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">${auditResult.tests.failed}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${auditResult.performance.successRate?.toFixed(1) || 0}%</div>
            </div>
        </div>

        ${auditResult.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🚨 Security Vulnerabilities</h2>
            ${auditResult.vulnerabilities.map(vuln => `
                <div class="vulnerability ${vuln.severity}">
                    <strong>${vuln.severity}: ${vuln.description}</strong><br>
                    <em>Category: ${vuln.category}</em><br>
                    <strong>Recommendation:</strong> ${vuln.recommendation}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>📊 Test Results by Category</h2>
            ${Object.entries(auditResult.categories).map(([category, results]) => `
                <div class="test-category">
                    <h3>${category} (${results.passed}/${results.total} passed)</h3>
                    ${results.tests.map(test => `
                        <div class="test-result ${test.status}">
                            ${test.status.toUpperCase()}: ${test.name}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>💡 Security Recommendations</h2>
            <table>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Category</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditResult.recommendations.map(rec => `
                        <tr>
                            <td><strong>${rec.priority}</strong></td>
                            <td>${rec.category}</td>
                            <td>${rec.description}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total Test Duration</td>
                        <td>${(auditResult.performance.totalDuration / 1000).toFixed(2)}s</td>
                    </tr>
                    <tr>
                        <td>Average Test Duration</td>
                        <td>${((auditResult.performance.totalDuration / auditResult.tests.total) / 1000).toFixed(2)}s</td>
                    </tr>
                    <tr>
                        <td>Success Rate</td>
                        <td>${auditResult.performance.successRate?.toFixed(1) || 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
}

// Print summary to console
function printSummary(auditResult) {
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  CARE COLLECTIVE SECURITY AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  const statusColor = auditResult.overall === 'SECURE' ? colors.green :
                     auditResult.overall === 'WARNING' ? colors.yellow : colors.red;
  
  console.log(`${statusColor}Overall Status: ${auditResult.overall}${colors.reset}`);
  console.log(`Total Tests: ${auditResult.tests.total}`);
  console.log(`${colors.green}✅ Passed: ${auditResult.tests.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${auditResult.tests.failed}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Skipped: ${auditResult.tests.skipped}${colors.reset}`);
  console.log(`Success Rate: ${auditResult.performance.successRate?.toFixed(1) || 0}%`);
  console.log(`Duration: ${(auditResult.performance.totalDuration / 1000).toFixed(2)}s`);
  
  if (auditResult.vulnerabilities.length > 0) {
    console.log('\n🚨 SECURITY VULNERABILITIES:');
    auditResult.vulnerabilities.forEach(vuln => {
      const severityColor = vuln.severity === 'CRITICAL' ? colors.red :
                           vuln.severity === 'HIGH' ? colors.yellow : colors.blue;
      console.log(`${severityColor}${vuln.severity}: ${vuln.description}${colors.reset}`);
    });
  }
  
  console.log('\n📁 Reports saved to:', CONFIG.outputDir);
  console.log('='.repeat(60));
}

// Run the security audit
if (require.main === module) {
  runSecurityAudit().catch(err => {
    error(`Unhandled error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  runSecurityAudit,
  SecurityAuditResult
};