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

async function cleanup() {
  console.log('🔍 Checking for remaining data...\n')

  // Check remaining users
  const { data: users } = await supabase.auth.admin.listUsers()
  console.log(`Found ${users.users.length} remaining auth users:`)
  users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`))

  if (users.users.length > 0) {
    console.log('\n🗑️  Deleting remaining users...')
    for (const user of users.users) {
      await supabase.auth.admin.deleteUser(user.id)
      console.log(`  ✅ Deleted: ${user.email}`)
    }
  }

  // Check remaining profiles
  const { data: profiles } = await supabase.from('profiles').select('id, name, email')
  console.log(`\nFound ${profiles?.length || 0} remaining profiles:`)
  profiles?.forEach(p => console.log(`  - ${p.name || p.email} (${p.id})`))

  if (profiles && profiles.length > 0) {
    console.log('\n🗑️  Deleting remaining profiles...')
    for (const profile of profiles) {
      await supabase.from('profiles').delete().eq('id', profile.id)
      console.log(`  ✅ Deleted profile: ${profile.name || profile.id}`)
    }
  }

  console.log('\n✅ Cleanup complete!')
}

cleanup().catch(console.error)
