import { ReactElement } from 'react';
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ArrowLeft, Home } from 'lucide-react'

export default function RequestNotFound(): ReactElement {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto shadow-lg border-sage/20">
        <CardHeader className="pb-4">
          {/* Care Collective Branding */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-sage" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-foreground">
            Help Request Not Found
          </CardTitle>
          
          <CardDescription className="text-base">
            The help request you&apos;re looking for doesn&apos;t exist or may have been removed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>This could happen if:</p>
            <ul className="text-left space-y-1 max-w-sm mx-auto">
              <li>• The request was completed and archived</li>
              <li>• The link you used is incorrect or outdated</li>
              <li>• You don&apos;t have permission to view this request</li>
            </ul>
          </div>

          {/* Navigation Options */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-sage hover:bg-sage-dark">
              <Link href="/requests" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse All Requests
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="border-sage text-sage hover:bg-sage/5">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-sage/20 pt-6 mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Looking to help someone in your community?
            </p>
            <Button asChild variant="ghost" size="sm" className="text-dusty-rose hover:text-dusty-rose-dark hover:bg-dusty-rose/5">
              <Link href="/requests/new" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Create New Request
              </Link>
            </Button>
          </div>

          {/* Support Notice */}
          <div className="mt-6 p-4 bg-sage/5 border border-sage/20 rounded-lg text-sm">
            <p className="font-medium text-sage-dark mb-1">
              Need help finding a specific request?
            </p>
            <p className="text-sage">
              Contact our support team if you believe this is an error or if you need assistance locating a help request.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}