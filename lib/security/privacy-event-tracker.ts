/**
 * @fileoverview Privacy and Security Event Tracker
 *
 * Specialized error tracking and monitoring for privacy-related events in the Care Collective platform.
 * Integrates with the existing error tracking system to provide detailed security monitoring.
 *
 * Features:
 * - Privacy violation detection and alerting
 * - Contact exchange security monitoring
 * - Encryption failure tracking
 * - GDPR compliance event logging
 * - Suspicious activity pattern detection
 * - Admin security dashboards
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { captureError, captureWarning, captureInfo, addBreadcrumb, setTag } from '@/lib/error-tracking';
import { careCollectiveErrorConfig } from '@/lib/config/error-tracking';

// Privacy event types
export const privacyEventTypes = {
  // Contact exchange events
  CONTACT_EXCHANGE_STARTED: 'CONTACT_EXCHANGE_STARTED',
  CONTACT_EXCHANGE_COMPLETED: 'CONTACT_EXCHANGE_COMPLETED',
  CONTACT_EXCHANGE_FAILED: 'CONTACT_EXCHANGE_FAILED',
  CONTACT_EXCHANGE_REVOKED: 'CONTACT_EXCHANGE_REVOKED',

  // Encryption events
  ENCRYPTION_SUCCESS: 'ENCRYPTION_SUCCESS',
  ENCRYPTION_FAILURE: 'ENCRYPTION_FAILURE',
  DECRYPTION_SUCCESS: 'DECRYPTION_SUCCESS',
  DECRYPTION_FAILURE: 'DECRYPTION_FAILURE',

  // Privacy violations
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_CONTACT_PATTERN: 'SUSPICIOUS_CONTACT_PATTERN',
  INAPPROPRIATE_MESSAGE_CONTENT: 'INAPPROPRIATE_MESSAGE_CONTENT',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // GDPR compliance
  GDPR_CONSENT_GIVEN: 'GDPR_CONSENT_GIVEN',
  GDPR_CONSENT_WITHDRAWN: 'GDPR_CONSENT_WITHDRAWN',
  DATA_EXPORT_REQUESTED: 'DATA_EXPORT_REQUESTED',
  DATA_DELETION_REQUESTED: 'DATA_DELETION_REQUESTED',
  DATA_RETENTION_EXPIRED: 'DATA_RETENTION_EXPIRED',

  // Privacy settings
  PRIVACY_SETTINGS_CHANGED: 'PRIVACY_SETTINGS_CHANGED',
  EMERGENCY_OVERRIDE_APPLIED: 'EMERGENCY_OVERRIDE_APPLIED',

  // Admin actions
  PRIVACY_VIOLATION_REVIEWED: 'PRIVACY_VIOLATION_REVIEWED',
  MANUAL_DATA_DELETION: 'MANUAL_DATA_DELETION',

  // Moderation actions
  MODERATION_ACTION_TAKEN: 'MODERATION_ACTION_TAKEN',
  USER_RESTRICTION_APPLIED: 'USER_RESTRICTION_APPLIED'
} as const;

export type PrivacyEventType = keyof typeof privacyEventTypes;

// Privacy event schema
const privacyEventSchema = z.object({
  event_type: z.enum(Object.keys(privacyEventTypes) as [PrivacyEventType, ...PrivacyEventType[]]),
  user_id: z.string().uuid().optional(),
  affected_user_id: z.string().uuid().optional(),
  help_request_id: z.string().uuid().optional(),
  exchange_id: z.string().uuid().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  // Event details
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),

  // Context
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),

  // Detection info
  detected_by: z.enum(['system', 'user_report', 'admin_review', 'automated_scan']).default('system'),
  confidence_score: z.number().min(0).max(1).optional(),

  // Response info
  auto_response_taken: z.boolean().default(false),
  requires_admin_review: z.boolean().default(false)
});

export type PrivacyEvent = z.infer<typeof privacyEventSchema>;

// Pattern detection for suspicious activity
interface SuspiciousPattern {
  name: string;
  description: string;
  detect: (events: PrivacyEvent[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResponse?: (event: PrivacyEvent) => Promise<void>;
}

/**
 * Privacy Event Tracker Class
 */
export class PrivacyEventTracker {
  private static instance: PrivacyEventTracker | null = null;
  private suspiciousPatterns: SuspiciousPattern[] = [];

  // Lazy-load Supabase client to avoid calling cookies() at module load time
  private async getClient() {
    return await createClient();
  }

  private constructor() {
    this.initializeSuspiciousPatterns();
    this.setupEventTags();
  }

  public static getInstance(): PrivacyEventTracker {
    if (!PrivacyEventTracker.instance) {
      PrivacyEventTracker.instance = new PrivacyEventTracker();
    }
    return PrivacyEventTracker.instance;
  }

  /**
   * Track a privacy or security event
   */
  async trackPrivacyEvent(eventData: Partial<PrivacyEvent>): Promise<string> {
    try {
      // Validate event data
      const validatedEvent = privacyEventSchema.parse({
        ...eventData,
        detected_by: eventData.detected_by || 'system'
      });

      // Generate unique event ID
      const eventId = crypto.getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

      // Add breadcrumb for debugging
      addBreadcrumb({
        message: `Privacy event: ${validatedEvent.event_type}`,
        category: 'privacy_security',
        level: validatedEvent.severity === 'critical' ? 'error' :
               validatedEvent.severity === 'high' ? 'warning' : 'info',
        data: {
          eventId,
          eventType: validatedEvent.event_type,
          userId: validatedEvent.user_id
        }
      });

      // Determine if this should create a privacy violation alert
      const shouldCreateAlert = this.shouldCreateAlert(validatedEvent);
      let alertId: string | null = null;

      if (shouldCreateAlert) {
        alertId = await this.createPrivacyViolationAlert(validatedEvent);
      }

      const supabase = await this.getClient();

      // Store event in audit trail
      const { error: auditError } = await supabase
        .from('contact_exchange_audit')
        .insert({
          action: validatedEvent.event_type,
          request_id: validatedEvent.help_request_id,
          helper_id: validatedEvent.user_id,
          requester_id: validatedEvent.affected_user_id,
          timestamp: new Date().toISOString(),
          metadata: {
            ...validatedEvent.metadata,
            event_id: eventId,
            severity: validatedEvent.severity,
            detected_by: validatedEvent.detected_by,
            alert_created: !!alertId,
            alert_id: alertId
          },
          ip_address: validatedEvent.ip_address,
          user_agent: validatedEvent.user_agent,
          session_id: validatedEvent.session_id
        });

      if (auditError) {
        captureWarning('Failed to store privacy event in audit trail', {
          component: 'PrivacyEventTracker',
          extra: {
            eventId,
            error: auditError.message
          }
        });
      }

      // Send to main error tracking system based on severity
      if (validatedEvent.severity === 'critical') {
        captureError(new Error(`Critical privacy event: ${validatedEvent.description}`), {
          component: 'PrivacyEventTracker',
          action: validatedEvent.event_type,
          userId: validatedEvent.user_id,
          severity: 'critical',
          tags: {
            event_type: validatedEvent.event_type,
            privacy_event: 'true',
            requires_review: validatedEvent.requires_admin_review.toString()
          },
          extra: validatedEvent.metadata
        });
      } else if (validatedEvent.severity === 'high') {
        captureWarning(`High severity privacy event: ${validatedEvent.description}`, {
          component: 'PrivacyEventTracker',
          action: validatedEvent.event_type,
          userId: validatedEvent.user_id,
          severity: 'high',
          tags: {
            event_type: validatedEvent.event_type,
            privacy_event: 'true'
          },
          extra: validatedEvent.metadata
        });
      } else {
        captureInfo(`Privacy event: ${validatedEvent.description}`, {
          component: 'PrivacyEventTracker',
          action: validatedEvent.event_type,
          userId: validatedEvent.user_id,
          tags: {
            event_type: validatedEvent.event_type,
            privacy_event: 'true'
          },
          extra: validatedEvent.metadata
        });
      }

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(validatedEvent);

      // Take automatic response if needed
      if (validatedEvent.auto_response_taken) {
        await this.takeAutomaticResponse(validatedEvent);
      }

      return eventId;

    } catch (error) {
      captureError(error as Error, {
        component: 'PrivacyEventTracker',
        action: 'trackPrivacyEvent',
        severity: 'high'
      });
      throw new Error('Failed to track privacy event');
    }
  }

  /**
   * Track contact exchange events specifically
   */
  async trackContactExchangeEvent(
    eventType: 'started' | 'completed' | 'failed' | 'revoked',
    exchangeId: string,
    helperId: string,
    requesterId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const eventTypeMap = {
      started: 'CONTACT_EXCHANGE_STARTED',
      completed: 'CONTACT_EXCHANGE_COMPLETED',
      failed: 'CONTACT_EXCHANGE_FAILED',
      revoked: 'CONTACT_EXCHANGE_REVOKED'
    };

    const severity = eventType === 'failed' ? 'high' : 'low';
    const requiresReview = eventType === 'failed';

    await this.trackPrivacyEvent({
      event_type: eventTypeMap[eventType] as PrivacyEventType,
      user_id: helperId,
      affected_user_id: requesterId,
      exchange_id: exchangeId,
      severity,
      description: `Contact exchange ${eventType}`,
      metadata: {
        ...metadata,
        exchange_type: 'mutual_aid_contact'
      },
      requires_admin_review: requiresReview
    });
  }

  /**
   * Track encryption events
   */
  async trackEncryptionEvent(
    eventType: 'success' | 'failure',
    operation: 'encrypt' | 'decrypt',
    userId: string,
    requestId?: string,
    error?: string
  ): Promise<void> {
    const severity = eventType === 'failure' ? 'high' : 'low';
    const eventTypeName = operation === 'encrypt' ?
      (eventType === 'success' ? 'ENCRYPTION_SUCCESS' : 'ENCRYPTION_FAILURE') :
      (eventType === 'success' ? 'DECRYPTION_SUCCESS' : 'DECRYPTION_FAILURE');

    await this.trackPrivacyEvent({
      event_type: eventTypeName as PrivacyEventType,
      user_id: userId,
      help_request_id: requestId,
      severity,
      description: `${operation} ${eventType}`,
      metadata: {
        operation,
        error_message: error,
        encryption_algorithm: 'AES-256-GCM'
      },
      requires_admin_review: eventType === 'failure'
    });
  }

  /**
   * Track GDPR compliance events
   */
  async trackGDPREvent(
    eventType: 'consent_given' | 'consent_withdrawn' | 'data_export' | 'data_deletion',
    userId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const eventTypeMap = {
      consent_given: 'GDPR_CONSENT_GIVEN',
      consent_withdrawn: 'GDPR_CONSENT_WITHDRAWN',
      data_export: 'DATA_EXPORT_REQUESTED',
      data_deletion: 'DATA_DELETION_REQUESTED'
    };

    await this.trackPrivacyEvent({
      event_type: eventTypeMap[eventType] as PrivacyEventType,
      user_id: userId,
      severity: 'medium',
      description: `GDPR ${eventType.replace('_', ' ')}`,
      metadata: {
        ...details,
        gdpr_compliance: true
      },
      requires_admin_review: eventType === 'data_deletion'
    });
  }

  /**
   * Get privacy events for a user
   */
  async getUserPrivacyEvents(
    userId: string,
    options?: {
      limit?: number;
      severity?: string;
      event_type?: string;
    }
  ) {
    try {
      const supabase = await this.getClient();
      let query = supabase
        .from('contact_exchange_audit')
        .select('*')
        .or(`helper_id.eq.${userId},requester_id.eq.${userId}`)
        .order('timestamp', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.event_type) {
        query = query.eq('action', options.event_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by severity if specified
      let filteredData = data || [];
      if (options?.severity) {
        filteredData = filteredData.filter(event =>
          event.metadata?.severity === options.severity
        );
      }

      return filteredData;

    } catch (error) {
      captureError(error as Error, {
        component: 'PrivacyEventTracker',
        action: 'getUserPrivacyEvents',
        userId,
        severity: 'medium'
      });
      return [];
    }
  }

  /**
   * Get system-wide privacy alerts for admins
   */
  async getPrivacyAlerts(options?: {
    severity?: string;
    status?: string;
    limit?: number;
  }) {
    try {
      const supabase = await this.getClient();
      let query = supabase
        .from('privacy_violation_alerts')
        .select('*')
        .order('detected_at', { ascending: false});

      if (options?.severity) {
        query = query.eq('severity', options.severity);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];

    } catch (error) {
      captureError(error as Error, {
        component: 'PrivacyEventTracker',
        action: 'getPrivacyAlerts',
        severity: 'medium'
      });
      return [];
    }
  }

  /**
   * Initialize suspicious pattern detection
   */
  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      {
        name: 'Rapid Contact Requests',
        description: 'User making too many contact exchange requests in short time',
        severity: 'high',
        detect: (events) => {
          const recentExchanges = events.filter(e =>
            e.event_type === 'CONTACT_EXCHANGE_STARTED' &&
            new Date(Number(e.metadata?.timestamp) || Date.now()).getTime() > Date.now() - 60 * 60 * 1000
          );
          return recentExchanges.length > 5; // More than 5 in an hour
        }
      },
      {
        name: 'Multiple Decryption Failures',
        description: 'Multiple decryption failures indicating potential attack',
        severity: 'critical',
        detect: (events) => {
          const recentFailures = events.filter(e =>
            e.event_type === 'DECRYPTION_FAILURE' &&
            new Date(Number(e.metadata?.timestamp) || Date.now()).getTime() > Date.now() - 15 * 60 * 1000
          );
          return recentFailures.length > 3; // More than 3 in 15 minutes
        }
      },
      {
        name: 'Unauthorized Access Pattern',
        description: 'Pattern of unauthorized access attempts',
        severity: 'critical',
        detect: (events) => {
          const unauthorizedAttempts = events.filter(e =>
            e.event_type === 'UNAUTHORIZED_ACCESS_ATTEMPT' &&
            new Date(Number(e.metadata?.timestamp) || Date.now()).getTime() > Date.now() - 30 * 60 * 1000
          );
          return unauthorizedAttempts.length > 2; // More than 2 in 30 minutes
        }
      }
    ];
  }

  /**
   * Setup error tracking tags for privacy events
   */
  private setupEventTags(): void {
    setTag('feature', 'privacy_security');
    setTag('compliance', 'gdpr');
    setTag('encryption', 'aes_256_gcm');
  }

  /**
   * Determine if event should create an alert
   */
  private shouldCreateAlert(event: PrivacyEvent): boolean {
    // Always create alerts for critical events
    if (event.severity === 'critical') return true;

    // Create alerts for high severity events that require review
    if (event.severity === 'high' && event.requires_admin_review) return true;

    // Create alerts for specific event types
    const alertEventTypes: PrivacyEventType[] = [
      'CONTACT_EXCHANGE_FAILED',
      'ENCRYPTION_FAILURE',
      'DECRYPTION_FAILURE',
      'RATE_LIMIT_EXCEEDED',
      'SUSPICIOUS_CONTACT_PATTERN',
      'INAPPROPRIATE_MESSAGE_CONTENT',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'DATA_DELETION_REQUESTED'
    ];

    return alertEventTypes.includes(event.event_type);
  }

  /**
   * Create privacy violation alert
   */
  private async createPrivacyViolationAlert(event: PrivacyEvent): Promise<string | null> {
    try {
      const alertId = crypto.getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

      const supabase = await this.getClient();
      const { error } = await supabase
        .from('privacy_violation_alerts')
        .insert({
          id: alertId,
          alert_type: this.getAlertType(event.event_type),
          severity: event.severity,
          user_id: event.user_id,
          help_request_id: event.help_request_id,
          exchange_id: event.exchange_id,
          description: event.description,
          details: {
            ...event.metadata,
            detected_by: event.detected_by,
            confidence_score: event.confidence_score
          },
          status: 'open',
          detected_at: new Date().toISOString()
        });

      if (error) {
        captureWarning('Failed to create privacy violation alert', {
          component: 'PrivacyEventTracker',
          extra: { error: error.message }
        });
        return null;
      }

      return alertId;

    } catch (error) {
      captureError(error as Error, {
        component: 'PrivacyEventTracker',
        action: 'createPrivacyViolationAlert',
        severity: 'high'
      });
      return null;
    }
  }

  /**
   * Check for suspicious patterns
   */
  private async checkSuspiciousPatterns(currentEvent: PrivacyEvent): Promise<void> {
    if (!currentEvent.user_id) return;

    try {
      // Get recent events for this user
      const recentEvents = await this.getUserPrivacyEvents(currentEvent.user_id, {
        limit: 50
      });

      // Convert audit records to privacy events for pattern matching
      const privacyEvents = recentEvents.map(record => ({
        event_type: record.action as PrivacyEventType,
        user_id: record.helper_id || record.requester_id,
        severity: record.metadata?.severity || 'medium',
        metadata: record.metadata
      })) as PrivacyEvent[];

      // Check each pattern
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.detect(privacyEvents)) {
          await this.trackPrivacyEvent({
            event_type: 'SUSPICIOUS_CONTACT_PATTERN',
            user_id: currentEvent.user_id,
            severity: pattern.severity,
            description: pattern.description,
            metadata: {
              pattern_name: pattern.name,
              trigger_event: currentEvent.event_type,
              detection_confidence: 0.8
            },
            detected_by: 'automated_scan',
            requires_admin_review: true,
            auto_response_taken: !!pattern.autoResponse
          });

          // Execute automatic response if configured
          if (pattern.autoResponse) {
            await pattern.autoResponse(currentEvent);
          }
        }
      }

    } catch (error) {
      captureError(error as Error, {
        component: 'PrivacyEventTracker',
        action: 'checkSuspiciousPatterns',
        userId: currentEvent.user_id,
        severity: 'medium'
      });
    }
  }

  /**
   * Take automatic response for high-risk events
   */
  private async takeAutomaticResponse(event: PrivacyEvent): Promise<void> {
    // Implement automatic responses based on event type
    switch (event.event_type) {
      case 'RATE_LIMIT_EXCEEDED':
        // Could temporarily limit user's contact exchange abilities
        break;
      case 'DECRYPTION_FAILURE':
        // Could trigger security review or temporary account restriction
        break;
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        // Could trigger immediate security review
        break;
    }
  }

  /**
   * Map event types to alert types
   */
  private getAlertType(eventType: PrivacyEventType): string {
    const mapping: Record<string, string> = {
      'CONTACT_EXCHANGE_FAILED': 'SUSPICIOUS_CONTACT_PATTERN',
      'ENCRYPTION_FAILURE': 'ENCRYPTION_FAILURE',
      'DECRYPTION_FAILURE': 'ENCRYPTION_FAILURE',
      'RATE_LIMIT_EXCEEDED': 'RATE_LIMIT_EXCEEDED',
      'INAPPROPRIATE_MESSAGE_CONTENT': 'INAPPROPRIATE_MESSAGE_CONTENT',
      'UNAUTHORIZED_ACCESS_ATTEMPT': 'UNAUTHORIZED_ACCESS_ATTEMPT'
    };

    return mapping[eventType] || 'DATA_BREACH_INDICATOR';
  }
}

// Export singleton instance
// COMMENTED OUT: Module-level getInstance() triggers cookies() error (React #419)
// Use PrivacyEventTracker.getInstance() directly in your code instead
// export const privacyEventTracker = PrivacyEventTracker.getInstance();

// Helper functions for easier usage
export async function trackContactExchange(
  eventType: 'started' | 'completed' | 'failed' | 'revoked',
  exchangeId: string,
  helperId: string,
  requesterId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const tracker = PrivacyEventTracker.getInstance();
  return await tracker.trackContactExchangeEvent(
    eventType, exchangeId, helperId, requesterId, metadata
  );
}

export async function trackEncryption(
  eventType: 'success' | 'failure',
  operation: 'encrypt' | 'decrypt',
  userId: string,
  requestId?: string,
  error?: string
): Promise<void> {
  const tracker = PrivacyEventTracker.getInstance();
  return await tracker.trackEncryptionEvent(
    eventType, operation, userId, requestId, error
  );
}

export async function trackGDPRCompliance(
  eventType: 'consent_given' | 'consent_withdrawn' | 'data_export' | 'data_deletion',
  userId: string,
  details?: Record<string, any>
): Promise<void> {
  const tracker = PrivacyEventTracker.getInstance();
  return await tracker.trackGDPREvent(eventType, userId, details);
}

export async function getUserPrivacyEvents(userId: string, options?: any) {
  const tracker = PrivacyEventTracker.getInstance();
  return await tracker.getUserPrivacyEvents(userId, options);
}

export async function getPrivacyAlerts(options?: any) {
  const tracker = PrivacyEventTracker.getInstance();
  return await tracker.getPrivacyAlerts(options);
}

