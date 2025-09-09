/**
 * Security-focused validation schemas using Zod
 * Prevents XSS, SQL injection, and ensures data integrity
 */

import { z } from 'zod'

// Security constants
const MAX_STRING_LENGTH = 1000
const MAX_TEXT_LENGTH = 5000
const ALLOWED_HTML_TAGS = [] as const // No HTML allowed for security
const SUSPICIOUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+=/i,
  /data:/i,
  /vbscript:/i,
  /@import/i,
  /expression\(/i,
  /url\(/i,
] as const

// Custom validation functions
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .slice(0, MAX_STRING_LENGTH) // Limit length
}

const validateNoMaliciousContent = (str: string): boolean => {
  return !SUSPICIOUS_PATTERNS.some(pattern => pattern.test(str))
}

// Base string validation with security checks
const secureString = (minLength = 1, maxLength = MAX_STRING_LENGTH) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .refine(validateNoMaliciousContent, {
      message: 'Content contains potentially malicious patterns',
    })
    .transform(sanitizeString)

// Base text validation for longer content
const secureText = (maxLength = MAX_TEXT_LENGTH) =>
  z
    .string()
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .refine(validateNoMaliciousContent, {
      message: 'Content contains potentially malicious patterns',
    })
    .transform(sanitizeString)

// Email validation with security checks
const secureEmail = z
  .string()
  .email('Invalid email format')
  .max(254) // RFC 5321 limit
  .toLowerCase()
  .refine(
    email => !email.includes('<') && !email.includes('>'),
    'Invalid email format'
  )

// UUID validation
const secureUuid = z
  .string()
  .uuid('Invalid UUID format')
  .refine(
    uuid => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid),
    'Invalid UUID format'
  )

// Enumeration validation with strict whitelist
const createSecureEnum = <T extends readonly string[]>(values: T) =>
  z.enum(values, {
    errorMap: () => ({ message: `Must be one of: ${values.join(', ')}` }),
  })

// =====================
// CARE COLLECTIVE SCHEMAS
// =====================

// User Profile Validation
export const profileSchema = z.object({
  id: secureUuid,
  name: secureString(2, 50),
  location: secureString(0, 100).optional(),
  email: secureEmail.optional(),
  is_admin: z.boolean().default(false),
  verification_status: createSecureEnum(['pending', 'approved', 'rejected']),
  application_reason: secureText(500).optional(),
})

export const profileUpdateSchema = profileSchema.partial().omit({ 
  id: true,
  is_admin: true, // Prevent privilege escalation
  verification_status: true, // Only admins can change this
})

// Help Request Validation
export const helpRequestSchema = z.object({
  id: secureUuid,
  user_id: secureUuid,
  title: secureString(5, 100),
  description: secureText(500).optional(),
  category: createSecureEnum(['groceries', 'transport', 'household', 'medical', 'other']),
  urgency: createSecureEnum(['normal', 'urgent', 'critical']).default('normal'),
  status: createSecureEnum(['open', 'closed', 'in_progress']).default('open'),
  created_at: z.coerce.date(),
})

export const helpRequestCreateSchema = helpRequestSchema
  .omit({ id: true, user_id: true, created_at: true })
  .extend({
    title: secureString(5, 100),
    description: secureText(500).optional(),
  })

export const helpRequestUpdateSchema = helpRequestCreateSchema
  .partial()
  .extend({
    status: createSecureEnum(['open', 'closed', 'in_progress']).optional(),
  })

// Message Validation (with enhanced security for private communications)
export const messageSchema = z.object({
  id: secureUuid,
  sender_id: secureUuid,
  recipient_id: secureUuid,
  content: secureText(1000), // Longer limit for messages
  read_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
})

export const messageCreateSchema = messageSchema
  .omit({ id: true, read_at: true, created_at: true })
  .extend({
    content: secureString(10, 1000), // Ensure minimum message length
  })

// Contact Exchange Validation (high security for privacy)
export const contactExchangeSchema = z.object({
  request_id: secureUuid,
  message: secureText(200),
  contact_method: createSecureEnum(['phone', 'email']),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Explicit consent required for contact sharing' }),
  }),
})

// Admin Operations Validation
export const adminActionSchema = z.object({
  action: createSecureEnum([
    'approve_user',
    'reject_user', 
    'delete_request',
    'ban_user',
    'unban_user',
    'update_user_status'
  ]),
  target_id: secureUuid,
  reason: secureText(500).optional(),
})

// Database Query Validation
export const queryParamsSchema = z.object({
  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100) // Prevent resource exhaustion
    .default(20),
  offset: z
    .coerce
    .number()
    .int()
    .min(0)
    .default(0),
  sortBy: secureString(1, 50).optional(),
  order: createSecureEnum(['asc', 'desc']).default('desc'),
})

// Search Validation
export const searchSchema = z.object({
  query: secureString(1, 100),
  category: createSecureEnum(['all', 'groceries', 'transport', 'household', 'medical', 'other']).optional(),
  urgency: createSecureEnum(['all', 'normal', 'urgent', 'critical']).optional(),
})

// File Upload Validation
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .max(255)
    .refine(
      filename => {
        // Only allow safe file extensions
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt']
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
        return allowedExtensions.includes(ext)
      },
      'File type not allowed'
    )
    .refine(
      filename => !filename.includes('..') && !filename.includes('/'),
      'Invalid filename'
    ),
  size: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024), // 5MB limit
  contentType: z
    .string()
    .refine(
      type => {
        const allowedTypes = [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'application/pdf',
          'text/plain'
        ]
        return allowedTypes.includes(type)
      },
      'Content type not allowed'
    ),
})

// Environment Variables Validation
export const envSchema = z.object({
  NODE_ENV: createSecureEnum(['development', 'test', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL'),
  SUPABASE_SERVICE_ROLE: z.string().optional(),
})

// =====================
// VALIDATION UTILITIES
// =====================

// Validate and sanitize user input
export function validateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      const errorMessage = `${context ? `${context}: ` : ''}${firstError.message}`
      
      // Log validation errors for security monitoring
      console.warn('[Security] Validation failed:', {
        context,
        error: errorMessage,
        path: firstError.path,
        timestamp: new Date().toISOString(),
      })
      
      return { success: false, error: errorMessage }
    }
    
    // Unknown error
    console.error('[Security] Unexpected validation error:', error)
    return { success: false, error: 'Validation failed' }
  }
}

// Batch validation for multiple inputs
export function validateBatch<T>(
  validations: Array<{ schema: z.ZodSchema<T>; data: unknown; context?: string }>
): { success: boolean; errors: string[]; results: Array<T | null> } {
  const errors: string[] = []
  const results: Array<T | null> = []
  
  for (const validation of validations) {
    const result = validateInput(validation.schema, validation.data, validation.context)
    
    if (result.success) {
      results.push(result.data)
    } else {
      errors.push(result.error)
      results.push(null)
    }
  }
  
  return {
    success: errors.length === 0,
    errors,
    results,
  }
}

// Create a secure validation middleware for API routes
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown, context?: string) => {
    const result = validateInput(schema, data, context)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }
}

// Export type definitions for TypeScript
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type HelpRequest = z.infer<typeof helpRequestSchema>
export type HelpRequestCreate = z.infer<typeof helpRequestCreateSchema>
export type HelpRequestUpdate = z.infer<typeof helpRequestUpdateSchema>
export type Message = z.infer<typeof messageSchema>
export type MessageCreate = z.infer<typeof messageCreateSchema>
export type ContactExchange = z.infer<typeof contactExchangeSchema>
export type AdminAction = z.infer<typeof adminActionSchema>
export type QueryParams = z.infer<typeof queryParamsSchema>
export type SearchParams = z.infer<typeof searchSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>