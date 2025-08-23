import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto p-8">
        {/* Friendly search icon */}
        <div className="text-6xl mb-6">🌱</div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          This page isn&apos;t here
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          The page you&apos;re looking for might have moved or doesn&apos;t exist. 
          That&apos;s okay - let&apos;s get you back to where you need to be.
        </p>
        
        {/* Navigation options */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link href="/">
            <Button className="min-w-[120px]">
              Go home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="min-w-[120px]">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="border-t pt-6 mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/requests">
              <Button variant="ghost" size="sm" className="w-full">
                Help requests
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="ghost" size="sm" className="w-full">
                Get support
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="w-full">
                My dashboard
              </Button>
            </Link>
            <Link href="/requests/new">
              <Button variant="ghost" size="sm" className="w-full">
                Request help
              </Button>
            </Link>
          </div>
        </div>

        {/* Support notice */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
          <p className="text-green-800 dark:text-green-200">
            Remember: Our community is here to support you. 
            If you need immediate assistance, don&apos;t hesitate to reach out.
          </p>
        </div>
      </Card>
    </div>
  )
}