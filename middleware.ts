import { type NextRequest, NextResponse } from 'next/server'
// Temporarily disabled to fix build issues with Supabase Edge Runtime compatibility
// import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Temporarily disabled to fix 'self is not defined' build error
  // return await updateSession(request)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder

     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}