'use client'

import { ReactElement } from 'react';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RotateCcw, Home } from 'lucide-react'

export default function RequestErrorFallback(): ReactElement {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto shadow-lg border-sage/20">
        <CardHeader className="pb-4">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-sage" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-foreground">
            Help Request Temporarily Unavailable
          </CardTitle>
          
          <CardDescription className="text-base">
            We&apos;re experiencing some technical difficulties loading individual help requests. 
            This is a known issue that our team is working to resolve.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>What&apos;s happening:</strong></p>
            <ul className="text-left space-y-1 max-w-sm mx-auto">
              <li>• Database connection issues are affecting individual request pages</li>
              <li>• The main requests listing page should still work</li>
              <li>• Our error handling improvements are now in place</li>
            </ul>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-sage hover:bg-sage-dark">
              <Link href="/requests" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Browse All Requests
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="border-sage text-sage hover:bg-sage/5">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {/* Additional Help */}
          <div className="border-t border-sage/20 pt-6 mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Need immediate assistance?
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="ghost" size="sm" className="text-dusty-rose hover:text-dusty-rose-dark hover:bg-dusty-rose/5">
                <Link href="/requests/new">
                  Create New Request
                </Link>
              </Button>
            </div>
          </div>

          {/* Support Notice */}
          <div className="mt-6 p-4 bg-sage/5 border border-sage/20 rounded-lg text-sm">
            <p className="font-medium text-sage-dark mb-1">
              Status Update
            </p>
            <p className="text-sage">
              We&apos;ve implemented comprehensive error handling improvements. Once the underlying 
              Supabase authentication issues are resolved, users will see much better error messages 
              instead of generic &quot;something went wrong&quot; pages.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}