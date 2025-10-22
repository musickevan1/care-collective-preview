import { PostgrestError } from '@supabase/supabase-js'
import { Logger } from './logger'
// Temporarily disabled to fix build issue
// import { captureError } from './error-tracking'
import { CareCollectiveError, ErrorCode } from './api-error'

export interface SupabaseErrorContext {
  operation: string
  table?: string
  userId?: string
  query?: any
  filters?: any
}

export class SupabaseErrorHandler {
  /**
   * Handle and transform Supabase errors into CareCollectiveError instances
   */
  static handleError(
    error: PostgrestError | Error,
    context: SupabaseErrorContext
  ): CareCollectiveError {
    // Log the original error
    Logger.getInstance().databaseOperation(
      context.operation,
      context.table,
      false,
      error
    )

    // Track the error
    // Temporarily disabled to fix build issue
    // captureError(error, {
    //   component: 'SupabaseClient',
    //   action: context.operation,
    //   extra: {
    //     table: context.table,
    //     query: context.query,
    //     filters: context.filters
    //   }
    // })

    // Handle PostgrestError specifically
    if ('code' in error && 'details' in error) {
      return this.handlePostgrestError(error as PostgrestError, context)
    }

    // Handle generic errors
    return new CareCollectiveError(
      ErrorCode.DATABASE_ERROR,
      'A database error occurred',
      { originalError: error.message, context }
    )
  }

  private static handlePostgrestError(
    error: PostgrestError,
    context: SupabaseErrorContext
  ): CareCollectiveError {
    const { code, message, details, hint } = error

    // Map Postgres error codes to our error types
    switch (code) {
      case 'PGRST116': // Not found
        return new CareCollectiveError(
          ErrorCode.NOT_FOUND,
          `${context.table || 'Resource'} not found`,
          { details, hint, context }
        )

      case 'PGRST204': // Invalid body
      case '22P02': // Invalid input syntax
      case '23502': // Not null violation
        return new CareCollectiveError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid data provided',
          { details: message, hint, context }
        )

      case '23505': // Unique violation
        return new CareCollectiveError(
          ErrorCode.ALREADY_EXISTS,
          'This record already exists',
          { details, hint, context }
        )

      case '23503': // Foreign key violation
        return new CareCollectiveError(
          ErrorCode.VALIDATION_ERROR,
          'Referenced record does not exist',
          { details, hint, context }
        )

      case '23514': // Check violation
        return new CareCollectiveError(
          ErrorCode.VALIDATION_ERROR,
          'Data validation failed',
          { details, hint, context }
        )

      case 'PGRST103': // Forbidden
      case '42501': // Insufficient privilege
        return new CareCollectiveError(
          ErrorCode.FORBIDDEN,
          'You do not have permission to perform this action',
          { details, hint, context }
        )

      case 'PGRST301': // Row Level Security
        return new CareCollectiveError(
          ErrorCode.FORBIDDEN,
          'Access denied by security policy',
          { details, hint, context }
        )

      case 'PGRST102': // Schema cache reloaded
      case '08000': // Connection exception
      case '08003': // Connection does not exist
      case '08006': // Connection failure
        return new CareCollectiveError(
          ErrorCode.DATABASE_ERROR,
          'Database connection issue',
          { details, hint, context }
        )

      case '53000': // Insufficient resources
      case '53100': // Disk full
      case '53200': // Out of memory
      case '53300': // Too many connections
        return new CareCollectiveError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Database service temporarily unavailable',
          { details, hint, context }
        )

      default:
        // Log unknown error codes for future handling
        Logger.getInstance().warn(`Unknown Supabase error code: ${code}`, {
          code,
          message,
          details,
          hint,
          context
        })

        return new CareCollectiveError(
          ErrorCode.DATABASE_ERROR,
          'A database error occurred',
          { code, details, hint, context }
        )
    }
  }

  /**
   * Wrap a Supabase operation with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    context: SupabaseErrorContext
  ): Promise<T> {
    try {
      const { data, error } = await operation()

      if (error) {
        throw this.handleError(error, context)
      }

      if (data === null && context.operation.includes('select')) {
        // For select operations, null data might indicate not found
        throw new CareCollectiveError(
          ErrorCode.NOT_FOUND,
          `${context.table || 'Resource'} not found`,
          { context }
        )
      }

      // Log successful operations
      Logger.getInstance().databaseOperation(context.operation, context.table, true)

      return data as T
    } catch (error) {
      if (error instanceof CareCollectiveError) {
        throw error
      }

      // Handle unexpected errors
      throw this.handleError(error as Error, context)
    }
  }

  /**
   * Helper for select operations that may return empty results
   */
  static async withErrorHandlingAllowEmpty<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    context: SupabaseErrorContext
  ): Promise<T | null> {
    try {
      const { data, error } = await operation()

      if (error) {
        throw this.handleError(error, context)
      }

      // Log successful operations
      Logger.getInstance().databaseOperation(context.operation, context.table, true)

      return data
    } catch (error) {
      if (error instanceof CareCollectiveError) {
        throw error
      }

      throw this.handleError(error as Error, context)
    }
  }
}

// Convenience wrapper functions for common operations
export const dbQuery = {
  /**
   * Execute a select query with error handling
   */
  async select<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    table: string,
    allowEmpty: boolean = false
  ): Promise<T | null> {
    const context: SupabaseErrorContext = {
      operation: 'select',
      table
    }

    if (allowEmpty) {
      return SupabaseErrorHandler.withErrorHandlingAllowEmpty(operation, context)
    }

    return SupabaseErrorHandler.withErrorHandling(operation, context)
  },

  /**
   * Execute an insert query with error handling
   */
  async insert<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    table: string,
    data?: any
  ): Promise<T> {
    const context: SupabaseErrorContext = {
      operation: 'insert',
      table,
      query: data
    }

    return SupabaseErrorHandler.withErrorHandling(operation, context)
  },

  /**
   * Execute an update query with error handling
   */
  async update<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    table: string,
    data?: any,
    filters?: any
  ): Promise<T> {
    const context: SupabaseErrorContext = {
      operation: 'update',
      table,
      query: data,
      filters
    }

    return SupabaseErrorHandler.withErrorHandling(operation, context)
  },

  /**
   * Execute a delete query with error handling
   */
  async delete<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    table: string,
    filters?: any
  ): Promise<T> {
    const context: SupabaseErrorContext = {
      operation: 'delete',
      table,
      filters
    }

    return SupabaseErrorHandler.withErrorHandling(operation, context)
  },

  /**
   * Execute an upsert query with error handling
   */
  async upsert<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    table: string,
    data?: any
  ): Promise<T> {
    const context: SupabaseErrorContext = {
      operation: 'upsert',
      table,
      query: data
    }

    return SupabaseErrorHandler.withErrorHandling(operation, context)
  }
}

// Enhanced Supabase client wrapper with automatic error handling
export function createEnhancedSupabaseClient(supabase: any) {
  return {
    // Proxy the original client for direct access
    client: supabase,

    // Enhanced table operations
    from: (table: string) => ({
      select: (columns?: string) => ({
        async execute<T>(): Promise<T | null> {
          return dbQuery.select(
            () => supabase.from(table).select(columns),
            table,
            true
          )
        },

        async single<T>(): Promise<T> {
          const result = await dbQuery.select(
            () => supabase.from(table).select(columns).single(),
            table,
            false
          )
          return result as T
        },

        eq: (column: string, value: any) => ({
          async execute<T>(): Promise<T | null> {
            return dbQuery.select(
              () => supabase.from(table).select(columns).eq(column, value),
              table,
              true
            )
          },

          async single<T>(): Promise<T> {
            const result = await dbQuery.select(
              () => supabase.from(table).select(columns).eq(column, value).single(),
              table,
              false
            )
            return result as T
          }
        })
      }),

      async insert<T>(data: any): Promise<T> {
        return dbQuery.insert(
          () => supabase.from(table).insert(data).select().single(),
          table,
          data
        )
      },

      async update<T>(data: any): Promise<T> {
        return dbQuery.update(
          () => supabase.from(table).update(data).select().single(),
          table,
          data
        )
      },

      async delete<T>(filters: any): Promise<T> {
        return dbQuery.delete(
          () => supabase.from(table).delete().match(filters).select().single(),
          table,
          filters
        )
      },

      async upsert<T>(data: any): Promise<T> {
        return dbQuery.upsert(
          () => supabase.from(table).upsert(data).select().single(),
          table,
          data
        )
      }
    })
  }
}