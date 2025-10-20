import { validateUUID, sanitizeSearchQuery } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * SQL injection prevention utilities for Supabase
 */

interface QueryConfig {
  table: string
  allowedColumns: string[]
  maxLimit?: number
  requireAuth?: boolean
}

/**
 * Safe query builder for SELECT operations
 */
export class SafeQueryBuilder {
  private supabase: SupabaseClient
  private config: QueryConfig

  constructor(supabase: SupabaseClient, config: QueryConfig) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Safe select with column validation
   */
  select(columns: string | string[] = '*') {
    const validatedColumns = this.validateColumns(columns)
    return this.supabase.from(this.config.table).select(validatedColumns)
  }

  /**
   * Safe filter by ID (UUID validation)
   */
  filterById(id: string) {
    if (!validateUUID(id)) {
      throw new Error('Invalid UUID format')
    }
    return this.select().eq('id', id)
  }

  /**
   * Safe filter by user ID
   */
  filterByUserId(userId: string) {
    if (!validateUUID(userId)) {
      throw new Error('Invalid user ID format')
    }
    return this.select().eq('user_id', userId)
  }

  /**
   * Safe text search with sanitization
   */
  search(column: string, query: string) {
    if (!this.config.allowedColumns.includes(column)) {
      throw new Error(`Column '${column}' is not allowed for searching`)
    }
    
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (sanitizedQuery.length === 0) {
      throw new Error('Search query cannot be empty after sanitization')
    }
    
    return this.select().ilike(column, `%${sanitizedQuery}%`)
  }

  /**
   * Safe ordering with column validation
   */
  orderBy(column: string, ascending: boolean = true) {
    if (!this.config.allowedColumns.includes(column)) {
      throw new Error(`Column '${column}' is not allowed for ordering`)
    }
    
    return this.select().order(column, { ascending })
  }

  /**
   * Safe pagination with limits
   */
  paginate(page: number, limit: number) {
    const maxLimit = this.config.maxLimit || 100
    const safeLimit = Math.min(Math.max(1, limit), maxLimit)
    const safePage = Math.max(0, page)
    const offset = safePage * safeLimit
    
    return this.select().range(offset, offset + safeLimit - 1)
  }

  /**
   * Validate and sanitize column names
   */
  private validateColumns(columns: string | string[]): string {
    if (columns === '*') {
      return '*'
    }
    
    const columnArray = Array.isArray(columns) ? columns : [columns]
    const validColumns = columnArray.filter(col => 
      this.config.allowedColumns.includes(col.trim())
    )
    
    if (validColumns.length === 0) {
      throw new Error('No valid columns specified')
    }
    
    return validColumns.join(', ')
  }
}

/**
 * Safe insert/update operations
 */
export class SafeDataWriter {
  private supabase: SupabaseClient
  private config: QueryConfig

  constructor(supabase: SupabaseClient, config: QueryConfig) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Safe insert with data validation
   */
  async insert(data: Record<string, any>, userId?: string) {
    const sanitizedData = this.validateAndSanitizeData(data)
    
    // Add user_id if required and provided
    if (this.config.requireAuth && userId) {
      if (!validateUUID(userId)) {
        throw new Error('Invalid user ID format')
      }
      sanitizedData.user_id = userId
    }
    
    return this.supabase.from(this.config.table).insert(sanitizedData)
  }

  /**
   * Safe update with ID validation
   */
  async update(id: string, data: Record<string, any>, userId?: string) {
    if (!validateUUID(id)) {
      throw new Error('Invalid ID format')
    }
    
    const sanitizedData = this.validateAndSanitizeData(data)
    
    let query = this.supabase.from(this.config.table).update(sanitizedData).eq('id', id)
    
    // Add user ownership check if required
    if (this.config.requireAuth && userId) {
      if (!validateUUID(userId)) {
        throw new Error('Invalid user ID format')
      }
      query = query.eq('user_id', userId)
    }
    
    return query
  }

  /**
   * Safe delete with ID validation
   */
  async delete(id: string, userId?: string) {
    if (!validateUUID(id)) {
      throw new Error('Invalid ID format')
    }
    
    let query = this.supabase.from(this.config.table).delete().eq('id', id)
    
    // Add user ownership check if required
    if (this.config.requireAuth && userId) {
      if (!validateUUID(userId)) {
        throw new Error('Invalid user ID format')
      }
      query = query.eq('user_id', userId)
    }
    
    return query
  }

  /**
   * Validate and sanitize data for insert/update
   */
  private validateAndSanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      // Check if column is allowed
      if (!this.config.allowedColumns.includes(key)) {
        throw new Error(`Column '${key}' is not allowed`)
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeSearchQuery(value)
      } else if (value === null || value === undefined) {
        sanitized[key] = null
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }
}

/**
 * Factory functions for creating safe query builders
 */

export async function createSafeProfileQuery() {
  const supabase = await createClient()
  return new SafeQueryBuilder(supabase, {
    table: 'profiles',
    allowedColumns: ['id', 'name', 'location', 'created_at', 'is_admin'],
    maxLimit: 50,
    requireAuth: true,
  })
}

export async function createSafeHelpRequestQuery() {
  const supabase = await createClient()
  return new SafeQueryBuilder(supabase, {
    table: 'help_requests',
    allowedColumns: [
      'id', 'user_id', 'title', 'description', 'category', 
      'urgency', 'status', 'location_override', 'location_privacy',
      'created_at', 'updated_at'
    ],
    maxLimit: 100,
    requireAuth: false,
  })
}

export async function createSafeMessageQuery() {
  const supabase = await createClient()
  return new SafeQueryBuilder(supabase, {
    table: 'messages',
    allowedColumns: [
      'id', 'request_id', 'sender_id', 'recipient_id', 
      'content', 'read', 'created_at'
    ],
    maxLimit: 50,
    requireAuth: true,
  })
}

export async function createSafeProfileWriter() {
  const supabase = await createClient()
  return new SafeDataWriter(supabase, {
    table: 'profiles',
    allowedColumns: ['name', 'location'],
    requireAuth: true,
  })
}

export async function createSafeHelpRequestWriter() {
  const supabase = await createClient()
  return new SafeDataWriter(supabase, {
    table: 'help_requests',
    allowedColumns: [
      'title', 'description', 'category', 'urgency', 
      'location_override', 'location_privacy', 'status'
    ],
    requireAuth: true,
  })
}

export async function createSafeMessageWriter() {
  const supabase = await createClient()
  return new SafeDataWriter(supabase, {
    table: 'messages',
    allowedColumns: ['request_id', 'recipient_id', 'content'],
    requireAuth: true,
  })
}

/**
 * Additional security checks
 */

export function validateQueryParams(params: Record<string, any>): void {
  for (const [key, value] of Object.entries(params)) {
    // Check for SQL injection patterns
    if (typeof value === 'string') {
      const suspiciousPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /--/,
        /\/\*/,
        /\*\//,
        /;/,
        /'/,
        /"/,
      ]
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error(`Suspicious pattern detected in parameter '${key}'`)
        }
      }
    }
    
    // Validate UUIDs
    if (key.includes('id') && typeof value === 'string' && !validateUUID(value)) {
      throw new Error(`Invalid UUID format for parameter '${key}'`)
    }
  }
}

/**
 * Rate limiting for database operations
 */
export const dbOperationLimits = {
  select: { windowMs: 60000, max: 100 }, // 100 selects per minute
  insert: { windowMs: 60000, max: 10 },  // 10 inserts per minute
  update: { windowMs: 60000, max: 20 },  // 20 updates per minute
  delete: { windowMs: 60000, max: 5 },   // 5 deletes per minute
}