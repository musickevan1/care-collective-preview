/**
 * @fileoverview Contact Exchange Validation Schema
 * 
 * Privacy-critical validation for contact information sharing as outlined in
 * TESTING_ISSUES_AND_FIXES.md Issue #3
 */

import { z } from 'zod';

// Contact exchange validation schema
export const contactExchangeSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(200, 'Message cannot exceed 200 characters')
    .refine((msg) => {
      // Basic content validation - reject suspicious patterns
      const suspiciousPatterns = [
        /(?:call|text|phone).*(?:special|private|adult|sexy)/i,
        /(?:send|show).*(?:photos?|pics?|images?)/i,
        /(?:meet|come).*(?:alone|private|secret)/i,
        /(?:https?:\/\/|www\.)/i, // URLs
        /\b(?:\d{3}[-.]?\d{3}[-.]?\d{4})\b/i, // Phone numbers in message
        /@[^\s]+\.[^\s]+/i, // Email addresses in message
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(msg));
    }, {
      message: 'Message contains inappropriate content or contact information. Please use the proper contact exchange flow.'
    }),
  consent: z.literal(true, 'You must explicitly consent to share contact information'),
  helperId: z.string().uuid('Invalid helper ID'),
  requesterId: z.string().uuid('Invalid requester ID'),
});

// Rate limiting schema for contact exchanges
export const contactExchangeRateLimitSchema = z.object({
  userId: z.string().uuid(),
  windowStart: z.date(),
  attempts: z.number().int().min(0).max(5), // Max 5 attempts per hour
});

// Audit trail schema
export const contactExchangeAuditSchema = z.object({
  action: z.enum([
    'CONTACT_EXCHANGE_INITIATED',
    'CONTACT_EXCHANGE_COMPLETED',
    'CONTACT_EXCHANGE_FAILED',
    'CONTACT_EXCHANGE_REVOKED'
  ]),
  requestId: z.string().uuid(),
  helperId: z.string().uuid(),
  requesterId: z.string().uuid(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Contact preference validation
export const contactPreferencesSchema = z.object({
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  preferredContact: z.enum(['email', 'phone']).default('email'),
  allowDirectContact: z.boolean().default(true),
  requireVerification: z.boolean().default(false),
});

export type ContactExchangeInput = z.infer<typeof contactExchangeSchema>;
export type ContactExchangeRateLimit = z.infer<typeof contactExchangeRateLimitSchema>;
export type ContactExchangeAudit = z.infer<typeof contactExchangeAuditSchema>;
export type ContactPreferences = z.infer<typeof contactPreferencesSchema>;

/**
 * Validates contact exchange input with enhanced privacy checks
 */
export function validateContactExchange(input: unknown): ContactExchangeInput {
  return contactExchangeSchema.parse(input);
}

/**
 * Checks if user has exceeded rate limit for contact exchanges
 */
export function validateRateLimit(userId: string, recentExchanges: Date[]): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = recentExchanges.filter(date => date > oneHourAgo).length;
  
  return recentCount < 5; // Max 5 exchanges per hour
}

/**
 * Creates audit log entry for contact exchange
 */
export function createAuditEntry(
  action: ContactExchangeAudit['action'],
  data: Omit<ContactExchangeAudit, 'action' | 'timestamp'>
): ContactExchangeAudit {
  return contactExchangeAuditSchema.parse({
    action,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Validates if users can exchange contact information
 */
export function canExchangeContacts(
  helperId: string, 
  requesterId: string, 
  requestStatus: string
): { canExchange: boolean; reason?: string } {
  // Users cannot exchange contact with themselves
  if (helperId === requesterId) {
    return { canExchange: false, reason: 'Cannot exchange contact with yourself' };
  }
  
  // Request must be open
  if (requestStatus !== 'open') {
    return { canExchange: false, reason: 'Request is not open for help' };
  }
  
  return { canExchange: true };
}

/**
 * Sanitizes message content while preserving intent
 */
export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 200); // Enforce max length
}