'use client'

import DOMPurify from 'dompurify'
import { validateAndSanitizeInput } from '@/lib/validations'
import { z } from 'zod'

/**
 * Client-side sanitization utilities for forms
 */

// Configure DOMPurify for strict sanitization
const configureDOMPurify = () => {
  if (typeof window !== 'undefined') {
    DOMPurify.setConfig({
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
      FORBID_TAGS: ['script', 'style'], // Block script and style tags
      FORBID_ATTR: ['onerror', 'onload', 'onclick'], // Block event handlers
    })
  }
}

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeTextInput = (input: string): string => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return input.replace(/<[^>]*>/g, '').trim()
  }
  
  configureDOMPurify()
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim()
}

/**
 * Secure form field handler
 */
export const createSecureFieldHandler = <T>(
  schema: z.ZodSchema<T>,
  setValue: (value: T) => void,
  setError?: (error: string | null) => void
) => {
  return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const rawValue = event.target.value
    
    // First sanitize the input
    const sanitizedValue = sanitizeTextInput(rawValue)
    
    // Then validate with schema
    const validation = validateAndSanitizeInput(schema, sanitizedValue)
    
    if (validation.success) {
      setValue(validation.data)
      setError?.(null)
    } else {
      // Still set the sanitized value but show error
      setValue(sanitizedValue as T)
      setError?.(validation.error)
    }
  }
}

/**
 * Secure form submission handler
 */
export const createSecureSubmitHandler = <T>(
  schema: z.ZodSchema<T>,
  data: any,
  onSuccess: (validatedData: T) => void,
  onError: (error: string) => void
) => {
  return (event: React.FormEvent) => {
    event.preventDefault()
    
    // Sanitize all string fields in the data
    const sanitizedData = sanitizeFormData(data)
    
    // Validate the sanitized data
    const validation = validateAndSanitizeInput(schema, sanitizedData)
    
    if (validation.success) {
      onSuccess(validation.data)
    } else {
      onError(validation.error)
    }
  }
}

/**
 * Recursively sanitize form data object
 */
export const sanitizeFormData = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeTextInput(data)
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeFormData)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeFormData(value)
    }
    return sanitized
  }
  
  return data
}

/**
 * Check for potential XSS patterns
 */
export const detectXSSPatterns = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<img[^>]*src\s*=\s*["']javascript:[^"']*["']/gi,
    /<link[^>]*href\s*=\s*["']javascript:[^"']*["']/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Enhanced input validation with XSS detection
 */
export const validateInputSecurity = (input: string): {
  isValid: boolean
  issues: string[]
  sanitized: string
} => {
  const issues: string[] = []
  
  // Check for XSS patterns
  if (detectXSSPatterns(input)) {
    issues.push('Potentially malicious content detected')
  }
  
  // Check for suspicious characters
  if (input.includes('<') || input.includes('>')) {
    issues.push('HTML tags are not allowed')
  }
  
  if (input.includes('javascript:') || input.includes('vbscript:')) {
    issues.push('Script URLs are not allowed')
  }
  
  // Check for excessively long input (potential DoS)
  if (input.length > 10000) {
    issues.push('Input is too long')
  }
  
  // Sanitize the input
  const sanitized = sanitizeTextInput(input)
  
  return {
    isValid: issues.length === 0,
    issues,
    sanitized
  }
}

/**
 * React hook for secure form state management
 */
export const useSecureFormState = <T>(
  initialState: T,
  schema: z.ZodSchema<T>
) => {
  const [state, setState] = React.useState<T>(initialState)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isValid, setIsValid] = React.useState(false)
  
  const updateField = (field: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = sanitizeTextInput(event.target.value)
    const newState = { ...state, [field]: value }
    
    setState(newState)
    
    // Validate the entire form
    const validation = validateAndSanitizeInput(schema, newState)
    if (validation.success) {
      setErrors({})
      setIsValid(true)
    } else {
      // Parse Zod errors to field-specific errors
      const fieldErrors: Record<string, string> = {}
      try {
        schema.parse(newState)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((err: z.ZodIssue) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message
            }
          })
        }
      }
      setErrors(fieldErrors)
      setIsValid(false)
    }
  }
  
  const submitForm = (onSubmit: (data: T) => void) => (event: React.FormEvent) => {
    event.preventDefault()
    
    if (isValid) {
      onSubmit(state)
    }
  }
  
  return {
    state,
    errors,
    isValid,
    updateField,
    submitForm,
  }
}

// Import React for the hook
import React from 'react'