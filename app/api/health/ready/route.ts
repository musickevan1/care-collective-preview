import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Kubernetes readiness probe endpoint - simpler and faster than full health check
export async function GET() {
  try {
    // Quick database connectivity check
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json(
        { status: 'not ready', reason: 'database_unavailable' },
        { status: 503 }
      )
    }
    
    return NextResponse.json({ status: 'ready' })
    
  } catch (error) {
    return NextResponse.json(
      { status: 'not ready', reason: 'service_error' },
      { status: 503 }
    )
  }
}