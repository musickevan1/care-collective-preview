import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

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
  details?: any
  last_checked: string
}

async function checkDatabaseConnectivity(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - start
    
    if (error) {
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        message: 'Database connection failed',
        details: { error: error.message },
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
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Database connection error',
      details: { error: (error as Error).message },
      last_checked: new Date().toISOString()
    }
  }
}

async function checkDatabasePerformance(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test multiple queries to check performance
    const queries = [
      supabase.from('profiles').select('id').limit(10),
      supabase.from('help_requests').select('id').limit(10),
      supabase.from('request_responses').select('id').limit(10)
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
      details: { queries_tested: queries.length },
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Database performance test failed',
      details: { error: (error as Error).message },
      last_checked: new Date().toISOString()
    }
  }
}

async function checkAuthentication(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test auth service is responding
    const { data: { session }, error } = await supabase.auth.getSession()
    
    const responseTime = Date.now() - start
    
    if (error) {
      return {
        status: 'degraded',
        response_time_ms: responseTime,
        message: 'Authentication service error',
        details: { error: error.message },
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
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Authentication service unavailable',
      details: { error: (error as Error).message },
      last_checked: new Date().toISOString()
    }
  }
}

async function checkCriticalTables(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = createClient()
    
    // Check critical tables exist and are accessible
    const criticalTables = ['profiles', 'help_requests', 'request_responses']
    const tableChecks = []
    
    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        tableChecks.push({
          table,
          accessible: !error,
          error: error?.message
        })
      } catch (err) {
        tableChecks.push({
          table,
          accessible: false,
          error: (err as Error).message
        })
      }
    }
    
    const responseTime = Date.now() - start
    const inaccessibleTables = tableChecks.filter(check => !check.accessible)
    
    if (inaccessibleTables.length > 0) {
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        message: `Critical tables inaccessible: ${inaccessibleTables.map(t => t.table).join(', ')}`,
        details: { table_checks: tableChecks },
        last_checked: new Date().toISOString()
      }
    }
    
    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'All critical tables accessible',
      details: { tables_checked: criticalTables.length },
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Critical table check failed',
      details: { error: (error as Error).message },
      last_checked: new Date().toISOString()
    }
  }
}

export async function GET() {
  try {
    logger.info('Deep health check requested')
    
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
      logger.warn(`Deep health check status: ${overallStatus}`, { healthData })
    }
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthData, { status: httpStatus })
    
  } catch (error) {
    logger.error('Deep health check failed', error as Error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Deep health check system failure',
      message: (error as Error).message
    }, { status: 503 })
  }
}