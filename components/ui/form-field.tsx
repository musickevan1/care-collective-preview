/**
 * @fileoverview Form Field Component with Accessibility and Error Handling
 * 
 * Addresses Issue #5 from TESTING_ISSUES_AND_FIXES.md - Form Validation Error Messages
 * Ensures consistent error handling and accessibility across all forms
 */

'use client'

import { ReactElement, ReactNode, useId } from 'react'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  children: ReactNode
  label: string
  error?: string
  warning?: string
  help?: string
  required?: boolean
  className?: string
}

/**
 * FormField component that provides consistent form field styling and accessibility
 * Automatically handles ARIA attributes for error states and screen reader support
 */
export function FormField({ 
  children, 
  label, 
  error, 
  warning,
  help,
  required = false,
  className 
}: FormFieldProps): ReactElement {
  const fieldId = useId()
  const errorId = useId()
  const helpId = useId()
  
  // Clone the child element to add required props
  const childWithProps = children && typeof children === 'object' && 'props' in children 
    ? {
        ...children,
        props: {
          ...children.props,
          id: fieldId,
          'aria-describedby': [
            error ? errorId : undefined,
            help ? helpId : undefined,
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': !!error,
          'aria-required': required,
        }
      }
    : children

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with required indicator */}
      <Label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      
      {/* Form input/control */}
      {childWithProps}
      
      {/* Help text */}
      {help && !error && !warning && (
        <p 
          id={helpId}
          className="text-sm text-muted-foreground"
        >
          {help}
        </p>
      )}
      
      {/* Warning message */}
      {warning && !error && (
        <div
          className="text-sm text-yellow-600 flex items-center gap-2"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      
      {/* Error message - highest priority */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="text-sm text-red-600 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

/**
 * FormFieldSet component for grouping related form fields
 */
interface FormFieldSetProps {
  children: ReactNode
  legend: string
  description?: string
  className?: string
}

export function FormFieldSet({ 
  children, 
  legend, 
  description,
  className 
}: FormFieldSetProps): ReactElement {
  const descriptionId = useId()
  
  return (
    <fieldset 
      className={cn('space-y-4', className)}
      aria-describedby={description ? descriptionId : undefined}
    >
      <legend className="text-lg font-semibold leading-none tracking-tight">
        {legend}
      </legend>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  )
}

/**
 * FormActions component for consistent form action buttons
 */
interface FormActionsProps {
  children: ReactNode
  className?: string
}

export function FormActions({ children, className }: FormActionsProps): ReactElement {
  return (
    <div className={cn('flex items-center gap-3 pt-4', className)}>
      {children}
    </div>
  )
}

/**
 * FormMessage component for standalone messages
 */
interface FormMessageProps {
  children: ReactNode
  variant?: 'error' | 'warning' | 'success' | 'info'
  className?: string
}

export function FormMessage({ 
  children, 
  variant = 'info',
  className 
}: FormMessageProps): ReactElement {
  const baseClasses = 'text-sm flex items-center gap-2'
  
  const variantClasses = {
    error: 'text-red-600',
    warning: 'text-yellow-600', 
    success: 'text-green-600',
    info: 'text-muted-foreground'
  }
  
  const showIcon = variant === 'error' || variant === 'warning'
  
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {showIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      <span>{children}</span>
    </div>
  )
}