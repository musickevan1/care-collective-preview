import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Get the origin from the request to handle both local and production
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/', origin))
}