import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return async function middleware(request: NextRequest) {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      
      // Attach validated data to request
      (request as any).validatedData = validated;
      
      return null; // Continue with request
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}

// Helper function for validating query parameters
export function validateQuery(schema: ZodSchema, params: any) {
  try {
    return { data: schema.parse(params), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: {
          message: 'Invalid query parameters',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      };
    }
    return {
      data: null,
      error: { message: 'Invalid request' },
    };
  }
}

// Helper function for form validation in client components
export function validateForm<T>(schema: ZodSchema<T>, data: unknown): {
  data: T | null;
  errors: Record<string, string> | null;
} {
  try {
    const validated = schema.parse(data);
    return { data: validated, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      return { data: null, errors };
    }
    return { data: null, errors: { general: 'Validation failed' } };
  }
}