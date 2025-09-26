#!/usr/bin/env node

/**
 * Care Collective Performance Load Testing Suite
 * Enterprise-grade load testing for 10x scaling validation
 * 
 * Usage: node scripts/performance-load-test.js [options]
 * Options:
 *   --concurrent=N    Number of concurrent users (default: 100)
 *   --duration=N      Test duration in seconds (default: 60)
 *   --target=URL      Target URL (default: http://localhost:3000)
 *   --scenario=NAME   Test scenario (dashboard|contact-exchange|messages|all)
 */

const { performance } = require('perf_hooks');
const https = require('https');
const http = require('http');
const url = require('url');

class CareCollectiveLoadTester {
  constructor(options = {}) {
    this.options = {
      concurrent: parseInt(options.concurrent) || 100,
      duration: parseInt(options.duration) || 60,
      target: options.target || 'http://localhost:3000',
      scenario: options.scenario || 'all',
      rampUpTime: 10000, // 10 seconds to ramp up
      ...options
    };
    
    this.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      errorTypes: {},
      startTime: null,
      endTime: null
    };
    
    this.activeRequests = 0;
    this.isRunning = false;
  }

  /**
   * Main load testing orchestrator
   */
  async runLoadTest() {
    console.log('🚀 Care Collective Load Testing Suite v5.0');
    console.log('============================================');
    console.log(`Target: ${this.options.target}`);
    console.log(`Concurrent Users: ${this.options.concurrent}`);
    console.log(`Duration: ${this.options.duration}s`);
    console.log(`Scenario: ${this.options.scenario}`);
    console.log('');

    this.results.startTime = Date.now();
    this.isRunning = true;

    // Start concurrent user simulation
    const userPromises = [];
    const rampUpInterval = this.options.rampUpTime / this.options.concurrent;

    for (let i = 0; i < this.options.concurrent; i++) {
      // Stagger user start times for realistic ramp-up
      setTimeout(() => {
        if (this.isRunning) {
          userPromises.push(this.simulateUser(i));
        }
      }, i * rampUpInterval);
    }

    // Run for specified duration
    setTimeout(() => {
      this.isRunning = false;
      console.log('\n⏰ Test duration reached, stopping...');
    }, this.options.duration * 1000);

    // Wait for all users to complete
    await Promise.allSettled(userPromises);
    
    this.results.endTime = Date.now();
    this.generateReport();
  }

  /**
   * Simulate individual user behavior
   */
  async simulateUser(userId) {
    console.log(`👤 User ${userId} started`);
    
    while (this.isRunning) {
      try {
        await this.executeScenario(userId);
        
        // Realistic think time between requests
        await this.sleep(Math.random() * 2000 + 1000); // 1-3 seconds
      } catch (error) {
        this.recordError(error);
      }
    }
    
    console.log(`👤 User ${userId} completed`);
  }

  /**
   * Execute specific test scenarios
   */
  async executeScenario(userId) {
    const scenarios = {
      dashboard: () => this.testDashboardLoad(userId),
      'contact-exchange': () => this.testContactExchange(userId),
      messages: () => this.testMessageSystem(userId),
      all: () => this.testRandomScenario(userId)
    };

    const scenario = scenarios[this.options.scenario] || scenarios.all;
    await scenario();
  }

  /**
   * Test dashboard loading performance (most critical)
   */
  async testDashboardLoad(userId) {
    const endpoints = [
      '/api/help-requests',
      '/api/dashboard/stats',
      '/api/user/profile'
    ];

    for (const endpoint of endpoints) {
      await this.makeRequest('GET', endpoint, null, `dashboard-${userId}`);
    }
  }

  /**
   * Test contact exchange system (privacy critical)
   */
  async testContactExchange(userId) {
    // Simulate contact exchange flow
    const requestId = `test-request-${userId}-${Date.now()}`;
    
    // 1. View help request
    await this.makeRequest('GET', `/api/help-requests/${requestId}`, null, `contact-view-${userId}`);
    
    // 2. Initiate contact exchange
    const contactData = {
      requestId: requestId,
      message: `Test contact exchange from user ${userId}`,
      consent: true
    };
    
    await this.makeRequest('POST', '/api/contact-exchange', contactData, `contact-exchange-${userId}`);
  }

  /**
   * Test messaging system performance
   */
  async testMessageSystem(userId) {
    const conversationId = `test-conversation-${userId}`;
    
    // 1. Load conversations
    await this.makeRequest('GET', '/api/conversations', null, `conversations-${userId}`);
    
    // 2. Load messages
    await this.makeRequest('GET', `/api/conversations/${conversationId}/messages`, null, `messages-${userId}`);
    
    // 3. Send message
    const messageData = {
      content: `Load test message from user ${userId} at ${new Date().toISOString()}`,
      conversationId: conversationId
    };
    
    await this.makeRequest('POST', '/api/messages', messageData, `send-message-${userId}`);
  }

  /**
   * Random scenario selection for realistic mixed load
   */
  async testRandomScenario(userId) {
    const scenarios = ['dashboard', 'contact-exchange', 'messages'];
    const weights = [0.6, 0.3, 0.1]; // Dashboard most frequent
    
    const random = Math.random();
    let scenario;
    
    if (random < weights[0]) {
      scenario = 'dashboard';
    } else if (random < weights[0] + weights[1]) {
      scenario = 'contact-exchange';
    } else {
      scenario = 'messages';
    }
    
    await this.executeScenario(userId);
  }

  /**
   * Make HTTP request and measure performance
   */
  async makeRequest(method, path, data, tag) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      this.activeRequests++;
      this.results.requests++;

      const targetUrl = new URL(path, this.options.target);
      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `CareCollective-LoadTest/5.0 (${tag})`,
          'Accept': 'application/json'
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const client = targetUrl.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          this.activeRequests--;
          this.results.responses++;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode >= 400) {
            this.recordError(new Error(`HTTP ${res.statusCode}: ${path}`));
          }
          
          // Log slow requests (> 1000ms)
          if (responseTime > 1000) {
            console.log(`⚠️  Slow request: ${method} ${path} - ${responseTime.toFixed(2)}ms`);
          }
          
          resolve({
            statusCode: res.statusCode,
            responseTime: responseTime,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        this.activeRequests--;
        this.recordError(error);
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        this.recordError(new Error(`Timeout: ${method} ${path}`));
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Record and categorize errors
   */
  recordError(error) {
    this.results.errors++;
    
    const errorType = error.code || error.message || 'Unknown';
    this.results.errorTypes[errorType] = (this.results.errorTypes[errorType] || 0) + 1;
    
    // Log critical errors immediately
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Timeout')) {
      console.log(`❌ Critical error: ${error.message}`);
    }
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const responseTimes = this.results.responseTimes.sort((a, b) => a - b);
    
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('===================');
    console.log(`Test Duration: ${duration.toFixed(2)}s`);
    console.log(`Total Requests: ${this.results.requests}`);
    console.log(`Successful Responses: ${this.results.responses}`);
    console.log(`Errors: ${this.results.errors}`);
    console.log(`Success Rate: ${((this.results.responses / this.results.requests) * 100).toFixed(2)}%`);
    console.log(`Requests per Second: ${(this.results.requests / duration).toFixed(2)}`);

    if (responseTimes.length > 0) {
      console.log('\n⏱️  RESPONSE TIME METRICS');
      console.log('========================');
      console.log(`Average: ${this.calculateAverage(responseTimes).toFixed(2)}ms`);
      console.log(`Median (P50): ${this.calculatePercentile(responseTimes, 50).toFixed(2)}ms`);
      console.log(`P95: ${this.calculatePercentile(responseTimes, 95).toFixed(2)}ms`);
      console.log(`P99: ${this.calculatePercentile(responseTimes, 99).toFixed(2)}ms`);
      console.log(`Min: ${responseTimes[0].toFixed(2)}ms`);
      console.log(`Max: ${responseTimes[responseTimes.length - 1].toFixed(2)}ms`);
    }

    if (Object.keys(this.results.errorTypes).length > 0) {
      console.log('\n❌ ERROR BREAKDOWN');
      console.log('==================');
      Object.entries(this.results.errorTypes).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });
    }

    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('=========================');
    this.assessPerformance(responseTimes, duration);

    console.log('\n📈 SCALING RECOMMENDATIONS');
    console.log('==========================');
    this.generateScalingRecommendations(responseTimes, duration);
  }

  /**
   * Assess performance against Care Collective targets
   */
  assessPerformance(responseTimes, duration) {
    const p95 = this.calculatePercentile(responseTimes, 95);
    const errorRate = (this.results.errors / this.results.requests) * 100;
    const throughput = this.results.requests / duration;

    // Performance targets for 10x scaling
    const targets = {
      p95ResponseTime: 50,    // Sub-50ms target
      errorRate: 1,           // <1% error rate
      throughput: 1000        // 1000+ requests/second
    };

    console.log(`P95 Response Time: ${p95.toFixed(2)}ms (Target: <${targets.p95ResponseTime}ms) ${p95 < targets.p95ResponseTime ? '✅' : '❌'}`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}% (Target: <${targets.errorRate}%) ${errorRate < targets.errorRate ? '✅' : '❌'}`);
    console.log(`Throughput: ${throughput.toFixed(2)} req/s (Target: >${targets.throughput} req/s) ${throughput > targets.throughput ? '✅' : '❌'}`);

    const overallScore = [
      p95 < targets.p95ResponseTime,
      errorRate < targets.errorRate,
      throughput > targets.throughput
    ].filter(Boolean).length;

    console.log(`\nOverall Score: ${overallScore}/3 ${overallScore === 3 ? '🏆 EXCELLENT' : overallScore === 2 ? '👍 GOOD' : '⚠️  NEEDS IMPROVEMENT'}`);
  }

  /**
   * Generate scaling recommendations based on results
   */
  generateScalingRecommendations(responseTimes, duration) {
    const p95 = this.calculatePercentile(responseTimes, 95);
    const throughput = this.results.requests / duration;
    const errorRate = (this.results.errors / this.results.requests) * 100;

    if (p95 > 100) {
      console.log('🔧 Response times high - Consider:');
      console.log('   • Database query optimization');
      console.log('   • Add caching layer (Redis)');
      console.log('   • Database connection pooling');
    }

    if (errorRate > 2) {
      console.log('🚨 High error rate - Consider:');
      console.log('   • Increase server capacity');
      console.log('   • Implement circuit breakers');
      console.log('   • Add retry mechanisms');
    }

    if (throughput < 500) {
      console.log('📈 Low throughput - Consider:');
      console.log('   • Horizontal scaling (multiple instances)');
      console.log('   • Load balancer configuration');
      console.log('   • Async processing for heavy operations');
    }

    if (p95 < 50 && errorRate < 1 && throughput > 1000) {
      console.log('🎉 READY FOR 10X SCALING!');
      console.log('   • Performance targets met');
      console.log('   • Consider implementing:');
      console.log('     - Read replicas for geographic distribution');
      console.log('     - CDN for static assets');
      console.log('     - Advanced monitoring and alerting');
    }
  }

  /**
   * Calculate average of array
   */
  calculateAverage(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Calculate percentile of sorted array
   */
  calculatePercentile(sortedArr, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)];
  }
}

// Command line interface
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    console.log('Care Collective Load Testing Suite');
    console.log('Usage: node scripts/performance-load-test.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --concurrent=N    Number of concurrent users (default: 100)');
    console.log('  --duration=N      Test duration in seconds (default: 60)');
    console.log('  --target=URL      Target URL (default: http://localhost:3000)');
    console.log('  --scenario=NAME   Test scenario (dashboard|contact-exchange|messages|all)');
    console.log('  --help           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/performance-load-test.js --concurrent=50 --duration=30');
    console.log('  node scripts/performance-load-test.js --scenario=dashboard --target=https://staging.carecollective.com');
    process.exit(0);
  }

  const tester = new CareCollectiveLoadTester(options);
  
  tester.runLoadTest().catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}

module.exports = CareCollectiveLoadTester;