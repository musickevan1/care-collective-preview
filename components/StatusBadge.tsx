import React, { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

// Memoized status configuration to prevent recreation on every render
const statusConfig: Record<RequestStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  open: {
    label: 'Open',
    variant: 'default',
    className: 'bg-dusty-rose hover:bg-dusty-rose-dark text-white'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'secondary',
    className: 'bg-sage hover:bg-sage-dark text-white'
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    className: 'bg-sage/20 text-foreground border-sage/40'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-accent/10 text-muted-foreground border-accent/30'
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    className: 'bg-accent/20 text-foreground border-accent/40'
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