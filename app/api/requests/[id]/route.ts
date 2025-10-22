/**
 * @fileoverview API Route for fetching individual help request details
 * GET /api/requests/[id] - Returns full request with profile data
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch help request with profile data
    // Using separate queries to avoid RLS issues with joins
    const { data: requestData, error: requestError } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError) {
      console.error('[API] Error fetching request:', requestError)
      if (requestError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch request' },
        { status: 500 }
      )
    }

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Fetch requester profile separately
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('id, name, location')
      .eq('id', requestData.user_id)
      .single()

    // Fetch helper profile if exists
    let helperProfile = null
    if (requestData.helper_id) {
      const { data: helperData } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', requestData.helper_id)
        .single()
      helperProfile = helperData
    }

    // Combine data with fallback for profiles
    const fullRequest = {
      ...requestData,
      profiles: requesterProfile || {
        id: requestData.user_id,
        name: 'Unknown User',
        location: null
      },
      helper: helperProfile
    }

    return NextResponse.json(fullRequest)

  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
