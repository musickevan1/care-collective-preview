#!/usr/bin/env node

/**
 * Reset Production Database for Beta (Non-Interactive)
 *
 * WARNING: This bypasses confirmation prompts
 * Only use when you're absolutely certain
 *
 * Usage: node scripts/reset-prod-noninteractive.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load ONLY production environment (ignore all other .env files)
const prodEnvPath = path.join(__dirname, '..', '.env.prod')
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8')

// Parse .env.prod manually to avoid conflicts with other .env files
const prodEnv = {}
prodEnvContent.split('\n').forEach(line => {
  line = line.trim()
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      prodEnv[key] = value
    }
  }
})

const SUPABASE_URL = prodEnv.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = prodEnv.SUPABASE_SERVICE_ROLE

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║   🔥 PRODUCTION DATABASE RESET (AUTO-CONFIRMED) 🔥             ║')
console.log('╚════════════════════════════════════════════════════════════════╝')
console.log('')
console.log(`🔗 Database: ${SUPABASE_URL}`)
console.log('⚠️  Proceeding WITHOUT confirmation prompts...')
console.log('')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials from .env.prod')
  process.exit(1)
}

async function resetDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('📝 Deleting data from public tables...\n')

  const tables = [
    'messages_v2', 'conversations_v2', 'message_reports', 'message_audit_log',
    'messages', 'conversation_participants', 'conversations', 'messaging_preferences',
    'contact_sharing_history', 'contact_exchange_audit', 'contact_exchanges',
    'privacy_violation_alerts', 'data_export_requests', 'user_privacy_settings',
    'help_requests', 'user_restrictions', 'verification_status_changes', 'audit_logs'
  ]

  for (const table of tables) {
    try {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log(`   ✅ Deleted ${table}`)
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`)
    }
  }

  console.log('\n🔐 Deleting auth users...\n')

  const { data: users } = await supabase.auth.admin.listUsers()
  console.log(`   Found ${users.users.length} users to delete`)

  for (const user of users.users) {
    await supabase.auth.admin.deleteUser(user.id)
    console.log(`   ✅ Deleted: ${user.email}`)
  }

  console.log('\n📊 Verifying reset...\n')

  const { data: remainingUsers } = await supabase.auth.admin.listUsers()
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: requestCount } = await supabase.from('help_requests').select('*', { count: 'exact', head: true })

  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   🎉 DATABASE RESET COMPLETE                                   ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`   Auth Users: ${remainingUsers.users.length}`)
  console.log(`   Profiles: ${profileCount || 0}`)
  console.log(`   Help Requests: ${requestCount || 0}`)
  console.log('')
  console.log('✅ Production database cleaned')
  console.log('')
  console.log('🔗 Next: node scripts/create-beta-users.js')
  console.log('')
}

resetDatabase().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
