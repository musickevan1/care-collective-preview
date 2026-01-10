/**
 * @fileoverview Robust Email Validation
 * 
 * Addresses Issue #10 from TESTING_ISSUES_AND_FIXES.md - Email Validation Regex
 * Uses battle-tested validation instead of custom regex patterns
 */

import validator from 'validator'
import { z } from 'zod'

/**
 * Comprehensive email validation using validator.js library
 * This is more reliable than custom regex patterns
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  return validator.isEmail(email, {
    allow_display_name: false,
    require_display_name: false,
    allow_utf8_local_part: true,
    require_tld: true,
    allow_ip_domain: false,
    domain_specific_validation: false,
    blacklisted_chars: '',
    host_blacklist: [],
  })
}

/**
 * More strict email validation for sensitive operations
 */
export function validateEmailStrict(email: string): boolean {
  if (!validateEmail(email)) {
    return false
  }
  
  // Additional checks for common issues
  const normalizedEmail = validator.normalizeEmail(email) || email
  
  // Check for common typos in domains
  const commonDomainTypos = [
    '@gmail.co',
    '@gmail.cm',
    '@gmial.com',
    '@gmai.com',
    '@yahoo.co',
    '@yahoo.cm',
    '@hotmial.com',
    '@hotmai.com',
  ]
  
  const hasTypo = commonDomainTypos.some(typo => 
    normalizedEmail.toLowerCase().includes(typo)
  )
  
  if (hasTypo) {
    return false
  }
  
  return true
}

/**
 * Zod schema for email validation
 */
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .refine(validateEmail, {
    message: 'Please enter a valid email address'
  })

/**
 * Strict email schema for sensitive operations
 */
export const emailSchemaStrict = z.string()
  .min(1, 'Email is required')
  .refine(validateEmailStrict, {
    message: 'Please enter a valid email address (check for typos)'
  })

/**
 * Email normalization using validator.js
 */
export function normalizeEmail(email: string): string | null {
  if (!validateEmail(email)) {
    return null
  }
  
  const result = validator.normalizeEmail(email, {
    gmail_lowercase: true,
    gmail_remove_dots: true,
    gmail_remove_subaddress: true,
    gmail_convert_googlemaildotcom: true,
    outlookdotcom_lowercase: true,
    outlookdotcom_remove_subaddress: true,
    yahoo_lowercase: true,
    yahoo_remove_subaddress: true,
    icloud_lowercase: true,
    icloud_remove_subaddress: true,
  })
  return result || null
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  if (!validateEmail(email)) {
    return null
  }
  
  const atIndex = email.lastIndexOf('@')
  if (atIndex === -1) {
    return null
  }
  
  return email.substring(atIndex + 1).toLowerCase()
}

/**
 * Check if email uses a disposable/temporary email service
 */
export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email)
  if (!domain) {
    return false
  }
  
  // List of common disposable email domains
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    '7mail.ga',
    'throwaway.email',
    'temp-mail.org',
    'getnada.com',
    'maildrop.cc',
  ]
  
  return disposableDomains.includes(domain)
}

/**
 * Check if email domain is from a common provider
 */
export function isCommonEmailProvider(email: string): boolean {
  const domain = getEmailDomain(email)
  if (!domain) {
    return false
  }
  
  const commonProviders = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'mail.com',
    'ymail.com',
    'live.com',
    'msn.com',
  ]
  
  return commonProviders.includes(domain)
}

/**
 * Email validation result with detailed information
 */
export interface EmailValidationResult {
  isValid: boolean
  normalizedEmail: string | null
  domain: string | null
  isDisposable: boolean
  isCommonProvider: boolean
  suggestions?: string[]
  errors: string[]
}

/**
 * Comprehensive email validation with detailed results
 */
export function validateEmailComprehensive(email: string): EmailValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required')
    return {
      isValid: false,
      normalizedEmail: null,
      domain: null,
      isDisposable: false,
      isCommonProvider: false,
      errors,
    }
  }
  
  const isValid = validateEmail(email)
  if (!isValid) {
    errors.push('Please enter a valid email address')
    
    // Check for common typos and suggest corrections
    const commonCorrections = [
      { from: '@gmail.co', to: '@gmail.com' },
      { from: '@gmail.cm', to: '@gmail.com' },
      { from: '@gmial.com', to: '@gmail.com' },
      { from: '@gmai.com', to: '@gmail.com' },
      { from: '@yahoo.co', to: '@yahoo.com' },
      { from: '@yahoo.cm', to: '@yahoo.com' },
      { from: '@hotmial.com', to: '@hotmail.com' },
      { from: '@hotmai.com', to: '@hotmail.com' },
    ]
    
    for (const correction of commonCorrections) {
      if (email.toLowerCase().includes(correction.from)) {
        const suggested = email.toLowerCase().replace(correction.from, correction.to)
        suggestions.push(`Did you mean: ${suggested}?`)
        break
      }
    }
  }
  
  const normalizedEmail = normalizeEmail(email)
  const domain = getEmailDomain(email)
  const isDisposable = isDisposableEmail(email)
  const isCommonProvider = isCommonEmailProvider(email)
  
  if (isDisposable) {
    errors.push('Temporary or disposable email addresses are not allowed')
  }
  
  return {
    isValid: isValid && !isDisposable,
    normalizedEmail,
    domain,
    isDisposable,
    isCommonProvider,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    errors,
  }
}

/**
 * React hook for email validation with real-time feedback
 */
export function useEmailValidation() {
  const validateEmailInput = (email: string) => {
    return validateEmailComprehensive(email)
  }
  
  const getEmailErrorMessage = (result: EmailValidationResult): string | null => {
    return result.errors.length > 0 ? result.errors[0] : null
  }
  
  const getEmailSuggestion = (result: EmailValidationResult): string | null => {
    return result.suggestions && result.suggestions.length > 0 ? result.suggestions[0] : null
  }
  
  return {
    validateEmail: validateEmailInput,
    getErrorMessage: getEmailErrorMessage,
    getSuggestion: getEmailSuggestion,
  }
}

/**
 * Email validation for forms with Zod
 */
export const createEmailValidationSchema = (options: {
  required?: boolean
  allowDisposable?: boolean
  strict?: boolean
} = {}) => {
  const { required = true, allowDisposable = false, strict = false } = options

  const validateEmailValue = (email: string) => {
    const result = validateEmailComprehensive(email)
    if (!result.isValid) return false
    if (!allowDisposable && result.isDisposable) return false
    if (strict && !validateEmailStrict(email)) return false
    return true
  }

  if (required) {
    return z.string().min(1, 'Email is required').refine(validateEmailValue, {
      message: 'Please enter a valid email address'
    })
  }

  return z.string().optional().refine((email) => {
    if (!email) return true
    return validateEmailValue(email)
  }, {
    message: 'Please enter a valid email address'
  })
}