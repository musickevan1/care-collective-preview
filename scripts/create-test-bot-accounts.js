#!/usr/bin/env node

/**
 * Create Test Bot Accounts Script
 * Creates test bot accounts for automated testing without affecting real beta users
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

// Test bot accounts configuration
const TEST_BOTS = [
  {
    email: 'playwright.testbot.alpha@gmail.com',
    password: 'TestBot123!',
    name: '[TEST] Bot Alpha',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'playwright.testbot.beta@gmail.com',
    password: 'TestBot123!',
    name: '[TEST] Bot Beta',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'playwright.testbot.gamma@gmail.com',
    password: 'TestBot123!',
    name: '[TEST] Bot Gamma',
    location: 'Branson, MO',
    is_admin: false,
  },
]

async function createTestBot(supabase, botConfig) {
  const { email, password, name, location, is_admin } = botConfig

  console.log(`\n🤖 Creating test bot: ${name} (${email})`)

  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: is_admin ? 'admin' : 'user',
        is_test_bot: true, // Flag as test bot
        created_by: 'automated_testing',
      }
    })

    let userId

    if (authError) {
      console.error(`   ❌ Auth Error: ${authError.message}`)
      console.error(`   Error Code: ${authError.code || 'N/A'}`)
      console.error(`   Error Details:`, JSON.stringify(authError, null, 2))

      if (authError.message.includes('User already registered') || authError.code === 'email_exists') {
        console.log('   ⚠️  Test bot already exists, updating...')

        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)

        if (existingUser) {
          userId = existingUser.id
          console.log(`   ✅ Found existing test bot: ${userId}`)

          // Update password and metadata
          await supabase.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: {
              name,
              role: is_admin ? 'admin' : 'user',
              is_test_bot: true,
              created_by: 'automated_testing',
            }
          })
        }
      } else {
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
        is_admin,
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

async function createAllTestBots() {
  console.log('🤖 Creating test bot accounts for Care Collective testing...\n')
  console.log('⚠️  These accounts are flagged as test bots and should NOT be used by real users\n')

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const results = []

  for (const botConfig of TEST_BOTS) {
    const userId = await createTestBot(supabase, botConfig)
    results.push({ ...botConfig, userId, success: !!userId })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Test Bot Creation Complete!')
  console.log('='.repeat(60))

  console.log('\n📋 Created Test Bots:')
  results.forEach(({ name, email, password, location, userId, success }) => {
    if (success) {
      console.log(`\n   🤖 ${name}`)
      console.log(`      Email: ${email}`)
      console.log(`      Password: ${password}`)
      console.log(`      Location: ${location}`)
      console.log(`      User ID: ${userId}`)
      console.log(`      🏷️  Flagged as: TEST BOT`)
    } else {
      console.log(`\n   ❌ ${name} - FAILED`)
    }
  })

  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 Success Rate: ${successCount}/${results.length} test bots created`)

  console.log('\n🔗 Use These Credentials for Testing:')
  console.log(`   URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`)
  console.log('   Email: testbot1@carecollective.test')
  console.log('   Password: TestBot123!')

  console.log('\n⚠️  Remember: These are test accounts and can be safely deleted')
}

createAllTestBots().catch(console.error)
