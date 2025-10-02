import { ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AccessDeniedPage(): ReactElement {
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
          <div className="text-6xl">🚫</div>

          <CardTitle className="text-3xl font-bold text-secondary">
            Access Not Available
          </CardTitle>

          <CardDescription className="text-lg">
            Your application to join the Care Collective has been reviewed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information Panel */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-left">
            <h2 className="font-semibold text-yellow-900 mb-2">
              What this means
            </h2>
            <p className="text-sm text-yellow-800 mb-4">
              After careful review, we're unable to approve your membership at this time.
              This decision is made to ensure the safety and trust of our community.
            </p>
            <p className="text-sm text-yellow-800">
              If you believe this was made in error or have questions, please contact our support team.
            </p>
          </div>

          {/* Contact Support */}
          <div className="space-y-4">
            <a
              href="mailto:swmocarecollective@gmail.com"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
            >
              Contact Support
            </a>

            <div className="text-sm text-muted-foreground text-center">
              <Link href="/" className="text-sage hover:underline">
                Return to homepage
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
