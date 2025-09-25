#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user for the Care Collective platform
 */

const { createClient } = require('@supabase/supabase-js')

// Remote Supabase credentials from production environment
const SUPABASE_URL = 'https://kecureoyekeqhrxkmjuh.supabase.co'
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3VyZW95ZWtlcWhyeGttanVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNzA5OCwiZXhwIjoyMDcwNTEzMDk4fQ.tIQDk7-GJsVAsX7qfYMivcSjYOV-d6Yc0WPrNt9fMi0'

const adminEmail = 'evanmusick.dev@gmail.com'
const adminPassword = 'AdminPass123!' // Strong temporary password

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
    console.log('   1. Visit: https://care-collective-preview-a09rfw33y-musickevan1s-projects.vercel.app/login')
    console.log('   2. Login with the credentials above')
    console.log('   3. Access admin panel: /admin')
    console.log('   4. Test Phase 2.3 features: /admin/reports')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createAdminUser().catch(console.error)