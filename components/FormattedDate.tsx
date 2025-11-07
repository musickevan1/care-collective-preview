'use client'

/**
 * @fileoverview Client-only date formatting component
 * Prevents hydration mismatches by ensuring dates are formatted only on client
 */

import { ReactElement } from 'react'
import { format } from 'date-fns'

interface FormattedDateProps {
  date: string | Date
  formatString?: string
  className?: string
}

/**
 * FormattedDate - Client-only date formatter to prevent hydration mismatches
 *
 * @param date - ISO date string or Date object
 * @param formatString - date-fns format string (default: 'MMM d, yyyy')
 * @param className - Optional CSS classes
 */
export function FormattedDate({
  date,
  formatString = 'MMM d, yyyy',
  className
}: FormattedDateProps): ReactElement {
  return (
    <span className={className}>
      {format(new Date(date), formatString)}
    </span>
  )
}
