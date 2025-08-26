import { createClient } from '@/lib/supabase/server';

export type SecurityEventType = 
  | 'auth_failure' 
  | 'rate_limit' 
  | 'validation_error' 
  | 'suspicious_activity' 
  | 'access_denied'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'account_locked'
  | 'unusual_login'
  | 'data_export_request'
  | 'admin_action';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityLogger {
  private static async logToDatabase(event: SecurityEvent) {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('security_events')
        .insert({
          event_type: event.type,
          user_id: event.userId,
          ip_address: event.ip,
          user_agent: event.userAgent,
          details: event.details,
          severity: event.severity,
          created_at: event.timestamp.toISOString(),
        });
    } catch (error) {
      console.error('Failed to log security event to database:', error);
    }
  }
  
  private static async logToConsole(event: SecurityEvent) {
    const logLevel = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn';
    console[logLevel](`[SECURITY] ${event.type}:`, {
      userId: event.userId,
      ip: event.ip,
      details: event.details,
      timestamp: event.timestamp.toISOString(),
    });
  }
  
  static async logAuthFailure(
    email: string, 
    ip: string, 
    userAgent?: string,
    reason?: string
  ) {
    const event: SecurityEvent = {
      type: 'auth_failure',
      ip,
      userAgent,
      details: { email, reason },
      timestamp: new Date(),
      severity: 'medium',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
    
    // Check for repeated failures
    await this.checkForBruteForce(email, ip);
  }
  
  static async logRateLimit(
    ip: string, 
    endpoint: string, 
    userAgent?: string,
    userId?: string
  ) {
    const event: SecurityEvent = {
      type: 'rate_limit',
      userId,
      ip,
      userAgent,
      details: { endpoint },
      timestamp: new Date(),
      severity: 'medium',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
  }
  
  static async logValidationError(
    errors: any[], 
    endpoint: string, 
    ip: string,
    userId?: string
  ) {
    const event: SecurityEvent = {
      type: 'validation_error',
      userId,
      ip,
      details: { endpoint, errors },
      timestamp: new Date(),
      severity: 'low',
    };
    
    await this.logToDatabase(event);
  }
  
  static async logSuspiciousActivity(
    userId: string, 
    activity: string, 
    details: any,
    ip?: string,
    severity: SecurityEvent['severity'] = 'high'
  ) {
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      userId,
      ip,
      details: { activity, ...details },
      timestamp: new Date(),
      severity,
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
    
    // Alert administrators for high/critical severity
    if (severity === 'high' || severity === 'critical') {
      await this.alertAdmins(event);
    }
  }
  
  static async logAccessDenied(
    resource: string,
    userId?: string,
    ip?: string,
    reason?: string
  ) {
    const event: SecurityEvent = {
      type: 'access_denied',
      userId,
      ip,
      details: { resource, reason },
      timestamp: new Date(),
      severity: 'medium',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
  }
  
  static async logPasswordReset(
    email: string,
    ip: string,
    success: boolean,
    details?: any
  ) {
    const event: SecurityEvent = {
      type: success ? 'password_reset_success' : 'password_reset_request',
      ip,
      details: { email, ...details },
      timestamp: new Date(),
      severity: 'medium',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
  }
  
  static async logAccountLocked(userId: string, reason: string, ip?: string) {
    const event: SecurityEvent = {
      type: 'account_locked',
      userId,
      ip,
      details: { reason },
      timestamp: new Date(),
      severity: 'high',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
      this.alertAdmins(event),
    ]);
  }
  
  static async logUnusualLogin(
    userId: string,
    ip: string,
    userAgent: string,
    details: any
  ) {
    const event: SecurityEvent = {
      type: 'unusual_login',
      userId,
      ip,
      userAgent,
      details,
      timestamp: new Date(),
      severity: 'medium',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
  }
  
  static async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    details?: any,
    ip?: string
  ) {
    const event: SecurityEvent = {
      type: 'admin_action',
      userId: adminUserId,
      ip,
      details: { action, targetUserId, ...details },
      timestamp: new Date(),
      severity: 'high',
    };
    
    await Promise.all([
      this.logToDatabase(event),
      this.logToConsole(event),
    ]);
  }
  
  // Check for brute force attacks
  private static async checkForBruteForce(email: string, ip: string) {
    try {
      const supabase = await createClient();
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      // Check recent auth failures
      const { count } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'auth_failure')
        .gte('created_at', fifteenMinutesAgo.toISOString())
        .or(`details->>email.eq."${email}",ip_address.eq.${ip}`);
      
      if ((count || 0) >= 5) {
        // Possible brute force attack
        await this.logSuspiciousActivity(
          '', // No user ID for brute force attempts
          'Possible brute force attack',
          {
            email,
            ip,
            failureCount: count,
            timeWindow: '15 minutes',
          },
          ip,
          'critical'
        );
      }
    } catch (error) {
      console.error('Error checking for brute force:', error);
    }
  }
  
  // Alert administrators
  private static async alertAdmins(event: SecurityEvent) {
    // In production, this would send emails, Slack notifications, etc.
    console.error('🚨 SECURITY ALERT:', {
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      details: event.details,
    });
    
    // Could also:
    // - Send email to security team
    // - Send Slack notification
    // - Create incident ticket
    // - Trigger automated response
  }
  
  // Get security metrics
  static async getSecurityMetrics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const supabase = await createClient();
      
      let hoursAgo: number;
      switch (timeframe) {
        case '1h': hoursAgo = 1; break;
        case '24h': hoursAgo = 24; break;
        case '7d': hoursAgo = 24 * 7; break;
        case '30d': hoursAgo = 24 * 30; break;
      }
      
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('security_events')
        .select('event_type, severity, created_at')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process metrics
      const metrics = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        timeline: [] as Array<{ hour: string; count: number }>,
      };
      
      data?.forEach(event => {
        metrics.byType[event.event_type] = (metrics.byType[event.event_type] || 0) + 1;
        metrics.bySeverity[event.severity] = (metrics.bySeverity[event.severity] || 0) + 1;
      });
      
      return metrics;
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        timeline: [],
      };
    }
  }
  
  // Get recent security events
  static async getRecentEvents(limit: number = 50, severity?: SecurityEvent['severity']) {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (severity) {
        query = query.eq('severity', severity);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }
}