/**
 * @fileoverview Diagnostic API endpoint to test Browse Requests query patterns
 * This endpoint helps identify whether the 500 error is from the query or rendering
 *
 * Tests three query patterns:
 * 1. Simple query without JOIN (baseline)
 * 2. Query with foreign key JOIN including location (Browse Requests pattern)
 * 3. Query with foreign key JOIN excluding location (Dashboard pattern)
 */

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    console.log('[TEST BROWSE] Starting diagnostic tests...', {
      timestamp: new Date().toISOString()
    })

    // Test 1: Simple query without JOIN (baseline)
    console.log('[TEST BROWSE] Running Test 1: Simple query without JOIN')
    const { data: test1, error: error1 } = await supabase
      .from('help_requests')
      .select('id, title, status, category, user_id')
      .limit(3)

    console.log('[TEST BROWSE] Test 1 completed:', {
      success: !error1,
      count: test1?.length,
      error: error1?.message
    })

    // Test 2: Query with foreign key JOIN including location (Browse Requests pattern)
    console.log('[TEST BROWSE] Running Test 2: Query with JOIN (name + location)')
    const { data: test2, error: error2 } = await supabase
      .from('help_requests')
      .select(`
        id,
        title,
        status,
        category,
        user_id,
        profiles!user_id (name, location)
      `)
      .limit(3)

    console.log('[TEST BROWSE] Test 2 completed:', {
      success: !error2,
      count: test2?.length,
      error: error2?.message,
      firstItemStructure: test2?.[0] ? {
        hasProfiles: !!test2[0].profiles,
        profileType: typeof test2[0].profiles,
        profileKeys: test2[0].profiles ? Object.keys(test2[0].profiles) : null
      } : null
    })

    // Test 3: Query with foreign key JOIN excluding location (Dashboard pattern)
    console.log('[TEST BROWSE] Running Test 3: Query with JOIN (name only)')
    const { data: test3, error: error3 } = await supabase
      .from('help_requests')
      .select(`
        id,
        title,
        status,
        category,
        user_id,
        profiles!user_id (name)
      `)
      .limit(3)

    console.log('[TEST BROWSE] Test 3 completed:', {
      success: !error3,
      count: test3?.length,
      error: error3?.message
    })

    // Test 4: Full Browse Requests query pattern
    console.log('[TEST BROWSE] Running Test 4: Full Browse Requests pattern')
    const { data: test4, error: error4 } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (name, location),
        helper:profiles!helper_id (name, location)
      `)
      .limit(3)

    console.log('[TEST BROWSE] Test 4 completed:', {
      success: !error4,
      count: test4?.length,
      error: error4?.message
    })

    console.log('[TEST BROWSE] All tests completed successfully')

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        test1_simple_no_join: {
          success: !error1,
          count: test1?.length,
          error: error1?.message,
          sample: test1?.[0] || null
        },
        test2_join_with_location: {
          success: !error2,
          count: test2?.length,
          error: error2?.message,
          sample: test2?.[0] || null
        },
        test3_join_name_only: {
          success: !error3,
          count: test3?.length,
          error: error3?.message,
          sample: test3?.[0] || null
        },
        test4_full_pattern: {
          success: !error4,
          count: test4?.length,
          error: error4?.message,
          sample: test4?.[0] || null
        }
      },
      analysis: {
        all_passed: !error1 && !error2 && !error3 && !error4,
        query_works: !error2 && !error4,
        likely_cause:
          error1 && error2 && error3 && error4 ? 'Authentication/RLS issue' :
          !error1 && (error2 || error4) ? 'Foreign key JOIN issue' :
          !error2 && !error4 ? 'Issue is in page rendering, not query' :
          'Unknown - check specific test errors'
      }
    })
  } catch (err) {
    console.error('[TEST BROWSE] EXCEPTION:', {
      name: err?.constructor?.name,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined
    })

    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
