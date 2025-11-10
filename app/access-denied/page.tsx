import { ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'

interface AccessDeniedPageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function AccessDeniedPage({ searchParams }: AccessDeniedPageProps): Promise<ReactElement> {
  // Await searchParams (required in Next.js 14+)
  const { reason } = await searchParams

  // Define messages for different denial reasons
  const messages = {
    rejected: {
      title: 'Application Not Approved',
      description: 'Your application to join the CARE Collective has been reviewed.',
      icon: '🚫',
      color: 'yellow',
      details: 'After careful review, we\'re unable to approve your membership at this time. This decision is made to ensure the safety and trust of our community.',
      action: 'If you believe this was made in error or have questions, please contact our support team.',
    },
    not_admin: {
      title: 'Admin Access Required',
      description: 'You do not have administrator privileges for this area.',
      icon: '🔒',
      color: 'red',
      details: 'This section is restricted to CARE Collective administrators only.',
      action: 'If you need admin access, please contact a current administrator.',
    },
    session_invalidated: {
      title: 'Session Expired',
      description: 'Your session has been invalidated.',
      icon: '⏱️',
      color: 'blue',
      details: 'This may occur if your account status changed or you logged in from another device.',
      action: 'Please log in again to continue using CARE Collective.',
    },
    default: {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
      icon: '🚫',
      color: 'yellow',
      details: 'Access to this area is restricted.',
      action: 'If you believe this is an error, please contact support.',
    },
  }

  // Select appropriate message based on reason
  const message = messages[reason as keyof typeof messages] || messages.default

  // Color classes for different reasons
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      textTitle: 'text-yellow-900',
      textBody: 'text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      textTitle: 'text-red-900',
      textBody: 'text-red-800',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textTitle: 'text-blue-900',
      textBody: 'text-blue-800',
    },
  }

  const colors = colorClasses[message.color as keyof typeof colorClasses] || colorClasses.yellow

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Care Collective Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>

          {/* Main Icon */}
          <div className="text-6xl" role="img" aria-label={message.title}>
            {message.icon}
          </div>

          <CardTitle className="text-3xl font-bold text-secondary">
            {message.title}
          </CardTitle>

          <CardDescription className="text-lg">
            {message.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information Panel */}
          <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 text-left`}>
            <h2 className={`font-semibold ${colors.textTitle} mb-2`}>
              What this means
            </h2>
            <p className={`text-sm ${colors.textBody} mb-4`}>
              {message.details}
            </p>
            <p className={`text-sm ${colors.textBody}`}>
              {message.action}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <a
              href="mailto:swmocarecollective@gmail.com"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
            >
              Contact Support
            </a>

            <div className="flex flex-col gap-2">
              <Link href="/" className="text-center">
                <Button variant="outline" className="w-full">
                  Return to Homepage
                </Button>
              </Link>
              <Link href="/login" className="text-center">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-muted-foreground text-center">
            <p>
              We take community safety seriously. For privacy, we cannot provide
              specific details about moderation decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
