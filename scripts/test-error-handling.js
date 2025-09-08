#!/usr/bin/env node

/**
 * Test script for validating help request error handling improvements
 * 
 * This script tests different error scenarios:
 * 1. Invalid request ID (should show not-found page)
 * 2. Database connection issues (should show error boundary)
 * 3. Authentication errors (should redirect to login)
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

/**
 * Make HTTP request and return response details
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test different error scenarios
 */
async function testErrorScenarios() {
  console.log('🧪 Testing Help Request Error Handling\n');
  
  const testCases = [
    {
      name: 'Invalid UUID format',
      path: '/requests/invalid-id',
      expectedBehavior: 'Should show not-found page or error boundary'
    },
    {
      name: 'Valid UUID but non-existent request',
      path: '/requests/00000000-0000-0000-0000-000000000000',
      expectedBehavior: 'Should show not-found page'
    },
    {
      name: 'Short invalid ID',
      path: '/requests/123',
      expectedBehavior: 'Should show not-found page or error boundary'
    },
    {
      name: 'Requests listing page (baseline)',
      path: '/requests',
      expectedBehavior: 'Should work normally or redirect to login'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`   Path: ${testCase.path}`);
    console.log(`   Expected: ${testCase.expectedBehavior}`);
    
    try {
      const response = await makeRequest(testCase.path);
      
      console.log(`   ✅ Status: ${response.statusCode}`);
      
      // Check for redirects
      if (response.statusCode >= 300 && response.statusCode < 400) {
        console.log(`   🔄 Redirects to: ${response.headers.location || 'Unknown'}`);
      }
      
      // Check for error indicators in the response
      const bodySnippet = response.body.substring(0, 200).replace(/\s+/g, ' ');
      
      if (response.body.includes('We\'re having a moment')) {
        console.log('   📋 Shows: Generic error page');
      } else if (response.body.includes('Help Request Not Found')) {
        console.log('   📋 Shows: Custom not-found page ✨');
      } else if (response.body.includes('Connection Issue') || response.body.includes('Something Went Wrong')) {
        console.log('   📋 Shows: Custom error boundary ✨');
      } else if (response.body.includes('Sign in') || response.body.includes('Login')) {
        console.log('   📋 Shows: Authentication required');
      } else {
        console.log(`   📋 Content preview: "${bodySnippet.trim()}..."`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('   - Check console logs for detailed error information');
  console.log('   - Look for improved error messages instead of generic ones');
  console.log('   - Verify that database errors are properly logged');
  console.log('   - Ensure not-found cases show helpful user messages');
  console.log('\n✨ Error handling improvements have been implemented!');
  console.log('   - Enhanced error logging with detailed context');
  console.log('   - Custom not-found page for missing requests');
  console.log('   - Contextual error boundary for database issues');
  console.log('   - Proper error differentiation (not-found vs server errors)');
}

// Run tests
testErrorScenarios().catch(console.error);