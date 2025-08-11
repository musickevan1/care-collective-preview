import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

const statusConfig: Record<RequestStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  open: {
    label: 'Open',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'secondary',
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    className: 'bg-accent/20 text-foreground border-accent/40'
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
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}