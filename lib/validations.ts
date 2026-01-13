import { z } from 'zod'
import validator from 'validator'

// Common validation helpers
const sanitizeString = (str: string) => str.trim().slice(0, 1000) // Limit length and trim
// Note: HTML escaping removed - React auto-escapes JSX content, and we render as plain text
// const sanitizeHTML = (str: string) => validator.escape(str) // HTML escape - REMOVED to fix &#x27; display issue

// User authentication schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(320, 'Email too long') // RFC 5321 limit
    .transform(sanitizeString)
    .refine((email) => validator.isEmail(email), 'Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
})

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform(sanitizeString)
    .refine((name) => !validator.contains(name, '<script'), 'Invalid characters in name')
    .refine((name) => /^[a-zA-Z\s\-'\.]+$/.test(name), 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(320, 'Email too long')
    .transform(sanitizeString)
    .refine((email) => validator.isEmail(email), 'Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  termsAccepted: z.literal(true, {
    message: 'You must accept the Terms of Service'
  }),
  caregiving_situation: z
    .string()
    .min(1, 'Caregiving situation is required')
    .max(500, 'Caregiving situation description too long (max 500 characters)')
    .transform(sanitizeString)
    .refine((s) => !validator.contains(s, '<script'), 'Invalid characters in description'),
})

// Help request schemas
import { getCategoryValues } from './constants/categories';

export const categorySchema = z.enum(getCategoryValues() as [string, ...string[]])

export const urgencySchema = z.enum(['normal', 'urgent', 'critical'])

export const locationPrivacySchema = z.enum(['public', 'helpers_only', 'after_match'])

export const helpRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long')
    .transform(sanitizeString)
    .refine((title) => !validator.contains(title, '<script'), 'Invalid characters in title'),
  description: z
    .string()
    .max(500, 'Description too long')
    .transform(sanitizeString)
    .refine((desc) => !validator.contains(desc, '<script'), 'Invalid characters in description')
    .optional()
    .nullable(),
  exchange_offer: z
    .string()
    .max(300, 'Exchange offer description too long (max 300 characters)')
    .transform(sanitizeString)
    .refine((offer) => !validator.contains(offer, '<script'), 'Invalid characters in exchange offer')
    .optional()
    .nullable(),
  category: categorySchema,
  urgency: urgencySchema,
  location_override: z
    .string()
    .max(200, 'Location too long')
    .transform(sanitizeString)
    .refine((loc) => !validator.contains(loc, '<script'), 'Invalid characters in location')
    .optional()
    .nullable(),
  location_privacy: locationPrivacySchema,
})

// Profile schemas
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform(sanitizeString)
    .refine((name) => !validator.contains(name, '<script'), 'Invalid characters in name')
    .refine((name) => /^[a-zA-Z\s\-'\.]+$/.test(name), 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  location: z
    .string()
    .max(200, 'Location too long')
    .transform(sanitizeString)
    .refine((loc) => !validator.contains(loc, '<script'), 'Invalid characters in location')
    .optional()
    .nullable(),
})

// Admin schemas
export const adminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'close', 'reopen', 'delete']),
  reason: z
    .string()
    .max(500, 'Reason too long')
    .transform(sanitizeString)
    .refine((reason) => !validator.contains(reason, '<script'), 'Invalid characters in reason')
    .optional()
    .nullable(),
})

// Environment variable validation (base schema)
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .refine((url) => url.includes('supabase.co'), 'Must be a valid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required')
    .refine((key) => key.startsWith('eyJ'), 'Invalid Supabase anon key format'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Supabase service role key is required')
    .refine((key) => key.startsWith('eyJ'), 'Invalid Supabase service role key format')
    .optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Production-specific schema with stricter requirements
export const productionEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required in production for admin functions')
    .refine((key) => key.startsWith('eyJ'), 'Invalid service role key format'),
  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required in production for email notifications')
    .optional(), // Optional but recommended
})

// Helper to get appropriate schema based on environment
export const getEnvSchema = (nodeEnv?: string) => {
  return nodeEnv === 'production' ? productionEnvSchema : envSchema
}

// Rate limiting schemas
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  max: z.number().min(1).max(10000), // 1 to 10,000 requests
  standardHeaders: z.boolean().default(true),
  legacyHeaders: z.boolean().default(false),
})

// API response schemas
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  timestamp: z.string().datetime(),
})

export const apiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
})

// Security validation utilities
export const validateAndSanitizeInput = <T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(input)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: messages }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Common API validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1, 'Limit must be >= 1').max(100, 'Limit must be <= 100').default(20),
  offset: z.coerce.number().min(0, 'Offset must be >= 0').default(0),
})

export const notificationQuerySchema = paginationSchema.extend({
  unread_only: z.coerce.boolean().optional().default(false),
})

// SQL injection prevention helpers
export const validateUUID = (uuid: string): boolean => {
  return validator.isUUID(uuid)
}

export const sanitizeSearchQuery = (query: string): string => {
  return validator.escape(query.trim().slice(0, 100))
}

// XSS prevention helpers
// Note: Not needed - React auto-escapes JSX content
// export const sanitizeForDisplay = (content: string): string => {
//   return validator.escape(content)
// }

// CSRF token validation (for future use)
export const csrfTokenSchema = z.object({
  token: z.string().min(32).max(128),
  timestamp: z.number(),
})

// File upload validation (for future use)
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(255)
    .refine((name) => !/[<>:"/\\|?*]/.test(name), 'Invalid filename characters'),
  size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ]),
})

// Export type definitions for TypeScript
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type HelpRequestInput = z.infer<typeof helpRequestSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type AdminActionInput = z.infer<typeof adminActionSchema>
export type EnvConfig = z.infer<typeof envSchema>