'use client'

import { FormEvent, ReactNode, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorState, FormErrorState } from './ErrorState'
import { useFormErrorHandler } from '@/hooks/useErrorHandler'
import { Card } from './ui/card'

interface SafeFormWrapperProps {
  children: ReactNode
  onSubmit: (formData: FormData) => Promise<void> | void
  formName?: string
  className?: string
  showErrorInline?: boolean
  resetOnSuccess?: boolean
}

export function SafeFormWrapper({
  children,
  onSubmit,
  formName = 'form',
  className = '',
  showErrorInline = true,
  resetOnSuccess = false
}: SafeFormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { 
    isError, 
    errorMessage, 
    supportMessage, 
    handleSubmitError, 
    clearError 
  } = useFormErrorHandler(formName)

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (isSubmitting) return

    setIsSubmitting(true)
    setIsSuccess(false)
    clearError()

    try {
      const formData = new FormData(event.currentTarget)
      await onSubmit(formData)
      
      setIsSuccess(true)
      
      if (resetOnSuccess) {
        event.currentTarget.reset()
      }
    } catch (error) {
      handleSubmitError(error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const retrySubmission = () => {
    clearError()
    // The user will need to click submit again
  }

  return (
    <ErrorBoundary
      fallback={
        <Card className="p-6">
          <ErrorState
            title="Form error"
            message="There was a problem with this form. Please refresh the page and try again."
            showHomeButton={false}
            showHelpButton={true}
          />
        </Card>
      }
    >
      <form 
        onSubmit={handleFormSubmit} 
        className={className}
        noValidate
      >
        {/* Success message */}
        {isSuccess && !isError && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✓ Successfully submitted!
            </p>
          </div>
        )}

        {/* Error display */}
        {isError && showErrorInline && (
          <div className="mb-4">
            <FormErrorState 
              onRetry={retrySubmission}
              error={new Error(errorMessage || 'Form submission failed')}
            />
          </div>
        )}

        {/* Form content with submission state */}
        <fieldset disabled={isSubmitting} className={isSubmitting ? 'opacity-60' : ''}>
          {children}
        </fieldset>

        {/* Loading indicator */}
        {isSubmitting && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Submitting...
            </div>
          </div>
        )}
      </form>
    </ErrorBoundary>
  )
}

// Enhanced form wrapper with field-level error handling
interface SafeFormFieldProps {
  children: ReactNode
  name: string
  label?: string
  required?: boolean
  error?: string
  className?: string
}

export function SafeFormField({
  children,
  name,
  label,
  required = false,
  error,
  className = ''
}: SafeFormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={error ? 'ring-2 ring-red-500 rounded' : ''}>
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}
      
      {/* Accessibility enhancement */}
      {error && (
        <div 
          id={`${name}-error`} 
          role="alert" 
          aria-live="polite" 
          className="sr-only"
        >
          {error}
        </div>
      )}
    </div>
  )
}

// Helper hook for managing form field errors
export function useFormFieldValidation() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setFieldError = (field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const clearAllErrors = () => {
    setFieldErrors({})
  }

  const hasErrors = Object.keys(fieldErrors).length > 0
  const getFieldError = (field: string) => fieldErrors[field]

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasErrors,
    getFieldError
  }
}