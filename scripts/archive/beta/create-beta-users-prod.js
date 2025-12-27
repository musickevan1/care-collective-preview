#!/usr/bin/env node

/**
 * Create Beta Test Users Script (Production)
 * Creates approved test users for beta testing on production
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load ONLY production environment
const prodEnvPath = path.join(__dirname, '..', '.env.prod')
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8')

const prodEnv = {}
prodEnvContent.split('\n').forEach(line => {
  line = line.trim()
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      prodEnv[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  }
})

const SUPABASE_URL = prodEnv.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = prodEnv.SUPABASE_SERVICE_ROLE

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables from .env.prod')
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
        console.log('   ⚠️  User already exists, skipping...')
        return null
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
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   🚀 CREATING BETA TEST USERS (PRODUCTION)                    ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`🔗 Database: ${SUPABASE_URL}`)
  console.log('')

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
  console.log('\n' + '='.repeat(70))
  console.log('🎉 Beta User Creation Complete!')
  console.log('='.repeat(70))

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
  console.log(`   1. Visit: https://care-collective-preview.vercel.app/auth/login`)
  console.log('   2. Login with any of the credentials above')
  console.log('   3. Send welcome emails to beta testers')
  console.log('')
}

createAllBetaUsers().catch(console.error)
