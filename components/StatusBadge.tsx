import React, { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

// Memoized status configuration to prevent recreation on every render
// Enhanced with better contrast for admin panel visibility
const statusConfig: Record<RequestStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'sage' | 'rose' | 'success' | 'warning'
  className: string
}> = {
  open: {
    label: 'Open',
    variant: 'rose',
    className: 'bg-dusty-rose-accessible text-white border-transparent font-medium shadow-sm'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'sage',
    className: 'bg-sage-accessible text-white border-transparent font-medium shadow-sm'
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    className: 'bg-green-600 text-white border-transparent font-medium shadow-sm'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-700 border-gray-300 font-medium'
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-600 border-gray-200 font-medium'
  }
} as const

// Memoized component to prevent unnecessary re-renders
export const StatusBadge = memo<StatusBadgeProps>(({ status, className }) => {
  // Memoize config lookup to avoid repeated object access
  const config = useMemo(() => 
    statusConfig[status] || statusConfig.open, 
    [status]
  )

  // Memoize className computation
  const badgeClassName = useMemo(() => 
    cn(config.className, className), 
    [config.className, className]
  )
  
  return (
    <Badge 
      variant={config.variant}
      className={badgeClassName}
    >
      {config.label}
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'