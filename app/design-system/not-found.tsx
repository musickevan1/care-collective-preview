import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DesignSystemNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Design System Not Available</h2>
        <p className="text-muted-foreground mb-6">
          The design system is only available in development mode.
        </p>
        <Link href="/">
          <Button>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
}