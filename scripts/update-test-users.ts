/**
 * Script to update E2E test user profiles to approved status
 * Run with: npx tsx scripts/update-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Read access token from Supabase CLI config
const accessTokenPath = path.join(process.env.HOME || '', '.supabase', 'access-token')
const accessToken = fs.readFileSync(accessTokenPath, 'utf-8').trim()

const PROJECT_REF = 'kecureoyekeqhrxkmjuh'
const SUPABASE_URL = 'https://kecureoyekeqhrxkmjuh.supabase.co'

// Test users to update
const TEST_USERS = [
  {
    email: 'test-user-a@example.com',
    name: 'Test User A',
    location: 'Springfield, MO',
  },
  {
    email: 'test-user-b@example.com',
    name: 'Test User B',
    location: 'Branson, MO',
  },
]

async function getServiceRoleKey(): Promise<string> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get API keys: ${response.statusText}`)
  }

  const keys = await response.json()
  const serviceKey = keys.find((k: any) => k.name === 'service_role')

  if (!serviceKey) {
    throw new Error('Service role key not found')
  }

  return serviceKey.api_key
}

async function updateTestUsers() {
  console.log('🔑 Getting service role key...')
  const serviceRoleKey = await getServiceRoleKey()

  console.log('📦 Connecting to Supabase...')
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers()

  for (const user of TEST_USERS) {
    console.log(`\n👤 Updating user: ${user.email}`)

    // Find the auth user
    const authUser = authData?.users.find((u) => u.email === user.email)

    if (!authUser) {
      console.log(`   ✗ Auth user not found for ${user.email}`)
      continue
    }

    console.log(`   Found auth user: ${authUser.id}`)

    // Update profile to approved status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: user.name,
        location: user.location,
        verification_status: 'approved',
        is_admin: false,
      })
      .eq('id', authUser.id)

    if (updateError) {
      console.error(`   ✗ Profile update failed: ${updateError.message}`)
    } else {
      console.log(`   ✓ Profile updated to approved status`)
    }
  }

  console.log('\n✅ Done! Test users are approved and ready for E2E tests.')
}

updateTestUsers().catch(console.error)
