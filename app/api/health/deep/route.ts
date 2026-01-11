import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders } from '@/lib/security/middleware'

// Force dynamic rendering since this API uses authentication
export const dynamic = 'force-dynamic'

interface DeepHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database_connectivity: HealthCheckResult
    database_performance: HealthCheckResult
    authentication: HealthCheckResult
    critical_tables: HealthCheckResult
  }
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  response_time_ms?: number
  message?: string
  last_checked: string
}

async function checkDatabaseConnectivity(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Test basic connectivity
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - start
    
    if (error) {
      Logger.getInstance().error('Database connectivity check failed', error)
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        message: 'Database connection failed',
        last_checked: new Date().toISOString()
      }
    }
    
    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'Database connection successful',
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    Logger.getInstance().error('Database connectivity check error', error as Error)
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Database connection error',
      last_checked: new Date().toISOString()
    }
  }
}

async function checkDatabasePerformance(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const supabase = await createClient()

    // Test multiple queries to check performance (minimal data transfer)
    const queries = [
      supabase.from('profiles').select('id').limit(1),
      supabase.from('help_requests').select('id').limit(1),
      supabase.from('request_responses').select('id').limit(1)
    ]

    await Promise.all(queries)

    const responseTime = Date.now() - start

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    let message = 'Database performance normal'

    if (responseTime > 3000) {
      status = 'unhealthy'
      message = 'Database performance critical'
    } else if (responseTime > 1500) {
      status = 'degraded'
      message = 'Database performance slow'
    }

    return {
      status,
      response_time_ms: responseTime,
      message,
      last_checked: new Date().toISOString()
    }

  } catch (error) {
    Logger.getInstance().error('Database performance check failed', error as Error)
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Database performance test failed',
      last_checked: new Date().toISOString()
    }
  }
}

async function checkAuthentication(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const supabase = await createClient()

    // Test auth service is responding
    const { error } = await supabase.auth.getSession()

    const responseTime = Date.now() - start

    if (error) {
      Logger.getInstance().error('Authentication check failed', error)
      return {
        status: 'degraded',
        response_time_ms: responseTime,
        message: 'Authentication service error',
        last_checked: new Date().toISOString()
      }
    }

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'Authentication service responsive',
      last_checked: new Date().toISOString()
    }

  } catch (error) {
    Logger.getInstance().error('Authentication check error', error as Error)
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Authentication service unavailable',
      last_checked: new Date().toISOString()
    }
  }
}

async function checkCriticalTables(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const supabase = await createClient()

    // Check critical tables exist and are accessible (names kept internal)
    const criticalTables = ['profiles', 'help_requests', 'request_responses']
    let accessibleCount = 0
    let inaccessibleCount = 0

    for (const table of criticalTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1)

        if (!error) {
          accessibleCount++
        } else {
          inaccessibleCount++
          Logger.getInstance().error(`Critical table check failed for table`, error)
        }
      } catch (err) {
        inaccessibleCount++
        Logger.getInstance().error(`Critical table check error`, err as Error)
      }
    }

    const responseTime = Date.now() - start

    if (inaccessibleCount > 0) {
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        message: `${inaccessibleCount} critical table(s) inaccessible`,
        last_checked: new Date().toISOString()
      }
    }

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'All critical tables accessible',
      last_checked: new Date().toISOString()
    }

  } catch (error) {
    Logger.getInstance().error('Critical table check failed', error as Error)
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Critical table check failed',
      last_checked: new Date().toISOString()
    }
  }
}

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await apiRateLimiter.middleware(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    Logger.getInstance().info('Deep health check requested')

    // Run all deep health checks
    const [
      databaseConnectivity,
      databasePerformance,
      authentication,
      criticalTables
    ] = await Promise.all([
      checkDatabaseConnectivity(),
      checkDatabasePerformance(),
      checkAuthentication(),
      checkCriticalTables()
    ])

    // Determine overall status
    const allChecks = [databaseConnectivity, databasePerformance, authentication, criticalTables]
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy')
    const hasDegraded = allChecks.some(check => check.status === 'degraded')

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthData: DeepHealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database_connectivity: databaseConnectivity,
        database_performance: databasePerformance,
        authentication,
        critical_tables: criticalTables
      }
    }

    // Log degraded/unhealthy states
    if (overallStatus !== 'healthy') {
      Logger.getInstance().warn(`Deep health check status: ${overallStatus}`, { healthData })
    }

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503

    const response = NextResponse.json(healthData, { status: httpStatus })

    // Add security headers
    addSecurityHeaders(response)

    return response

  } catch (error) {
    Logger.getInstance().error('Deep health check failed', error as Error)

    const response = NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure'
    }, { status: 503 })

    addSecurityHeaders(response)

    return response
  }
}