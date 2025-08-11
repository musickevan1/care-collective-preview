import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function formatTimeAgo(dateString: string) {
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

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Admin Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-sm text-secondary-foreground/70">Manage community members (Preview - Read Only)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Preview Notice */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">🔍 Preview Mode - Read Only</h2>
          <p className="text-muted-foreground">
            This page shows user data in read-only mode for demonstration purposes.
          </p>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Community Members ({users?.length || 0})</CardTitle>
            <CardDescription>
              All registered users in the CARE Collective
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">
                            {user.name || 'No name set'}
                          </h3>
                          <Badge variant="secondary">
                            User
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {user.location && (
                            <span>📍 {user.location}</span>
                          )}
                          
                          <span>
                            📅 Joined {formatTimeAgo(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        View Details (Preview)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No users found
                </h3>
                <p className="text-muted-foreground">
                  No users have registered yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter((u: any) => {
                  const monthAgo = new Date()
                  monthAgo.setMonth(monthAgo.getMonth() - 1)
                  return new Date(u.created_at) > monthAgo
                }).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">With Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter((u: any) => u.location).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}