#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function cleanOrphaned() {
  console.log('🔍 Finding orphaned profiles...\n')

  // Get all auth users
  const { data: users } = await supabase.auth.admin.listUsers()
  const authUserIds = new Set(users.users.map(u => u.id))

  // Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('id, name')

  console.log(`Found ${profiles.length} profiles and ${users.users.length} auth users\n`)

  // Find orphaned profiles
  const orphaned = profiles.filter(p => !authUserIds.has(p.id))

  if (orphaned.length === 0) {
    console.log('✅ No orphaned profiles found!')
    return
  }

  console.log(`Found ${orphaned.length} orphaned profiles:\n`)
  orphaned.forEach(p => console.log(`   - ${p.name} (${p.id})`))

  console.log('\n🗑️  Deleting orphaned profiles...\n')

  for (const profile of orphaned) {
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id)
    if (error) {
      console.log(`   ❌ Error deleting ${profile.name}: ${error.message}`)
    } else {
      console.log(`   ✅ Deleted: ${profile.name}`)
    }
  }

  console.log('\n✅ Cleanup complete!')
}

cleanOrphaned().catch(console.error)
