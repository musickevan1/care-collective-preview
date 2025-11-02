import { z } from 'zod';
import validator from 'validator';

// Common validation helpers (from lib/validations.ts pattern)
const sanitizeString = (str: string) => str.trim().slice(0, 10000);
const sanitizeHTML = (str: string) => validator.escape(str);

// ============================================================================
// SITE CONTENT SCHEMAS
// ============================================================================

/**
 * Schema for site content sections (mission, about, events_updates)
 * Used for home page editable sections
 */
export const siteContentSchema = z.object({
  section_key: z.enum(['events_updates', 'mission', 'about'], {
    errorMap: () => ({ message: 'Invalid section key' }),
  }),
  content: z.record(z.any()), // JSONB content - flexible structure
  status: z.enum(['draft', 'published']).default('draft'),
});

export type SiteContentInput = z.infer<typeof siteContentSchema>;

/**
 * Schema for publishing a site content section
 */
export const publishSiteContentSchema = z.object({
  section_key: z.enum(['events_updates', 'mission', 'about']),
});

export type PublishSiteContentInput = z.infer<typeof publishSiteContentSchema>;

// ============================================================================
// COMMUNITY UPDATES SCHEMAS
// ============================================================================

/**
 * Schema for community updates (stats cards on home page)
 */
export const communityUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform(sanitizeString)
    .transform(sanitizeHTML)
    .refine((title) => !validator.contains(title, '<script'), 'Invalid characters in title'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform(sanitizeString)
    .transform(sanitizeHTML)
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, 'Icon name must be 50 characters or less')
    .optional()
    .nullable(),
  highlight_value: z
    .string()
    .max(50, 'Highlight value must be 50 characters or less')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  display_order: z
    .number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export type CommunityUpdateInput = z.infer<typeof communityUpdateSchema>;

/**
 * Schema for updating community update display order
 */
export const reorderCommunityUpdatesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid('Invalid update ID'),
      display_order: z.number().int().min(0),
    })
  ),
});

export type ReorderCommunityUpdatesInput = z.infer<typeof reorderCommunityUpdatesSchema>;

/**
 * Schema for publishing a community update
 */
export const publishCommunityUpdateSchema = z.object({
  id: z.string().uuid('Invalid update ID'),
});

export type PublishCommunityUpdateInput = z.infer<typeof publishCommunityUpdateSchema>;

// ============================================================================
// CALENDAR EVENT SCHEMAS
// ============================================================================

/**
 * Schema for calendar events
 */
export const calendarEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or less')
      .transform(sanitizeString)
      .transform(sanitizeHTML)
      .refine((title) => !validator.contains(title, '<script'), 'Invalid characters in title'),
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or less')
      .transform(sanitizeString)
      .transform(sanitizeHTML)
      .optional()
      .nullable(),
    category_id: z.string().uuid('Invalid category ID').optional().nullable(),
    start_date: z.string().datetime('Invalid start date format'),
    end_date: z.string().datetime('Invalid end date format'),
    all_day: z.boolean().default(false),
    timezone: z.string().max(50).default('America/Chicago').optional().nullable(),
    location: z
      .string()
      .max(200, 'Location must be 200 characters or less')
      .transform(sanitizeString)
      .transform(sanitizeHTML)
      .optional()
      .nullable(),
    location_type: z.enum(['in_person', 'virtual', 'hybrid']).optional().nullable(),
    virtual_link: z
      .string()
      .url('Invalid URL format')
      .max(500, 'URL must be 500 characters or less')
      .optional()
      .nullable(),
    status: z.enum(['draft', 'published', 'cancelled', 'archived']).default('draft'),
    max_attendees: z.number().int().min(1).optional().nullable(),
    registration_required: z.boolean().default(false),
    registration_link: z
      .string()
      .url('Invalid URL format')
      .max(500, 'URL must be 500 characters or less')
      .optional()
      .nullable(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })
  .refine(
    (data) => {
      // If location type is virtual or hybrid, virtual_link is required
      if (data.location_type === 'virtual' || data.location_type === 'hybrid') {
        return !!data.virtual_link;
      }
      return true;
    },
    {
      message: 'Virtual link is required for virtual or hybrid events',
      path: ['virtual_link'],
    }
  );

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;

/**
 * Schema for publishing a calendar event
 */
export const publishCalendarEventSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type PublishCalendarEventInput = z.infer<typeof publishCalendarEventSchema>;

// ============================================================================
// EVENT CATEGORY SCHEMAS
// ============================================================================

/**
 * Schema for event categories
 */
export const eventCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(sanitizeString)
    .transform(sanitizeHTML)
    .refine((name) => !validator.contains(name, '<script'), 'Invalid characters in name'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .transform(sanitizeString),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform(sanitizeString)
    .transform(sanitizeHTML)
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #7A9E99)')
    .default('#7A9E99'), // Brand sage color
  icon: z
    .string()
    .max(50, 'Icon name must be 50 characters or less')
    .optional()
    .nullable(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type EventCategoryInput = z.infer<typeof eventCategorySchema>;

// ============================================================================
// CONTENT REVISION SCHEMAS
// ============================================================================

/**
 * Schema for content revisions (for rollback/history)
 */
export const contentRevisionSchema = z.object({
  content_id: z.string().uuid('Invalid content ID'),
  content_type: z.enum(['site_content', 'community_update', 'calendar_event']),
  content_snapshot: z.record(z.any()), // JSONB snapshot
  change_summary: z
    .string()
    .max(500, 'Change summary must be 500 characters or less')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  revision_number: z.number().int().min(1),
});

export type ContentRevisionInput = z.infer<typeof contentRevisionSchema>;

// ============================================================================
// GENERIC PUBLISHING SCHEMAS
// ============================================================================

/**
 * Schema for generic publish actions
 */
export const publishActionSchema = z.object({
  id: z.string().uuid('Invalid ID'),
  content_type: z.enum(['site_content', 'community_update', 'calendar_event']),
});

export type PublishActionInput = z.infer<typeof publishActionSchema>;

/**
 * Schema for preview requests
 */
export const previewRequestSchema = z.object({
  id: z.string().uuid('Invalid ID'),
  content_type: z.enum(['site_content', 'community_update', 'calendar_event']),
});

export type PreviewRequestInput = z.infer<typeof previewRequestSchema>;
