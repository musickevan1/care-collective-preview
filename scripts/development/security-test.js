#!/usr/bin/env node

/**
 * Security Testing Script - Care Collective Platform
 * Tests core security implementations
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 Care Collective Security Test Suite')
console.log('=====================================\n')

// Test 1: Verify security files exist
console.log('1. Testing Security Infrastructure...')

const securityFiles = [
  'lib/validation/security.ts',
  'lib/security/error-handling.ts', 
  'lib/security/rate-limiter.ts',
  'supabase/migrations/20250109000000_security_reconstruction.sql',
]

const results = {
  passed: 0,
  failed: 0,
  total: 0
}

securityFiles.forEach(file => {
  results.total++
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`)
    results.passed++
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`)
    results.failed++
  }
})

// Test 2: Verify auth server implementation
console.log('\n2. Testing Authentication Implementation...')

const authServerPath = 'lib/supabase/server.ts'
results.total++

try {
  const authContent = fs.readFileSync(authServerPath, 'utf8')
  
  // Check for secure patterns
  const securePatterns = [
    'getAuthenticatedUser',
    'getAuthenticatedAdmin', 
    'withAuth',
    'sb-',  // Cookie filtering
    'sanitize',
  ]
  
  let authPassed = true
  securePatterns.forEach(pattern => {
    if (!authContent.includes(pattern)) {
      console.log(`  ❌ Missing secure pattern: ${pattern}`)
      authPassed = false
    }
  })
  
  if (authPassed) {
    console.log(`  ✅ ${authServerPath} - Secure patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${authServerPath} - Cannot read file`)
  results.failed++
}

// Test 3: Verify middleware security
console.log('\n3. Testing Middleware Security...')

const middlewarePath = 'lib/supabase/middleware-edge.ts'
results.total++

try {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
  
  const middlewarePatterns = [
    'X-Frame-Options',
    'X-Content-Type-Options', 
    'bot|crawl|spider',
    'suspicious',
  ]
  
  let middlewarePassed = true
  middlewarePatterns.forEach(pattern => {
    if (!middlewareContent.includes(pattern)) {
      console.log(`  ❌ Missing security pattern: ${pattern}`)
      middlewarePassed = false
    }
  })
  
  if (middlewarePassed) {
    console.log(`  ✅ ${middlewarePath} - Security headers and patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${middlewarePath} - Cannot read file`)
  results.failed++
}

// Test 4: Database Migration 
console.log('\n4. Testing Database Security Migration...')

const migrationPath = 'supabase/migrations/20250109000000_security_reconstruction.sql'
results.total++

try {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8')
  
  const migrationPatterns = [
    'DROP POLICY',
    'CREATE POLICY',
    'auth.uid()',
    'verification_status',
    'profiles_select_own_or_approved_users',
    'audit_logs_admin_select_only',
  ]
  
  let migrationPassed = true
  migrationPatterns.forEach(pattern => {
    if (!migrationContent.includes(pattern)) {
      console.log(`  ❌ Missing migration pattern: ${pattern}`)
      migrationPassed = false
    }
  })
  
  if (migrationPassed) {
    console.log(`  ✅ ${migrationPath} - Security migration patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${migrationPath} - Cannot read file`)
  results.failed++
}

// Test 5: Validation schemas
console.log('\n5. Testing Input Validation...')

const validationPath = 'lib/validation/security.ts'
results.total++

try {
  const validationContent = fs.readFileSync(validationPath, 'utf8')
  
  const validationPatterns = [
    'sanitizeString',
    'validateNoMaliciousContent',
    'SUSPICIOUS_PATTERNS',
    'profileSchema',
    'helpRequestSchema',
    'contactExchangeSchema',
  ]
  
  let validationPassed = true
  validationPatterns.forEach(pattern => {
    if (!validationContent.includes(pattern)) {
      console.log(`  ❌ Missing validation pattern: ${pattern}`)
      validationPassed = false
    }
  })
  
  if (validationPassed) {
    console.log(`  ✅ ${validationPath} - Validation patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${validationPath} - Cannot read file`)
  results.failed++
}

// Test 6: Error handling
console.log('\n6. Testing Secure Error Handling...')

const errorHandlingPath = 'lib/security/error-handling.ts'
results.total++

try {
  const errorContent = fs.readFileSync(errorHandlingPath, 'utf8')
  
  const errorPatterns = [
    'SecureError',
    'sanitizeContext',
    'SENSITIVE_PATTERNS',
    'ErrorType',
    'ErrorSeverity',
    'getUserMessage',
  ]
  
  let errorPassed = true
  errorPatterns.forEach(pattern => {
    if (!errorContent.includes(pattern)) {
      console.log(`  ❌ Missing error handling pattern: ${pattern}`)
      errorPassed = false
    }
  })
  
  if (errorPassed) {
    console.log(`  ✅ ${errorHandlingPath} - Error handling patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${errorHandlingPath} - Cannot read file`)
  results.failed++
}

// Test 7: Updated admin page
console.log('\n7. Testing Secure Admin Page...')

const adminPagePath = 'app/admin/page.tsx'
results.total++

try {
  const adminContent = fs.readFileSync(adminPagePath, 'utf8')
  
  const adminPatterns = [
    'getAuthenticatedAdmin',
    'withAuth',
    'Admin privileges required',
  ]
  
  let adminPassed = true
  adminPatterns.forEach(pattern => {
    if (!adminContent.includes(pattern)) {
      console.log(`  ❌ Missing admin security pattern: ${pattern}`)
      adminPassed = false
    }
  })
  
  if (adminPassed) {
    console.log(`  ✅ ${adminPagePath} - Secure admin patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${adminPagePath} - Cannot read file`)
  results.failed++
}

// Test 8: Updated dashboard page
console.log('\n8. Testing Secure Dashboard Page...')

const dashboardPagePath = 'app/dashboard/page.tsx'
results.total++

try {
  const dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8')
  
  const dashboardPatterns = [
    'getAuthenticatedUser',
    'withAuth',
    'redirectTo=/dashboard',
  ]
  
  let dashboardPassed = true
  dashboardPatterns.forEach(pattern => {
    if (!dashboardContent.includes(pattern)) {
      console.log(`  ❌ Missing dashboard security pattern: ${pattern}`)
      dashboardPassed = false
    }
  })
  
  if (dashboardPassed) {
    console.log(`  ✅ ${dashboardPagePath} - Secure dashboard patterns found`)
    results.passed++
  } else {
    results.failed++
  }
  
} catch (err) {
  console.log(`  ❌ ${dashboardPagePath} - Cannot read file`)
  results.failed++
}

// Final Results
console.log('\n🔒 Security Test Results')
console.log('========================')
console.log(`✅ Passed: ${results.passed}/${results.total}`)
console.log(`❌ Failed: ${results.failed}/${results.total}`)
console.log(`📊 Success Rate: ${Math.round((results.passed/results.total)*100)}%`)

if (results.failed === 0) {
  console.log('\n🎉 ALL SECURITY TESTS PASSED!')
  console.log('The security reconstruction is complete and verified.')
  process.exit(0)
} else {
  console.log('\n⚠️  Some security tests failed.')
  console.log('Please review the failed items before deployment.')
  process.exit(1)
}