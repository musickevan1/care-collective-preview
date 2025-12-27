#!/usr/bin/env node

/**
 * Update Beta Tester Passwords
 * Sets all beta tester passwords to beta123!
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

const BETA_USERS = [
  'tmbarakat1958@gmail.com',
  'ariadne.miranda.phd@gmail.com',
  'cconaway@missouristate.edu',
  'templemk@gmail.com',
  'dianemusick@att.net'
]

const NEW_PASSWORD = 'beta123!'

async function updateBetaPasswords() {
  console.log('🚀 Updating beta tester passwords...\n')

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    process.exit(1)
  }

  const results = []

  for (const email of BETA_USERS) {
    const user = users.find(u => u.email === email)

    if (!user) {
      console.log(`⚠️  User not found: ${email}`)
      results.push({ email, success: false, reason: 'not_found' })
      continue
    }

    console.log(`🔑 Updating password for: ${email}`)

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: NEW_PASSWORD
    })

    if (updateError) {
      console.error(`   ❌ Error: ${updateError.message}`)
      results.push({ email, success: false, reason: updateError.message })
    } else {
      console.log(`   ✅ Password updated successfully`)
      results.push({ email, success: true })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Password Update Complete!')
  console.log('='.repeat(60))

  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 Success Rate: ${successCount}/${results.length} passwords updated`)
  console.log(`\n🔐 New password for all beta testers: ${NEW_PASSWORD}`)
}

updateBetaPasswords().catch(console.error)
