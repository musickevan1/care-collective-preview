/**
 * Script to create E2E test users in Supabase
 * Run with: npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Read access token from Supabase CLI config
const accessTokenPath = path.join(process.env.HOME || '', '.supabase', 'access-token')
const accessToken = fs.readFileSync(accessTokenPath, 'utf-8').trim()

const PROJECT_REF = 'kecureoyekeqhrxkmjuh'
const SUPABASE_URL = 'https://kecureoyekeqhrxkmjuh.supabase.co'

// Test users to create
const TEST_USERS = [
  {
    email: 'test-user-a@example.com',
    password: 'testpassword123',
    name: 'Test User A',
    location: 'Springfield, MO',
  },
  {
    email: 'test-user-b@example.com',
    password: 'testpassword123',
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

async function createTestUsers() {
  console.log('🔑 Getting service role key...')
  const serviceRoleKey = await getServiceRoleKey()

  console.log('📦 Connecting to Supabase...')
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  for (const user of TEST_USERS) {
    console.log(`\n👤 Creating user: ${user.email}`)

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('name', user.name)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      console.log(`   ✓ User already exists: ${user.name}`)
      continue
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`   ✓ Auth user already exists, updating profile...`)

        // Get the existing user
        const { data: existingAuth } = await supabase.auth.admin.listUsers()
        const existingUser = existingAuth?.users.find(u => u.email === user.email)

        if (existingUser) {
          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              name: user.name,
              location: user.location,
              verification_status: 'approved',
              is_admin: false,
            })

          if (profileError) {
            console.error(`   ✗ Profile update failed: ${profileError.message}`)
          } else {
            console.log(`   ✓ Profile updated for ${user.email}`)
          }
        }
        continue
      }
      console.error(`   ✗ Failed to create auth user: ${authError.message}`)
      continue
    }

    console.log(`   ✓ Auth user created: ${authData.user?.id}`)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        name: user.name,
        location: user.location,
        verification_status: 'approved',
        is_admin: false,
      })

    if (profileError) {
      console.error(`   ✗ Profile creation failed: ${profileError.message}`)
    } else {
      console.log(`   ✓ Profile created for ${user.name}`)
    }
  }

  console.log('\n✅ Done! Test users are ready.')
  console.log('\nCredentials:')
  for (const user of TEST_USERS) {
    console.log(`   ${user.email} / ${user.password}`)
  }
}

createTestUsers().catch(console.error)
