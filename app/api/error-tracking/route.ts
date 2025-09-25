/**
 * @fileoverview Error Tracking API Endpoint
 * Receives error tracking data for Care Collective platform
 * This is a fallback endpoint when external services like Sentry are not configured
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { careCollectiveErrorConfig } from '@/lib/config/error-tracking'

interface ErrorTrackingEvent {
  id: string
  timestamp: string
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  context: {
    userId?: string
    sessionId?: string
    userAgent?: string
    url?: string
    component?: string
    action?: string
    severity?: string
    tags?: Record<string, string>
    extra?: Record<string, any>
  }
  fingerprint?: string
  handled: boolean
}

interface ErrorTrackingPayload {
  events: ErrorTrackingEvent[]
}

/**
 * POST /api/error-tracking
 * Receive and process error tracking events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify error tracking is enabled
    if (!careCollectiveErrorConfig.isEnabled()) {
      return NextResponse.json(
        { error: 'Error tracking is not enabled' },
        { status: 503 }
      )
    }

    const body: ErrorTrackingPayload = await request.json()

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events array required' },
        { status: 400 }
      )
    }

    // Process each error event
    const processedEvents = []

    for (const event of body.events) {
      try {
        // Sanitize context to protect user privacy
        const sanitizedContext = careCollectiveErrorConfig.sanitizeContext(event.context)

        // Log the error event
        if (event.level === 'error') {
          logger.error(`Error tracking: ${event.message}`, new Error(event.message), {
            errorId: event.id,
            fingerprint: event.fingerprint,
            handled: event.handled,
            component: event.context.component,
            action: event.context.action,
            severity: event.context.severity,
            category: 'error_tracking',
            sanitizedContext
          })
        } else if (event.level === 'warning') {
          logger.warn(`Warning tracking: ${event.message}`, {
            errorId: event.id,
            fingerprint: event.fingerprint,
            component: event.context.component,
            action: event.context.action,
            category: 'error_tracking',
            sanitizedContext
          })
        } else {
          logger.info(`Info tracking: ${event.message}`, {
            errorId: event.id,
            component: event.context.component,
            action: event.context.action,
            category: 'error_tracking',
            sanitizedContext
          })
        }

        processedEvents.push({
          id: event.id,
          processed: true,
          timestamp: new Date().toISOString()
        })

        // In a real implementation, you would:
        // 1. Store in a database for analysis
        // 2. Send alerts for critical errors
        // 3. Aggregate for monitoring dashboards
        // 4. Forward to external services if needed

      } catch (processingError) {
        logger.error('Failed to process error tracking event', processingError as Error, {
          eventId: event.id,
          category: 'error_tracking_processing'
        })

        processedEvents.push({
          id: event.id,
          processed: false,
          error: 'Processing failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      events: processedEvents
    })

  } catch (error) {
    logger.error('Error tracking endpoint failed', error as Error, {
      endpoint: '/api/error-tracking',
      method: 'POST',
      category: 'api_error'
    })

    return NextResponse.json(
      { error: 'Failed to process error tracking data' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/error-tracking
 * Health check for error tracking endpoint
 */
export async function GET() {
  const serviceConfig = careCollectiveErrorConfig.getServiceConfig()

  return NextResponse.json({
    status: 'operational',
    service: serviceConfig.type,
    enabled: careCollectiveErrorConfig.isEnabled(),
    platform: careCollectiveErrorConfig.platform,
    version: careCollectiveErrorConfig.version,
    environment: careCollectiveErrorConfig.defaultTags.environment
  })
}