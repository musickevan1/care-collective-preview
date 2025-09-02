import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function AuthTestPage() {
  console.log('[Auth Test] Page render started')
  
  let client
  let user = null
  let profile = null
  let authError = null
  let profileError = null

  try {
    // Test client creation
    console.log('[Auth Test] Creating Supabase client...')
    client = await createClient()
    console.log('[Auth Test] Client created successfully')

    // Test auth.getUser()
    console.log('[Auth Test] Getting user...')
    const { data: userData, error: userError } = await client.auth.getUser()
    user = userData.user
    authError = userError
    console.log('[Auth Test] User data:', { hasUser: !!user, userId: user?.id, error: userError?.message })
    
    if (!user) {
      console.log('[Auth Test] No user found, redirecting to login')
      redirect('/login?redirectTo=/auth-test')
    }

    // Test profile query
    console.log('[Auth Test] Querying user profile...')
    const { data: profileData, error: profileQueryError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = profileData
    profileError = profileQueryError
    console.log('[Auth Test] Profile query result:', { 
      hasProfile: !!profile, 
      profileName: profile?.name, 
      error: profileQueryError?.message,
      errorCode: profileQueryError?.code
    })

  } catch (error) {
    console.error('[Auth Test] Caught exception:', error)
    throw error // Let error boundary handle it
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
            <CardDescription>
              This page tests authentication and database access step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Authentication Test */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✅ User Authentication</h3>
              <div className="text-sm space-y-1">
                <p><strong>User ID:</strong> {user?.id || 'None'}</p>
                <p><strong>Email:</strong> {user?.email || 'None'}</p>
                <p><strong>Auth Error:</strong> {authError?.message || 'None'}</p>
              </div>
            </div>

            {/* Profile Query Test */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">
                {profileError ? '❌' : '✅'} Profile Database Query
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>Profile Name:</strong> {profile?.name || 'None'}</p>
                <p><strong>Profile Location:</strong> {profile?.location || 'None'}</p>
                <p><strong>Is Admin:</strong> {profile?.is_admin ? 'Yes' : 'No'}</p>
                <p><strong>Created At:</strong> {profile?.created_at || 'None'}</p>
                <p><strong>Query Error:</strong> {profileError?.message || 'None'}</p>
                <p><strong>Error Code:</strong> {profileError?.code || 'None'}</p>
              </div>
            </div>

            {/* Raw Session Info */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🔧 Raw Session Data</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({
                  user: user ? {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at
                  } : null,
                  profile,
                  authError,
                  profileError
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}