import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-error'
import { apiRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders } from '@/lib/security/middleware'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  service: string
  version: string
  uptime: number
  checks: {
    database: HealthCheckResult
    memory: HealthCheckResult
    environment: HealthCheckResult
  }
  metadata?: {
    node_version: string
    platform: string
    memory_usage: NodeJS.MemoryUsage
  }
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  response_time_ms?: number
  message?: string
  last_checked: string
}

const startTime = Date.now()

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - start
    
    if (error) {
      logger.error('Database health check failed', error)
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        message: 'Database query failed',
        last_checked: new Date().toISOString()
      }
    }
    
    // Check response time thresholds
    const status = responseTime > 1000 ? 'degraded' : 'healthy'
    
    return {
      status,
      response_time_ms: responseTime,
      message: status === 'degraded' ? 'Slow database response' : 'Database responsive',
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    logger.error('Database health check error', error as Error)
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      message: 'Database connection failed',
      last_checked: new Date().toISOString()
    }
  }
}

function checkMemory(): HealthCheckResult {
  try {
    const memoryUsage = process.memoryUsage()
    const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024
    const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024
    const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    let message = 'Memory usage normal'
    
    if (memoryUsagePercent > 90) {
      status = 'unhealthy'
      message = `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`
    } else if (memoryUsagePercent > 75) {
      status = 'degraded'
      message = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`
    }
    
    return {
      status,
      message,
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    logger.error('Memory health check error', error as Error)
    return {
      status: 'unhealthy',
      message: 'Failed to check memory usage',
      last_checked: new Date().toISOString()
    }
  }
}

function checkEnvironment(): HealthCheckResult {
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return {
        status: 'unhealthy',
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        last_checked: new Date().toISOString()
      }
    }
    
    return {
      status: 'healthy',
      message: 'All required environment variables present',
      last_checked: new Date().toISOString()
    }
    
  } catch (error) {
    logger.error('Environment health check error', error as Error)
    return {
      status: 'unhealthy',
      message: 'Failed to check environment configuration',
      last_checked: new Date().toISOString()
    }
  }
}

export async function GET(request: NextRequest) {
  // Apply rate limiting (more lenient for health checks)
  const rateLimitResponse = await apiRateLimiter.middleware(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    logger.info('Health check requested')
    
    // Run all health checks
    const [databaseCheck, memoryCheck, environmentCheck] = await Promise.all([
      checkDatabase(),
      checkMemory(),
      Promise.resolve(checkEnvironment())
    ])
    
    // Determine overall status
    const allChecks = [databaseCheck, memoryCheck, environmentCheck]
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
    
    const healthData: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'care-collective-preview',
      version: '1.0.0-preview',
      uptime: Date.now() - startTime,
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        environment: environmentCheck
      },
      metadata: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage()
      }
    }
    
    // Log degraded/unhealthy states
    if (overallStatus !== 'healthy') {
      logger.warn(`Health check status: ${overallStatus}`, { healthData })
    }
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    const response = NextResponse.json(healthData, { status: httpStatus })
    
    // Add security headers
    addSecurityHeaders(response)
    
    return response
    
  } catch (error) {
    logger.error('Health check failed', error as Error)
    
    const response = NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'care-collective-preview',
      version: '1.0.0-preview',
      uptime: Date.now() - startTime,
      error: 'Health check system failure'
    }, { status: 503 })

    // Add security headers even for error responses
    addSecurityHeaders(response)
    
    return response
  }
}