/**
 * @fileoverview Security Incident Response System for Care Collective
 * Comprehensive monitoring, alerting, and response for security events
 */

export interface SecurityIncident {
  id: string;
  type: SecurityIncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  description: string;
  metadata: Record<string, any>;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export type SecurityIncidentType =
  | 'rate_limit_exceeded'
  | 'authentication_failure'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'malformed_request'
  | 'privilege_escalation'
  | 'data_breach_attempt'
  | 'brute_force_attack';

/**
 * Security Event Monitoring System
 */
export class SecurityMonitor {
  private incidents: Map<string, SecurityIncident> = new Map();
  private alertThresholds = {
    rate_limit_exceeded: 5, // 5 incidents per hour triggers alert
    authentication_failure: 10, // 10 failed auth attempts per hour
    xss_attempt: 1, // Immediate alert for XSS attempts
    sql_injection_attempt: 1, // Immediate alert for SQL injection
    unauthorized_access: 3, // 3 unauthorized access attempts per hour
  };

  /**
   * Record a security incident
   */
  recordIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'status'>): SecurityIncident {
    const fullIncident: SecurityIncident = {
      id: this.generateIncidentId(),
      timestamp: new Date(),
      status: 'new',
      ...incident,
    };

    this.incidents.set(fullIncident.id, fullIncident);

    // Log incident for audit trail
    console.warn('SECURITY INCIDENT:', {
      id: fullIncident.id,
      type: fullIncident.type,
      severity: fullIncident.severity,
      timestamp: fullIncident.timestamp.toISOString(),
      description: fullIncident.description,
    });

    // Check if this triggers an alert
    this.checkAlertThresholds(fullIncident.type);

    // For high/critical incidents, trigger immediate response
    if (fullIncident.severity === 'high' || fullIncident.severity === 'critical') {
      this.triggerImmediateResponse(fullIncident);
    }

    return fullIncident;
  }

  /**
   * Check if incident frequency exceeds alert thresholds
   */
  private checkAlertThresholds(type: SecurityIncidentType): void {
    const threshold = this.alertThresholds[type as keyof typeof this.alertThresholds];
    if (!threshold) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentIncidents = Array.from(this.incidents.values()).filter(
      incident => incident.type === type && incident.timestamp > oneHourAgo
    );

    if (recentIncidents.length >= threshold) {
      this.triggerAlert(type, recentIncidents);
    }
  }

  /**
   * Trigger security alert for threshold breaches
   */
  private triggerAlert(type: SecurityIncidentType, incidents: SecurityIncident[]): void {
    console.error('SECURITY ALERT: Threshold exceeded', {
      type,
      count: incidents.length,
      threshold: this.alertThresholds[type as keyof typeof this.alertThresholds],
      timeWindow: '1 hour',
      incidents: incidents.map(i => ({
        id: i.id,
        timestamp: i.timestamp,
        ip: i.ip,
        userId: i.userId,
      })),
    });

    // In production, this would trigger:
    // - Email notifications to administrators
    // - Slack/Discord alerts
    // - SMS for critical incidents
    // - Automated blocking of suspicious IPs
  }

  /**
   * Immediate response for critical incidents
   */
  private triggerImmediateResponse(incident: SecurityIncident): void {
    console.error('CRITICAL SECURITY INCIDENT - IMMEDIATE RESPONSE REQUIRED', {
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      metadata: incident.metadata,
    });

    // Immediate actions for critical incidents:
    switch (incident.type) {
      case 'xss_attempt':
      case 'sql_injection_attempt':
        // Block IP immediately
        this.addToThreatList(incident.ip, incident.type);
        break;
      case 'data_breach_attempt':
        // Lock down affected user accounts
        if (incident.userId) {
          this.lockUserAccount(incident.userId, incident.id);
        }
        break;
      case 'privilege_escalation':
        // Revoke elevated permissions
        if (incident.userId) {
          this.revokeUserPrivileges(incident.userId, incident.id);
        }
        break;
    }
  }

  /**
   * Add IP to threat blocklist
   */
  private addToThreatList(ip: string, reason: string): void {
    console.warn(`BLOCKING IP ${ip} due to ${reason}`);
    // In production, this would:
    // - Add IP to WAF blocklist
    // - Update firewall rules
    // - Add to threat intelligence database
  }

  /**
   * Emergency user account lockdown
   */
  private lockUserAccount(userId: string, incidentId: string): void {
    console.warn(`LOCKING USER ACCOUNT ${userId} due to security incident ${incidentId}`);
    // In production, this would:
    // - Invalidate all user sessions
    // - Require password reset
    // - Send security notification to user
    // - Flag account for manual review
  }

  /**
   * Revoke user privileges
   */
  private revokeUserPrivileges(userId: string, incidentId: string): void {
    console.warn(`REVOKING PRIVILEGES for user ${userId} due to security incident ${incidentId}`);
    // In production, this would:
    // - Remove admin/moderator privileges
    // - Require re-authentication
    // - Log privilege changes
    // - Notify other administrators
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get incident statistics
   */
  getIncidentStats(timeFrame: 'hour' | 'day' | 'week' = 'hour'): Record<SecurityIncidentType, number> {
    const timeMs = timeFrame === 'hour' ? 60 * 60 * 1000 :
                   timeFrame === 'day' ? 24 * 60 * 60 * 1000 :
                   7 * 24 * 60 * 60 * 1000;

    const cutoff = new Date(Date.now() - timeMs);
    const recentIncidents = Array.from(this.incidents.values()).filter(
      incident => incident.timestamp > cutoff
    );

    const stats = {} as Record<SecurityIncidentType, number>;
    recentIncidents.forEach(incident => {
      stats[incident.type] = (stats[incident.type] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Care Collective Security Incident Handlers
 */
export class CareCollectiveSecurityHandlers {
  private monitor = new SecurityMonitor();

  /**
   * Handle rate limiting violations
   */
  handleRateLimitExceeded(ip: string, endpoint: string, userId?: string): void {
    this.monitor.recordIncident({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      ip,
      userId,
      endpoint,
      description: `Rate limit exceeded for endpoint ${endpoint}`,
      metadata: { endpoint, userAgent: 'unknown' },
    });
  }

  /**
   * Handle authentication failures
   */
  handleAuthenticationFailure(ip: string, email?: string, reason?: string): void {
    this.monitor.recordIncident({
      type: 'authentication_failure',
      severity: 'medium',
      ip,
      description: `Authentication failed${email ? ` for ${email}` : ''}${reason ? `: ${reason}` : ''}`,
      metadata: { email, reason },
    });
  }

  /**
   * Handle XSS attempts
   */
  handleXSSAttempt(ip: string, input: string, userId?: string, endpoint?: string): void {
    this.monitor.recordIncident({
      type: 'xss_attempt',
      severity: 'critical',
      ip,
      userId,
      endpoint,
      description: 'XSS attack attempt detected in user input',
      metadata: {
        maliciousInput: input.substring(0, 200), // Log first 200 chars for analysis
        endpoint,
      },
    });
  }

  /**
   * Handle SQL injection attempts
   */
  handleSQLInjectionAttempt(ip: string, query: string, userId?: string, endpoint?: string): void {
    this.monitor.recordIncident({
      type: 'sql_injection_attempt',
      severity: 'critical',
      ip,
      userId,
      endpoint,
      description: 'SQL injection attack attempt detected',
      metadata: {
        maliciousQuery: query.substring(0, 200),
        endpoint,
      },
    });
  }

  /**
   * Handle unauthorized access attempts
   */
  handleUnauthorizedAccess(ip: string, endpoint: string, userId?: string): void {
    this.monitor.recordIncident({
      type: 'unauthorized_access',
      severity: 'high',
      ip,
      userId,
      endpoint,
      description: `Unauthorized access attempt to ${endpoint}`,
      metadata: { endpoint },
    });
  }

  /**
   * Handle suspicious activity patterns
   */
  handleSuspiciousActivity(ip: string, pattern: string, userId?: string): void {
    this.monitor.recordIncident({
      type: 'suspicious_activity',
      severity: 'medium',
      ip,
      userId,
      description: `Suspicious activity pattern detected: ${pattern}`,
      metadata: { pattern },
    });
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    hourlyStats: Record<SecurityIncidentType, number>;
    dailyStats: Record<SecurityIncidentType, number>;
    criticalIncidents: SecurityIncident[];
  } {
    return {
      hourlyStats: this.monitor.getIncidentStats('hour'),
      dailyStats: this.monitor.getIncidentStats('day'),
      criticalIncidents: Array.from(this.monitor['incidents'].values()).filter(
        incident => incident.severity === 'critical' && incident.status === 'new'
      ),
    };
  }
}

// Singleton instance for the Care Collective platform
export const securityHandler = new CareCollectiveSecurityHandlers();

/**
 * Middleware function to add security monitoring to API routes
 */
export function withSecurityMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  endpoint: string
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as Request;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    try {
      const response = await handler(...args);

      // Log successful requests for pattern analysis
      if (response.status >= 400) {
        securityHandler.handleSuspiciousActivity(
          ip,
          `HTTP ${response.status} on ${endpoint}`,
          undefined // Would extract userId from request if available
        );
      }

      return response;
    } catch (error) {
      // Log errors for security analysis
      console.error(`Security monitoring: Error in ${endpoint}:`, error);

      securityHandler.handleSuspiciousActivity(
        ip,
        `Server error in ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      throw error;
    }
  };
}