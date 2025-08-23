import { initializeEnvironment } from './env-validation'

/**
 * Initialize all security measures for the application
 * Call this early in the application startup process
 */
export function initializeSecurity(): void {
  console.log('🔒 Initializing security measures...')
  
  try {
    // Validate environment variables
    initializeEnvironment()
    
    // Check Node.js version for security
    checkNodeVersion()
    
    // Validate security dependencies
    validateSecurityDependencies()
    
    // Initialize security monitoring
    initializeSecurityMonitoring()
    
    console.log('✅ Security initialization complete')
  } catch (error) {
    console.error('❌ Security initialization failed:', error)
    process.exit(1)
  }
}

/**
 * Check Node.js version for known vulnerabilities
 */
function checkNodeVersion(): void {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  // Check for minimum supported version
  if (majorVersion < 18) {
    throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or later.`)
  }
  
  // Warn about LTS versions
  if (majorVersion % 2 !== 0) {
    console.warn(`⚠️ Using non-LTS Node.js version ${nodeVersion}. Consider using an LTS version for production.`)
  }
  
  console.log(`✅ Node.js version ${nodeVersion} is acceptable`)
}

/**
 * Validate that required security dependencies are installed
 */
function validateSecurityDependencies(): void {
  const requiredDeps = [
    'zod',
    'validator',
    'dompurify',
    '@supabase/ssr',
  ]
  
  const missingDeps: string[] = []
  
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep)
    } catch {
      missingDeps.push(dep)
    }
  }
  
  if (missingDeps.length > 0) {
    throw new Error(`Missing required security dependencies: ${missingDeps.join(', ')}`)
  }
  
  console.log('✅ All security dependencies are installed')
}

/**
 * Initialize security monitoring and logging
 */
function initializeSecurityMonitoring(): void {
  // Set up process event handlers for security monitoring
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught exception:', error)
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service (e.g., Sentry)
    }
    process.exit(1)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled promise rejection:', reason)
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service
    }
  })
  
  // Monitor memory usage
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const memoryUsage = process.memoryUsage()
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
      
      if (heapUsedMB > 500) { // 500MB threshold
        console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB`)
      }
    }, 60000) // Check every minute
  }
  
  console.log('✅ Security monitoring initialized')
}

/**
 * Security health check
 */
export function performSecurityHealthCheck(): {
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string }>
} {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string }> = []
  
  // Check environment variables
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.push({ name: 'Supabase URL', status: 'fail', message: 'NEXT_PUBLIC_SUPABASE_URL not set' })
    } else {
      checks.push({ name: 'Supabase URL', status: 'pass', message: 'Environment variable set' })
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.push({ name: 'Supabase Anon Key', status: 'fail', message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set' })
    } else {
      checks.push({ name: 'Supabase Anon Key', status: 'pass', message: 'Environment variable set' })
    }
  } catch {
    checks.push({ name: 'Environment', status: 'fail', message: 'Failed to check environment variables' })
  }
  
  // Check Node.js version
  try {
    const majorVersion = parseInt(process.version.slice(1).split('.')[0])
    if (majorVersion >= 18) {
      checks.push({ name: 'Node.js Version', status: 'pass', message: `Version ${process.version} is supported` })
    } else {
      checks.push({ name: 'Node.js Version', status: 'fail', message: `Version ${process.version} is too old` })
    }
  } catch {
    checks.push({ name: 'Node.js Version', status: 'fail', message: 'Failed to check Node.js version' })
  }
  
  // Check memory usage
  try {
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    
    if (heapUsedMB < 300) {
      checks.push({ name: 'Memory Usage', status: 'pass', message: `${heapUsedMB.toFixed(2)}MB used` })
    } else if (heapUsedMB < 500) {
      checks.push({ name: 'Memory Usage', status: 'warn', message: `${heapUsedMB.toFixed(2)}MB used (high)` })
    } else {
      checks.push({ name: 'Memory Usage', status: 'fail', message: `${heapUsedMB.toFixed(2)}MB used (critical)` })
    }
  } catch {
    checks.push({ name: 'Memory Usage', status: 'fail', message: 'Failed to check memory usage' })
  }
  
  // Determine overall status
  const hasErrors = checks.some(check => check.status === 'fail')
  const hasWarnings = checks.some(check => check.status === 'warn')
  
  let status: 'healthy' | 'warning' | 'error'
  if (hasErrors) {
    status = 'error'
  } else if (hasWarnings) {
    status = 'warning'
  } else {
    status = 'healthy'
  }
  
  return { status, checks }
}

/**
 * Export security configuration summary
 */
export function getSecurityConfiguration(): Record<string, any> {
  return {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    platform: process.platform,
    securityFeatures: {
      environmentValidation: true,
      rateLimiting: true,
      inputValidation: true,
      sqlInjectionPrevention: true,
      xssProtection: true,
      csrfProtection: true,
      secureHeaders: true,
      contentSecurityPolicy: true,
    },
    dependencies: {
      zod: getPackageVersion('zod'),
      validator: getPackageVersion('validator'),
      dompurify: getPackageVersion('dompurify'),
      next: getPackageVersion('next'),
    },
  }
}

/**
 * Get package version safely
 */
function getPackageVersion(packageName: string): string {
  try {
    const pkg = require(`${packageName}/package.json`)
    return pkg.version
  } catch {
    return 'unknown'
  }
}