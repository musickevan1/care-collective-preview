#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user for the Care Collective platform
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

// Admin credentials from environment variables or command line arguments
const adminEmail = process.env.ADMIN_EMAIL || process.argv[2]
const adminPassword = process.env.ADMIN_PASSWORD || process.argv[3]

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE')
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error('❌ Admin credentials required. Provide via:')
  console.error('   Environment variables: ADMIN_EMAIL, ADMIN_PASSWORD')
  console.error('   Command line: node scripts/create-admin-user.js <email> <password>')
  process.exit(1)
}

async function createAdminUser() {
  console.log('🚀 Creating admin user for Care Collective...')

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Create the auth user
    console.log(`📧 Creating auth user: ${adminEmail}`)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    })

    if (authError) {
      if (authError.message.includes('User already registered') || authError.code === 'email_exists') {
        console.log('✅ User already exists, updating...')

        // Try to get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === adminEmail)

        if (existingUser) {
          console.log(`✅ Found existing user: ${existingUser.id}`)

          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password: adminPassword,
              email_confirm: true,
              user_metadata: {
                name: 'Admin User',
                role: 'admin'
              }
            }
          )

          if (updateError) {
            console.error('❌ Error updating user:', updateError)
            return
          }

          console.log('✅ Password updated successfully')
        }
      } else {
        console.error('❌ Error creating user:', authError)
        return
      }
    } else {
      console.log('✅ Auth user created successfully')
      console.log(`   User ID: ${authData.user.id}`)
    }

    // 2. Create or update profile
    console.log('📝 Creating user profile...')

    // Get the user ID (either from creation or existing user)
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users.users.find(u => u.email === adminEmail)

    if (!user) {
      console.error('❌ Could not find user after creation')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: 'Admin User',
        is_admin: true,
        verification_status: 'approved',
        email_confirmed: true,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully')
    }

    console.log('\n🎉 Admin user setup complete!')
    console.log('\n📋 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n🔗 Next Steps:')
    console.log(`   1. Visit: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`)
    console.log('   2. Login with the credentials above')
    console.log('   3. Access admin panel: /admin')
    console.log('   4. Test Phase 2.3 features: /admin/reports')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createAdminUser().catch(console.error)