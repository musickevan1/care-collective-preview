#!/usr/bin/env node

/**
 * Create Beta Test Users Script
 * Creates approved test users for beta testing the Care Collective platform
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

// Beta test users configuration
const BETA_USERS = [
  {
    email: 'tmbarakat1958@gmail.com',
    password: 'CareTest2024!Terry',
    name: 'Terry Barakat',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'ariadne.miranda.phd@gmail.com',
    password: 'CareTest2024!Ariadne',
    name: 'Ariadne Miranda',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'cconaway@missouristate.edu',
    password: 'CareTest2024!Christy',
    name: 'Christy Conaway',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'templemk@gmail.com',
    password: 'CareTest2024!Keith',
    name: 'Keith Templeman',
    location: 'Springfield, MO',
    is_admin: false,
  },
  {
    email: 'dianemusick@att.net',
    password: 'CareTest2024!Diane',
    name: 'Diane Musick',
    location: 'Springfield, MO',
    is_admin: false,
  },
]

async function createBetaUser(supabase, userConfig) {
  const { email, password, name, location, is_admin } = userConfig

  console.log(`\n👤 Creating user: ${name} (${email})`)

  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: is_admin ? 'admin' : 'user'
      }
    })

    let userId

    if (authError) {
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
            user_metadata: { name, role: is_admin ? 'admin' : 'user' }
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

async function createAllBetaUsers() {
  console.log('🚀 Creating beta test users for Care Collective...\n')

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const results = []

  for (const userConfig of BETA_USERS) {
    const userId = await createBetaUser(supabase, userConfig)
    results.push({ ...userConfig, userId, success: !!userId })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Beta User Creation Complete!')
  console.log('='.repeat(60))

  console.log('\n📋 Created Users:')
  results.forEach(({ name, email, password, location, userId, success }) => {
    if (success) {
      console.log(`\n   ✅ ${name}`)
      console.log(`      Email: ${email}`)
      console.log(`      Password: ${password}`)
      console.log(`      Location: ${location}`)
      console.log(`      User ID: ${userId}`)
    } else {
      console.log(`\n   ❌ ${name} - FAILED`)
    }
  })

  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 Success Rate: ${successCount}/${results.length} users created`)

  console.log('\n🔗 Next Steps:')
  console.log(`   1. Visit: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`)
  console.log('   2. Login with any of the credentials above')
  console.log('   3. Test help requests: /requests/new')
  console.log('   4. Test messaging: /messages')
  console.log('   5. Test dashboard: /dashboard')
}

createAllBetaUsers().catch(console.error)
