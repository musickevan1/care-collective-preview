import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { userId } = params

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's help requests created
    const { data: helpRequestsCreated, error: createdError } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (
          name,
          location
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (createdError) {
      console.error('Error fetching created requests:', createdError)
    }

    // Fetch help requests where this user helped
    const { data: helpRequestsHelped, error: helpedError } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (
          name,
          location
        )
      `)
      .eq('helper_id', userId)
      .order('helped_at', { ascending: false })

    if (helpedError) {
      console.error('Error fetching helped requests:', helpedError)
    }

    // Fetch contact exchanges
    const { data: contactExchanges, error: exchangesError } = await supabase
      .from('contact_exchanges')
      .select('*')
      .or(`helper_id.eq.${userId},requester_id.eq.${userId}`)
      .order('exchanged_at', { ascending: false })

    if (exchangesError) {
      console.error('Error fetching contact exchanges:', exchangesError)
    }

    // Fetch messages sent by the user
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
    }

    return NextResponse.json({
      profile,
      helpRequestsCreated: helpRequestsCreated || [],
      helpRequestsHelped: helpRequestsHelped || [],
      contactExchanges: contactExchanges || [],
      messages: messages || []
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}