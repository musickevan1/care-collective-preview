#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load production environment
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

const supabase = createClient(prodEnv.NEXT_PUBLIC_SUPABASE_URL, prodEnv.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const BETA_USERS = {
  'tmbarakat1958@gmail.com': { name: 'Terry Barakat', location: 'Springfield, MO' },
  'ariadne.miranda.phd@gmail.com': { name: 'Ariadne Miranda', location: 'Springfield, MO' },
  'cconaway@missouristate.edu': { name: 'Christy Conaway', location: 'Springfield, MO' },
  'templemk@gmail.com': { name: 'Keith Templeman', location: 'Springfield, MO' },
  'dianemusick@att.net': { name: 'Diane Musick', location: 'Springfield, MO' },
}

async function addProfiles() {
  console.log('🔍 Finding auth users and creating profiles...\n')

  const { data: users } = await supabase.auth.admin.listUsers()

  for (const user of users.users) {
    if (BETA_USERS[user.email]) {
      const { name, location } = BETA_USERS[user.email]

      console.log(`👤 Adding profile for: ${name} (${user.email})`)

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name,
        location,
        is_admin: false,
        verification_status: 'approved',
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString(),
        applied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        created_at: user.created_at
      })

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅ Profile created`)
      }
    }
  }

  console.log('\n✅ All profiles added!')
}

addProfiles().catch(console.error)
