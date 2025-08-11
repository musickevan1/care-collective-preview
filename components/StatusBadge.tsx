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
    className: 'bg-gray-100 text-gray-700 border-gray-300'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-500 border-gray-200'
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-600 border-gray-300'
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