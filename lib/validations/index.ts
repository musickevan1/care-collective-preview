import { z } from 'zod'

/**
 * Centralized Validation Schemas for Care Collective
 * All form and API validations should use these schemas
 */

// User Profile Validation
export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  applicationReason: z.string()
    .min(20, 'Please provide at least 20 characters explaining why you want to join')
    .max(500, 'Application reason must be less than 500 characters')
    .optional()
    .nullable()
})

// Help Request Validation
export const helpRequestSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  category: z.enum([
    'groceries', 'transport', 'household', 'medical', 'meals', 
    'childcare', 'petcare', 'technology', 'companionship', 'respite', 
    'emotional', 'other'
  ]),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  locationOverride: z.string()
    .max(100, 'Location override must be less than 100 characters')
    .optional()
    .nullable(),
  locationPrivacy: z.enum(['public', 'helpers_only', 'after_match']).default('public')
})

// Authentication Validation
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
})

export const signupSchema = loginSchema.extend({
  name: profileSchema.shape.name,
  confirmPassword: z.string(),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Contact Exchange Validation (re-export from contact-exchange.ts)
export { 
  contactExchangeRequestSchema,
  contactPreferencesSchema,
  messageSchema,
  trustSafetyReportSchema,
  ContactExchangeValidator
} from './contact-exchange'

// Admin Actions Validation
export const adminApplicationActionSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  action: z.enum(['approve', 'reject']),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
})

export const adminUserActionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['activate', 'deactivate', 'make_admin', 'remove_admin']),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
})

// Security and Rate Limiting
export const rateLimitSchema = z.object({
  identifier: z.string(),
  limit: z.number().min(1).max(1000),
  window: z.number().min(60).max(86400), // 1 minute to 24 hours
})

// API Request Validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// File Upload Validation
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => {
    if (!file) return false
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize
  }, 'File must be a valid image (JPEG, PNG, WebP, GIF) under 5MB'),
  alt: z.string()
    .max(200, 'Alt text must be less than 200 characters')
    .optional()
})

// Environment Variables Validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional()
})

// Input Sanitization Utilities
export class InputSanitizer {
  /**
   * Remove HTML tags and dangerous characters
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  /**
   * Sanitize user input for database storage
   */
  static sanitizeForDatabase(input: string): string {
    return input
      .replace(/[<>"\\']/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000) // Limit length
  }

  /**
   * Clean phone number to standard format
   */
  static sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '')
  }

  /**
   * Clean email address
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Check for suspicious patterns in user input
   */
  static containsSuspiciousContent(input: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /<script/i,
      /eval\(/i,
      /expression\(/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Rate limit check helper
   */
  static checkRateLimit(userId: string, action: string): boolean {
    // In production, this would integrate with Redis or similar
    // For now, we'll just log and return true
    console.log(`[Rate Limit] User ${userId} action ${action}`)
    return true
  }
}

// Validation Middleware for API Routes
export class APIValidator {
  /**
   * Validate request body against schema
   */
  static validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw new Error('Invalid request data')
    }
  }

  /**
   * Validate and sanitize user profile data
   */
  static validateProfile(data: unknown) {
    const parsed = profileSchema.parse(data)
    
    return {
      ...parsed,
      name: InputSanitizer.sanitizeForDatabase(parsed.name),
      location: parsed.location ? InputSanitizer.sanitizeForDatabase(parsed.location) : null,
      phone: parsed.phone ? InputSanitizer.sanitizePhoneNumber(parsed.phone) : null,
      applicationReason: parsed.applicationReason ? 
        InputSanitizer.sanitizeForDatabase(parsed.applicationReason) : null
    }
  }

  /**
   * Validate and sanitize help request data
   */
  static validateHelpRequest(data: unknown) {
    const parsed = helpRequestSchema.parse(data)
    
    // Check for suspicious content
    if (InputSanitizer.containsSuspiciousContent(parsed.title) ||
        (parsed.description && InputSanitizer.containsSuspiciousContent(parsed.description))) {
      throw new Error('Request contains inappropriate content')
    }
    
    return {
      ...parsed,
      title: InputSanitizer.sanitizeForDatabase(parsed.title),
      description: parsed.description ? InputSanitizer.sanitizeForDatabase(parsed.description) : null,
      locationOverride: parsed.locationOverride ? 
        InputSanitizer.sanitizeForDatabase(parsed.locationOverride) : null
    }
  }
}

// TypeScript types
export type Profile = z.infer<typeof profileSchema>
export type HelpRequest = z.infer<typeof helpRequestSchema>
export type LoginData = z.infer<typeof loginSchema>
export type SignupData = z.infer<typeof signupSchema>
export type AdminApplicationAction = z.infer<typeof adminApplicationActionSchema>
export type AdminUserAction = z.infer<typeof adminUserActionSchema>
export type PaginationParams = z.infer<typeof paginationSchema>

export default {
  profileSchema,
  helpRequestSchema,
  loginSchema,
  signupSchema,
  adminApplicationActionSchema,
  adminUserActionSchema,
  paginationSchema,
  InputSanitizer,
  APIValidator
}