import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApprovalActions } from './ApprovalActions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactElement } from 'react'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

interface ApplicationData {
  id: string
  name: string
  location: string | null
  application_reason: string | null
  applied_at: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
}

function formatTimeAgo(dateString: string | null) {
  if (!dateString) return 'Unknown'
  const now = new Date()
  const date = new Date(dateString)
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`
  } else {
    return `${Math.floor(diffInDays / 30)} months ago`
  }
}

function getStatusBadge(status: string): ReactElement {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
    case 'approved':
      return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export default async function ApplicationsPage(): Promise<ReactElement> {
  const supabase = await createClient()

  // Verify user is authenticated and admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?redirectTo=/admin/applications')
  }

  // Check if user is admin
  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('is_admin, verification_status')
    .eq('id', user.id)
    .single()

  if (adminError || !adminProfile?.is_admin || adminProfile.verification_status !== 'approved') {
    redirect('/dashboard?error=admin_required')
  }

  // Fetch all applications with various statuses
  const { data: applications, error: applicationsError } = await supabase
    .from('profiles')
    .select('id, name, location, application_reason, applied_at, verification_status, rejection_reason')
    .order('applied_at', { ascending: false })

  if (applicationsError) {
    console.error('Error fetching applications:', applicationsError)
  }

  const pendingApplications = applications?.filter(app => app.verification_status === 'pending') || []
  const recentActions = applications?.filter(app => app.verification_status !== 'pending').slice(0, 10) || []

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">User Applications</h1>
              <p className="text-xs sm:text-sm text-secondary-foreground/70">Review and manage community member applications</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Approved Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applications?.filter(app => app.verification_status === 'approved').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Applications ({pendingApplications.length})</CardTitle>
            <CardDescription>
              Applications awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApplications.length > 0 ? (
              <div className="space-y-4">
                {pendingApplications.map((application: ApplicationData) => (
                  <div
                    key={application.id}
                    className="border rounded-lg p-4 bg-yellow-50 border-yellow-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground font-semibold">
                                {(application.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground">
                                {application.name || 'No name provided'}
                              </h3>
                              {getStatusBadge(application.verification_status)}
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {application.location && (
                                <p>📍 {application.location}</p>
                              )}
                              <p>📅 Applied {formatTimeAgo(application.applied_at)}</p>
                            </div>
                          </div>
                        </div>

                        {application.application_reason && (
                          <div className="bg-white rounded p-3 border">
                            <p className="text-sm font-medium mb-1">Reason for joining:</p>
                            <p className="text-sm text-muted-foreground">
                              "{application.application_reason}"
                            </p>
                          </div>
                        )}
                      </div>

                      <ApprovalActions 
                        userId={application.id}
                        userName={application.name || 'Unknown User'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No pending applications
                </h3>
                <p className="text-muted-foreground">
                  All applications have been reviewed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Recently approved or rejected applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActions.length > 0 ? (
              <div className="space-y-3">
                {recentActions.map((application: ApplicationData) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {(application.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">{application.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {formatTimeAgo(application.applied_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(application.verification_status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent actions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}