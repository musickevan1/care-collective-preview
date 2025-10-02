import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user profile to determine where to redirect based on verification status
      try {
        const { data: { user } } = await supabase.auth.getUser()

        // PRODUCTION DEBUG: Auth callback user check
        console.log('[Auth Callback] User authenticated:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          timestamp: new Date().toISOString()
        })

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('verification_status, email_confirmed')
            .eq('id', user.id)
            .single()

          // PRODUCTION DEBUG: Profile fetch in callback
          console.log('[Auth Callback] Profile fetched:', {
            profileId: profile?.id,
            verificationStatus: profile?.verification_status,
            queryUserId: user.id,
            matchesAuthUser: profile?.id === user.id,
            profileError: profileError?.message,
            timestamp: new Date().toISOString()
          })

          // Determine redirect destination based on user status
          if (profile) {
            if (profile.verification_status === 'rejected') {
              // CRITICAL SECURITY: Block rejected users immediately
              console.log('[Auth Callback] BLOCKING REJECTED USER - signing out')
              // Sign out and redirect to access denied page
              await supabase.auth.signOut()
              next = '/access-denied?reason=rejected'
            } else if (profile.verification_status === 'pending') {
              console.log('[Auth Callback] Redirecting pending user to waitlist')
              next = '/waitlist'
            } else if (profile.verification_status === 'approved') {
              console.log('[Auth Callback] Approved user, proceeding to:', next)
              // If email was just confirmed or already confirmed, go to dashboard
              // The middleware will handle any additional checks
              next = next === '/dashboard' ? '/dashboard' : next
            }
          }
        }
      } catch (profileError) {
        console.error('[Auth Callback] Error fetching user profile:', profileError)
        // If there's an error getting profile, use the original next parameter
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}