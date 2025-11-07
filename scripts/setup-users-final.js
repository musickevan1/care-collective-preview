#!/usr/bin/env node

/**
 * Final User Setup Script
 * Updates beta passwords and creates admin accounts
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

// Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Known beta user IDs from database
const BETA_USERS = [
  { id: '76b69ea2-e3f1-4e3f-a746-3be5ffcf82d9', email: 'dianemusick@att.net', name: 'Diane Musick' },
  { id: '293dd89f-7a8c-4bec-8524-d0d2c1b68949', email: 'templemk@gmail.com', name: 'Keith Templeman' },
  { id: '194187ed-9ae9-4a31-828e-10578d32d4cc', email: 'cconaway@missouristate.edu', name: 'Christy Conaway' },
  { id: 'a0e41b8f-059b-4886-9086-cb6a5e80a995', email: 'ariadne.miranda.phd@gmail.com', name: 'Ariadne Miranda' },
  { id: '8fc3f634-5bb5-4f5a-b200-607955ce6954', email: 'tmbarakat1958@gmail.com', name: 'Terry Barakat' }
]

const ADMIN_USERS = [
  {
    email: 'MaureenTempleman@MissouriState.edu',
    password: 'TempAdminPass123!',
    name: 'Maureen Templeman',
    location: 'Springfield, MO'
  },
  {
    email: 'evanmusick.dev@gmail.com',
    password: 'TempAdminPass123!',
    name: 'Evan Musick',
    location: 'Springfield, MO'
  }
]

async function main() {
  console.log('🚀 Setting up users...\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Update beta tester passwords
  console.log('📝 Updating beta tester passwords to beta123!\n')

  for (const user of BETA_USERS) {
    console.log(`   Updating ${user.name}...`)
    try {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'beta123!'
      })

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅ Password updated`)
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
    }
  }

  // 2. Create admin accounts
  console.log('\n📝 Creating admin accounts\n')

  for (const admin of ADMIN_USERS) {
    console.log(`   Creating ${admin.name}...`)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          name: admin.name,
          role: 'admin',
          email_verified: true
        }
      })

      if (authError) {
        console.log(`   ❌ Auth error: ${authError.message}`)
        console.log(`   Error details:`, JSON.stringify(authError, null, 2))
        continue
      }

      const userId = authData.user.id
      console.log(`   ✅ Auth user created: ${userId}`)

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: admin.name,
          location: admin.location,
          is_admin: true,
          is_beta_tester: false,
          verification_status: 'approved',
          email_confirmed: true,
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })

      if (profileError) {
        console.log(`   ❌ Profile error: ${profileError.message}`)
      } else {
        console.log(`   ✅ Profile created`)
        console.log(`   📧 Email: ${admin.email}`)
        console.log(`   🔑 Password: ${admin.password}`)
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Setup complete!')
  console.log('='.repeat(60))
  console.log('\n📋 Credentials Summary:')
  console.log('\nBeta Testers (5 users):')
  console.log('   Password: beta123!')
  BETA_USERS.forEach(u => console.log(`   - ${u.email}`))

  console.log('\nAdmins (2 users):')
  console.log('   Password: TempAdminPass123!')
  ADMIN_USERS.forEach(u => console.log(`   - ${u.email}`))
}

main().catch(console.error)
