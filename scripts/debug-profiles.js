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

async function debug() {
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  console.log('📊 Profiles Query Result:')
  console.log('Count:', count)
  console.log('Error:', error)
  console.log('Data:', JSON.stringify(data, null, 2))

  // Also delete test@admin.org
  console.log('\n🗑️  Deleting test@admin.org...')
  const { data: users } = await supabase.auth.admin.listUsers()
  const testAdmin = users.users.find(u => u.email === 'test@admin.org')
  if (testAdmin) {
    await supabase.auth.admin.deleteUser(testAdmin.id)
    console.log('✅ Deleted test@admin.org')
  }
}

debug().catch(console.error)
