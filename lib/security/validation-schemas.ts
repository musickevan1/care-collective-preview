import { z } from 'zod';

// HTML tag detection regex
const htmlTagRegex = /<[^>]*>/g;

// SQL injection patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b.*=.*)/i,
];

// Custom validation functions
const noHTML = (val: string) => !htmlTagRegex.test(val);
const noSQL = (val: string) => !sqlInjectionPatterns.some(pattern => pattern.test(val));

// Help Request Schema
export const helpRequestSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .refine(noSQL, 'Invalid characters detected'),
    
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  category: z.enum([
    'transportation', 'household', 'meals', 'childcare',
    'petcare', 'technology', 'companionship', 'respite',
    'emotional', 'groceries', 'medical', 'other'
  ]),
  
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  location_privacy: z.enum(['public', 'helpers_only', 'after_match'])
    .default('helpers_only'),
});

// User Profile Schema
export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .refine(noSQL, 'Invalid characters detected'),
    
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  skills: z.array(z.string().max(30))
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
    
  email: z.string()
    .email('Invalid email address')
    .optional(),
    
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number')
    .optional(),
});

// Contact Exchange Schema
export const contactExchangeSchema = z.object({
  request_id: z.string()
    .uuid('Invalid request ID'),
    
  consent: z.literal(true),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(200, 'Message must be less than 200 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
});

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim()),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .refine(noHTML, 'HTML tags are not allowed'),
  acceptTerms: z.literal(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password Reset Schema
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim()),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Message Schema
export const messageSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters')
    .refine(noHTML, 'HTML tags are not allowed'),
});

// Search Schema
export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .refine(noSQL, 'Invalid search query'),
  filters: z.object({
    category: z.enum([
      'transportation', 'household', 'meals', 'childcare',
      'petcare', 'technology', 'companionship', 'respite',
      'emotional', 'groceries', 'medical', 'other'
    ]).optional(),
    urgency: z.enum(['normal', 'urgent', 'critical']).optional(),
    status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
    distance: z.number().min(1).max(100).optional(),
  }).optional(),
  sort: z.enum(['newest', 'oldest', 'urgent', 'distance']).default('newest'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Type exports
export type HelpRequestInput = z.infer<typeof helpRequestSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ContactExchangeInput = z.infer<typeof contactExchangeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SearchInput = z.infer<typeof searchSchema>;