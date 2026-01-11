import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getProfileWithServiceRole, createOAuthProfile, profileNeedsCompletion, syncEmailConfirmationStatus } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  let next = searchParams.get('next') ?? '/dashboard'

  // Debug: Log all received params
  console.log('[Auth Callback] Received params:', {
    code: code ? 'present' : 'missing',
    type,
    next,
    fullUrl: request.url,
    timestamp: new Date().toISOString()
  })

  // Handle password recovery flow
  if (type === 'recovery') {
    next = '/reset-password'
  }

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // Check if this was a recovery flow by examining the session's AMR
    if (data?.session) {
      const sessionData = data.session as unknown as { amr?: Array<{ method: string }> }
      if (sessionData.amr?.some(m => m.method === 'recovery' || m.method === 'otp')) {
        console.log('[Auth Callback] Detected recovery flow from AMR:', sessionData.amr)
        next = '/reset-password'
      }
    }

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
          // Sync email confirmation status from auth.users to profiles
          // This ensures profiles.email_confirmed stays in sync even if DB triggers don't fire
          if (user.email_confirmed_at) {
            try {
              const synced = await syncEmailConfirmationStatus(user.id)
              if (synced) {
                console.log('[Auth Callback] Email confirmation synced to profile')
              }
            } catch (syncError) {
              // Non-fatal - log but continue with auth flow
              console.error('[Auth Callback] Email sync failed:', syncError)
            }
          }
          // Use service role to bypass RLS and get guaranteed accurate data
          let profile
          let isNewOAuthUser = false

          try {
            profile = await getProfileWithServiceRole(user.id)

            console.log('[Auth Callback] Profile verified (service role):', {
              userId: user.id,
              verificationStatus: profile.verification_status,
              timestamp: new Date().toISOString()
            })
          } catch (profileError) {
            // Profile doesn't exist - check if this is a new OAuth user
            const provider = user.app_metadata?.provider

            if (provider === 'google') {
              // Create profile for new Google OAuth user
              console.log('[Auth Callback] New Google OAuth user, creating profile:', {
                userId: user.id,
                email: user.email,
                provider,
                timestamp: new Date().toISOString()
              })

              try {
                const userMetadata = user.user_metadata
                profile = await createOAuthProfile(user.id, {
                  name: userMetadata?.full_name || userMetadata?.name,
                  email: user.email || undefined,
                  avatarUrl: userMetadata?.avatar_url || userMetadata?.picture,
                })
                isNewOAuthUser = true

                console.log('[Auth Callback] OAuth profile created:', {
                  userId: user.id,
                  profileName: profile.name,
                  timestamp: new Date().toISOString()
                })
              } catch (createError) {
                console.error('[Auth Callback] Failed to create OAuth profile:', createError)
                await supabase.auth.signOut()
                next = '/login?error=profile_creation_failed'
                profile = null
              }
            } else {
              // Non-OAuth error - sign out
              console.error('[Auth Callback] Service role query failed:', profileError)
              await supabase.auth.signOut()
              next = '/login?error=verification_failed'
              profile = null
            }
          }

          // Determine redirect destination based on user status
          // Skip verification check for password recovery - let them reset first
          if (profile && type !== 'recovery') {
            if (profile.verification_status === 'rejected') {
              // CRITICAL SECURITY: Block rejected users immediately
              console.log('[Auth Callback] BLOCKING REJECTED USER - signing out')
              // Sign out and redirect to access denied page
              await supabase.auth.signOut()
              next = '/access-denied?reason=rejected'
            } else if (profile.verification_status === 'pending') {
              // Check if OAuth user needs to complete their profile
              const needsCompletion = isNewOAuthUser || await profileNeedsCompletion(user.id)

              if (needsCompletion) {
                console.log('[Auth Callback] OAuth user needs profile completion')
                next = '/complete-profile'
              } else {
                console.log('[Auth Callback] Redirecting pending user to waitlist')
                next = '/waitlist'
              }
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