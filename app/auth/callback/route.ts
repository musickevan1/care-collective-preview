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
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('verification_status, email_confirmed')
            .eq('id', user.id)
            .single()

          // Determine redirect destination based on user status
          if (profile) {
            if (profile.verification_status === 'pending') {
              next = '/waitlist'
            } else if (profile.verification_status === 'rejected') {
              next = '/waitlist'
            } else if (profile.verification_status === 'approved') {
              // If email was just confirmed or already confirmed, go to dashboard
              // The middleware will handle any additional checks
              next = next === '/dashboard' ? '/dashboard' : next
            }
          }
        }
      } catch (profileError) {
        console.error('Error fetching user profile in callback:', profileError)
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