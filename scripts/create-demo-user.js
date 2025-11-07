#!/usr/bin/env node

/**
 * Create Demo User Script
 * Creates a non-admin demo account for client testing
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Demo user configuration
const DEMO_USER = {
  email: 'user@demo.org',
  password: 'Temp123!',
  name: 'Demo User',
  location: 'Springfield, MO',
  is_admin: false,
  is_beta_tester: true,
}

async function createDemoUser(supabase, userConfig) {
  const { email, password, name, location, is_admin, is_beta_tester } = userConfig

  console.log(`\n👤 Creating demo user: ${name} (${email})`)

  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: 'user',
        email_verified: true
      }
    })

    let userId

    if (authError) {
      console.error(`   ⚠️  Auth error details:`, JSON.stringify(authError, null, 2))

      if (authError.message.includes('User already registered') || authError.code === 'email_exists') {
        console.log('   ⚠️  User already exists, updating...')

        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)

        if (existingUser) {
          userId = existingUser.id
          console.log(`   ✅ Found existing user: ${userId}`)

          // Update password
          await supabase.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: { name, role: 'user', email_verified: true }
          })
        }
      } else {
        console.error(`   ❌ Error creating user: ${authError.message}`)
        return null
      }
    } else {
      userId = authData.user.id
      console.log(`   ✅ Auth user created: ${userId}`)
    }

    // 2. Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name,
        location,
        is_admin: false,
        is_beta_tester: true,
        verification_status: 'approved',
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString(),
        applied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error(`   ❌ Error creating profile: ${profileError.message}`)
      return null
    }

    console.log(`   ✅ Profile created successfully`)
    return userId

  } catch (error) {
    console.error(`   ❌ Unexpected error: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🚀 Creating demo user for Care Collective...\n')

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const userId = await createDemoUser(supabase, DEMO_USER)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Demo User Creation Complete!')
  console.log('='.repeat(60))

  if (userId) {
    console.log(`\n   ✅ ${DEMO_USER.name}`)
    console.log(`      Email: ${DEMO_USER.email}`)
    console.log(`      Password: ${DEMO_USER.password}`)
    console.log(`      Location: ${DEMO_USER.location}`)
    console.log(`      User ID: ${userId}`)
    console.log(`      Role: Regular User (Non-Admin)`)
    console.log(`      Beta Tester: Yes`)
  } else {
    console.log(`\n   ❌ Demo user creation FAILED`)
  }

  console.log('\n🔗 Next Steps:')
  console.log(`   1. Visit: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login`)
  console.log(`   2. Login with: ${DEMO_USER.email}`)
  console.log(`   3. Password: ${DEMO_USER.password}`)
  console.log('   4. User will see regular user perspective (no admin features)')
}

main().catch(console.error)
