/**
 * @fileoverview Content moderation service for messaging system
 * Implements automated content screening and moderation workflows
 */

import { createClient } from '@/lib/supabase/server';

export interface ContentModerationResult {
  flagged: boolean;
  confidence: number;
  categories: string[];
  suggested_action: 'allow' | 'review' | 'block';
  explanation: string;
}

export interface UserModerationScore {
  user_id: string;
  reports_received: number;
  reports_verified: number;
  trust_score: number;
  restriction_level: 'none' | 'limited' | 'suspended' | 'banned';
  restrictions: {
    can_send_messages: boolean;
    can_start_conversations: boolean;
    requires_pre_approval: boolean;
    message_limit_per_day: number;
  };
}

// Basic profanity and inappropriate content patterns
const PROFANITY_PATTERNS = [
  // Explicit profanity (basic list - production would use comprehensive service)
  /\b(fuck|shit|damn|hell|bitch|bastard|crap)\b/gi,
  // Hate speech patterns
  /\b(kill\s+yourself|kys|die\b)/gi,
  // Harassment patterns
  /\b(stalker?|creep|pervert)\b/gi,
];

// Personal information patterns
const PERSONAL_INFO_PATTERNS = [
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

// Spam patterns
const SPAM_PATTERNS = [
  // URLs (excluding trusted domains)
  /https?:\/\/(?!.*\b(youtube|google|facebook|twitter|instagram|linkedin|github|care-collective)\b)[^\s]+/gi,
  // Promotional language
  /\b(buy now|click here|act fast|limited time|offer expires|free money|guaranteed)\b/gi,
  // Repeated characters/words
  /(.)\1{10,}/g,
  /\b(\w+)\s+\1\s+\1/gi,
];

// Scam patterns
const SCAM_PATTERNS = [
  // Money requests
  /\b(send\s+money|wire\s+transfer|western\s+union|cash\s+app|venmo|paypal)\b/gi,
  // Urgent financial requests
  /\b(emergency\s+funds|urgent\s+money|desperate\s+need|financial\s+crisis)\b/gi,
  // Suspicious offers
  /\b(easy\s+money|work\s+from\s+home|make\s+\$\d+|quick\s+cash)\b/gi,
];

export class ContentModerationService {
  // Lazy-load Supabase client to avoid calling cookies() at module load time
  private async getClient() {
    return await createClient();
  }

  /**
   * Moderates message content using multi-layered screening algorithms
   * Analyzes content for profanity, PII, spam, scams, and user reputation
   *
   * @param content - The message content to analyze
   * @param userId - Optional user ID for reputation-based scoring
   * @returns Promise resolving to comprehensive moderation result
   *
   * @example
   * ```typescript
   * const result = await moderationService.moderateContent(
   *   "Check out this suspicious link",
   *   "user123"
   * );
   * if (result.suggested_action === 'block') {
   *   // Handle blocked content
   * }
   * ```
   */
  async moderateContent(content: string, userId?: string): Promise<ContentModerationResult> {
    const checks = [
      this.checkProfanity(content),
      this.checkPersonalInformation(content),
      this.checkSpamPatterns(content),
      this.checkScamPatterns(content),
    ];

    // If we have a user ID, also check user history
    if (userId) {
      const userScore = await this.getUserModerationScore(userId);
      if (userScore.trust_score < 25) {
        checks.push({
          flagged: true,
          confidence: 0.3,
          category: 'low_trust_user',
          explanation: 'User has low trust score'
        });
      }
    }

    const flaggedChecks = checks.filter(check => check.flagged);
    const flagged = flaggedChecks.length > 0;
    const confidence = flagged ? Math.max(...flaggedChecks.map(c => c.confidence)) : 0;
    const categories = flaggedChecks.map(c => c.category);

    let suggested_action: 'allow' | 'review' | 'block' = 'allow';
    
    if (confidence > 0.8) {
      suggested_action = 'block';
    } else if (confidence > 0.4 || categories.includes('personal_info')) {
      suggested_action = 'review';
    }

    return {
      flagged,
      confidence,
      categories,
      suggested_action,
      explanation: flagged 
        ? `Content flagged for: ${categories.join(', ')}`
        : 'Content appears safe'
    };
  }

  /**
   * Analyzes content for profanity and inappropriate language patterns
   * Uses regex matching against known offensive terms and hate speech
   *
   * @param content - The text content to analyze
   * @returns Moderation check result with confidence scoring
   *
   * @private
   */
  private checkProfanity(content: string): { flagged: boolean; confidence: number; category: string; explanation: string } {
    const matches = PROFANITY_PATTERNS.map(pattern => content.match(pattern)).filter(Boolean).flat();
    
    return {
      flagged: matches.length > 0,
      confidence: Math.min(matches.length * 0.3, 0.9),
      category: 'profanity',
      explanation: matches.length > 0 ? `Found ${matches.length} inappropriate words` : 'No profanity detected'
    };
  }

  /**
   * Detects sharing of personal information (PII) in message content
   * Identifies phone numbers, emails, SSN, credit cards, and addresses
   *
   * @param content - The text content to analyze for PII
   * @returns Moderation check result with detected information types
   *
   * @private
   */
  private checkPersonalInformation(content: string): { flagged: boolean; confidence: number; category: string; explanation: string } {
    const matches = PERSONAL_INFO_PATTERNS.map(pattern => content.match(pattern)).filter(Boolean).flat();
    
    return {
      flagged: matches.length > 0,
      confidence: matches.length > 0 ? 0.7 : 0,
      category: 'personal_info',
      explanation: matches.length > 0 ? 'Contains potential personal information' : 'No personal information detected'
    };
  }

  /**
   * Check for spam patterns
   */
  private checkSpamPatterns(content: string): { flagged: boolean; confidence: number; category: string; explanation: string } {
    const matches = SPAM_PATTERNS.map(pattern => content.match(pattern)).filter(Boolean).flat();
    
    return {
      flagged: matches.length > 0,
      confidence: Math.min(matches.length * 0.2, 0.6),
      category: 'spam',
      explanation: matches.length > 0 ? 'Contains spam-like content' : 'No spam detected'
    };
  }

  /**
   * Check for scam patterns
   */
  private checkScamPatterns(content: string): { flagged: boolean; confidence: number; category: string; explanation: string } {
    const matches = SCAM_PATTERNS.map(pattern => content.match(pattern)).filter(Boolean).flat();
    
    return {
      flagged: matches.length > 0,
      confidence: matches.length > 0 ? 0.8 : 0,
      category: 'potential_scam',
      explanation: matches.length > 0 ? 'Contains potential scam indicators' : 'No scam patterns detected'
    };
  }

  /**
   * Check if user is restricted from performing an action
   */
  async checkUserRestrictions(userId: string, action: 'send_message' | 'start_conversation'): Promise<{
    allowed: boolean;
    reason?: string;
    restrictionLevel: string;
    dailyMessageCount?: number;
    dailyLimit?: number;
  }> {
    // Get current user restrictions
    const { data: restrictions, error } = await (await this.getClient())
      .rpc('get_user_restrictions', { target_user_id: userId });

    if (error) {
      console.error('Error checking user restrictions:', error);
      // Fail open - allow action if we can't check restrictions
      return { allowed: true, restrictionLevel: 'unknown' };
    }

    const userRestrictions = restrictions?.[0];
    if (!userRestrictions) {
      return { allowed: true, restrictionLevel: 'none' };
    }

    const {
      restriction_level,
      can_send_messages,
      can_start_conversations,
      message_limit_per_day
    } = userRestrictions;

    // Check action-specific restrictions
    if (action === 'send_message' && !can_send_messages) {
      return {
        allowed: false,
        reason: `You are currently ${restriction_level} and cannot send messages.`,
        restrictionLevel: restriction_level
      };
    }

    if (action === 'start_conversation' && !can_start_conversations) {
      return {
        allowed: false,
        reason: `You are currently ${restriction_level} and cannot start new conversations.`,
        restrictionLevel: restriction_level
      };
    }

    // Check daily message limit for sending messages
    if (action === 'send_message' && message_limit_per_day > 0) {
      const { data: dailyCount } = await (await this.getClient())
        .rpc('get_daily_message_count', { target_user_id: userId });

      const currentCount = dailyCount || 0;

      if (currentCount >= message_limit_per_day) {
        return {
          allowed: false,
          reason: `Daily message limit reached (${message_limit_per_day} messages per day).`,
          restrictionLevel: restriction_level,
          dailyMessageCount: currentCount,
          dailyLimit: message_limit_per_day
        };
      }

      return {
        allowed: true,
        restrictionLevel: restriction_level,
        dailyMessageCount: currentCount,
        dailyLimit: message_limit_per_day
      };
    }

    return { allowed: true, restrictionLevel: restriction_level };
  }

  /**
   * Get user's moderation score and restrictions
   */
  async getUserModerationScore(userId: string): Promise<UserModerationScore> {
    // Get report counts
    const { data: reportData } = await (await this.getClient())
      .from('message_reports')
      .select(`
        id,
        status,
        messages!inner(sender_id)
      `)
      .eq('messages.sender_id', userId);

    const reports_received = reportData?.length || 0;
    const reports_verified = reportData?.filter(r => r.status === 'action_taken').length || 0;

    // Calculate trust score (starts at 75, decreases with verified reports)
    let trust_score = 75 - (reports_verified * 15);
    trust_score = Math.max(0, Math.min(100, trust_score));

    // Determine restriction level
    let restriction_level: UserModerationScore['restriction_level'] = 'none';
    let restrictions = {
      can_send_messages: true,
      can_start_conversations: true,
      requires_pre_approval: false,
      message_limit_per_day: 100,
    };

    if (reports_verified >= 5) {
      restriction_level = 'banned';
      restrictions = {
        can_send_messages: false,
        can_start_conversations: false,
        requires_pre_approval: false,
        message_limit_per_day: 0,
      };
    } else if (reports_verified >= 3) {
      restriction_level = 'suspended';
      restrictions = {
        can_send_messages: false,
        can_start_conversations: false,
        requires_pre_approval: false,
        message_limit_per_day: 0,
      };
    } else if (reports_verified >= 2 || trust_score < 40) {
      restriction_level = 'limited';
      restrictions = {
        can_send_messages: true,
        can_start_conversations: false,
        requires_pre_approval: true,
        message_limit_per_day: 10,
      };
    }

    return {
      user_id: userId,
      reports_received,
      reports_verified,
      trust_score,
      restriction_level,
      restrictions,
    };
  }

  /**
   * Apply moderation action to a user
   */
  async applyModerationAction(
    userId: string,
    action: 'warn' | 'limit' | 'suspend' | 'ban',
    reason: string,
    duration?: string,
    appliedBy?: string
  ): Promise<void> {
    let expiresAt: string | null = null;

    // Calculate expiration time if duration is provided
    if (duration && action !== 'ban') {
      const now = new Date();
      if (duration === '1 hour') {
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      } else if (duration === '24 hours') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (duration === '7 days') {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (duration === '30 days') {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    // Map action to restriction level
    let restrictionLevel: string;
    let messageLimit = 100;

    switch (action) {
      case 'warn':
        restrictionLevel = 'none'; // Warning doesn't change restrictions
        break;
      case 'limit':
        restrictionLevel = 'limited';
        messageLimit = 10;
        break;
      case 'suspend':
        restrictionLevel = 'suspended';
        messageLimit = 0;
        break;
      case 'ban':
        restrictionLevel = 'banned';
        messageLimit = 0;
        expiresAt = null; // Permanent
        break;
      default:
        throw new Error(`Invalid moderation action: ${action}`);
    }

    // Apply user restriction using database function
    const { data: restrictionResult, error: restrictionError } = await (await this.getClient())
      .rpc('apply_user_restriction', {
        target_user_id: userId,
        new_restriction_level: restrictionLevel,
        new_reason: reason,
        applied_by_user_id: appliedBy || null,
        expires_at_param: expiresAt,
        message_limit: messageLimit
      });

    if (restrictionError) {
      throw new Error(`Failed to apply user restriction: ${restrictionError.message}`);
    }

    // Log the moderation action with restriction reference
    await (await this.getClient())
      .from('message_audit_log')
      .insert({
        user_id: userId,
        action_type: 'moderated',
        restriction_id: restrictionResult || null,
        metadata: {
          moderation_action: action,
          restriction_level: restrictionLevel,
          reason,
          duration,
          expires_at: expiresAt,
          applied_by: appliedBy || 'system',
          applied_at: new Date().toISOString()
        }
      });

    console.log(`Moderation action applied: ${action} (${restrictionLevel}) for user ${userId} - ${reason}${expiresAt ? ` (expires: ${expiresAt})` : ''}`);
  }

  /**
   * Get pending moderation queue items
   */
  async getModerationQueue(limit: number = 50): Promise<Array<{
    id: string;
    message: any;
    report: any;
    reporter: any;
    context: any;
  }>> {
    const { data: reports } = await (await this.getClient())
      .from('message_reports')
      .select(`
        id,
        reason,
        description,
        created_at,
        reported_by,
        messages!inner (
          id,
          content,
          conversation_id,
          sender_id,
          created_at,
          sender:profiles!messages_sender_id_fkey (
            id,
            name,
            location
          ),
          conversations (
            id,
            help_request_id,
            help_requests (
              id,
              title,
              category
            )
          )
        ),
        reporter:profiles!message_reports_reported_by_fkey (
          id,
          name
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    return (reports || []).map(report => ({
      id: report.id,
      message: report.messages,
      report: {
        reason: report.reason,
        description: report.description,
        created_at: report.created_at
      },
      reporter: report.reporter,
      context: {
        conversation_id: report.messages?.[0]?.conversation_id,
        help_request_title: report.messages?.[0]?.conversations?.[0]?.help_requests?.[0]?.title
      }
    }));
  }

  /**
   * Process a moderation queue item
   */
  async processModerationItem(
    reportId: string,
    action: 'dismiss' | 'hide_message' | 'warn_user' | 'restrict_user' | 'ban_user',
    reviewerId?: string,
    notes?: string
  ): Promise<void> {
    // Update the report status
    await (await this.getClient())
      .from('message_reports')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'action_taken',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', reportId);

    // Apply the action based on the decision
    const { data: report } = await (await this.getClient())
      .from('message_reports')
      .select(`
        message_id,
        reason,
        messages!inner (
          sender_id
        )
      `)
      .eq('id', reportId)
      .single();

    if (!report) return;

    switch (action) {
      case 'hide_message':
        await (await this.getClient())
          .from('messages')
          .update({
            moderation_status: 'hidden',
            is_flagged: true,
            flagged_reason: report.reason
          })
          .eq('id', report.message_id);
        break;

      case 'warn_user':
        await this.applyModerationAction(
          report.messages?.[0]?.sender_id,
          'warn',
          `Warning for ${report.reason}`,
        );
        break;

      case 'restrict_user':
        await this.applyModerationAction(
          report.messages?.[0]?.sender_id,
          'limit',
          `Limited for ${report.reason}`,
          '7 days'
        );
        break;

      case 'ban_user':
        await this.applyModerationAction(
          report.messages?.[0]?.sender_id,
          'ban',
          `Banned for ${report.reason}`,
          'permanent'
        );
        break;
    }

    // Log the moderation decision
    await (await this.getClient())
      .from('message_audit_log')
      .insert({
        message_id: report.message_id,
        action_type: 'moderated',
        user_id: reviewerId,
        metadata: {
          report_id: reportId,
          moderation_action: action,
          reason: report.reason,
          notes,
          processed_at: new Date().toISOString()
        }
      });
  }
}

// Export singleton instance
export const moderationService = new ContentModerationService();