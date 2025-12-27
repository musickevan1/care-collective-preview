#!/usr/bin/env node

/**
 * Reset Database for Beta Testing
 *
 * WARNING: This will DELETE ALL USER DATA from the database
 * - Deletes all users, profiles, help requests, messages, conversations
 * - Preserves database schema, migrations, RLS policies
 * - Requires manual confirmation to proceed
 *
 * Usage: node scripts/reset-database-for-beta.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Load environment variables
require('dotenv').config()

// Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE')
  process.exit(1)
}

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function resetDatabase() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   🚨 DATABASE RESET FOR BETA TESTING 🚨                        ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('⚠️  WARNING: This will DELETE ALL USER DATA from the database:')
  console.log('   ❌ All user accounts and profiles')
  console.log('   ❌ All help requests')
  console.log('   ❌ All messages and conversations')
  console.log('   ❌ All contact exchanges')
  console.log('   ❌ All audit logs')
  console.log('')
  console.log('✅ This WILL preserve:')
  console.log('   ✓ Database schema and tables')
  console.log('   ✓ Migrations and RLS policies')
  console.log('   ✓ Functions and triggers')
  console.log('')
  console.log(`🔗 Database: ${SUPABASE_URL}`)
  console.log('')

  // First confirmation
  const confirm1 = await askQuestion('Are you ABSOLUTELY SURE you want to reset the database? (yes/no): ')

  if (confirm1.toLowerCase() !== 'yes') {
    console.log('\n✋ Database reset cancelled.')
    rl.close()
    process.exit(0)
  }

  // Second confirmation (extra safety)
  const confirm2 = await askQuestion('\n⚠️  FINAL CONFIRMATION: Type "RESET DATABASE" to proceed: ')

  if (confirm2 !== 'RESET DATABASE') {
    console.log('\n✋ Database reset cancelled.')
    rl.close()
    process.exit(0)
  }

  console.log('\n🔥 Proceeding with database reset...\n')

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, 'database', 'reset-for-beta.sql')
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8')

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('📝 Executing database reset script...\n')

    // Execute the SQL script
    // Note: Supabase JS doesn't support RAISE NOTICE, so we'll execute and report results

    // Delete in correct order to avoid FK violations
    const deleteQueries = [
      { table: 'messages_v2', desc: 'Messages V2' },
      { table: 'conversations_v2', desc: 'Conversations V2' },
      { table: 'message_reports', desc: 'Message Reports' },
      { table: 'message_audit_log', desc: 'Message Audit Log' },
      { table: 'messages', desc: 'Messages V1' },
      { table: 'conversation_participants', desc: 'Conversation Participants' },
      { table: 'conversations', desc: 'Conversations V1' },
      { table: 'messaging_preferences', desc: 'Messaging Preferences' },
      { table: 'contact_sharing_history', desc: 'Contact Sharing History' },
      { table: 'contact_exchange_audit', desc: 'Contact Exchange Audit' },
      { table: 'contact_exchanges', desc: 'Contact Exchanges' },
      { table: 'privacy_violation_alerts', desc: 'Privacy Violation Alerts' },
      { table: 'data_export_requests', desc: 'Data Export Requests' },
      { table: 'user_privacy_settings', desc: 'User Privacy Settings' },
      { table: 'help_requests', desc: 'Help Requests' },
      { table: 'user_restrictions', desc: 'User Restrictions' },
      { table: 'verification_status_changes', desc: 'Verification Status Changes' },
      { table: 'audit_logs', desc: 'Audit Logs' },
    ]

    // Delete from public schema tables
    for (const { table, desc } of deleteQueries) {
      try {
        const { error, count } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')

        if (error && !error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${desc}: ${error.message}`)
        } else {
          console.log(`   ✅ Deleted ${desc}`)
        }
      } catch (err) {
        console.log(`   ⚠️  ${desc}: ${err.message}`)
      }
    }

    // Delete auth users (will cascade to profiles)
    console.log('\n🔐 Deleting auth users...')

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error(`   ❌ Error listing users: ${listError.message}`)
    } else {
      console.log(`   Found ${users.users.length} users to delete`)

      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

        if (deleteError) {
          console.log(`   ⚠️  Error deleting user ${user.email}: ${deleteError.message}`)
        } else {
          console.log(`   ✅ Deleted user: ${user.email}`)
        }
      }
    }

    // Verify deletion
    console.log('\n📊 Verifying database reset...\n')

    const { data: remainingUsers } = await supabase.auth.admin.listUsers()
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: requestCount } = await supabase.from('help_requests').select('*', { count: 'exact', head: true })
    const { count: messageCount } = await supabase.from('messages_v2').select('*', { count: 'exact', head: true })
    const { count: conversationCount } = await supabase.from('conversations_v2').select('*', { count: 'exact', head: true })

    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║   🎉 DATABASE RESET COMPLETE                                   ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📊 Verification:')
    console.log(`   Auth Users: ${remainingUsers?.users?.length || 0}`)
    console.log(`   Profiles: ${profileCount || 0}`)
    console.log(`   Help Requests: ${requestCount || 0}`)
    console.log(`   Messages: ${messageCount || 0}`)
    console.log(`   Conversations: ${conversationCount || 0}`)
    console.log('')

    if ((remainingUsers?.users?.length || 0) === 0 && (profileCount || 0) === 0) {
      console.log('✅ All user data successfully deleted')
      console.log('')
      console.log('🔗 Next Steps:')
      console.log('   1. Create beta test users:')
      console.log('      node scripts/create-beta-users.js')
      console.log('')
      console.log('   2. (Optional) Create admin accounts:')
      console.log('      node scripts/create-prod-admins.js')
      console.log('')
      console.log('   3. Verify by logging in at:')
      console.log('      https://care-collective-preview.vercel.app/auth/login')
    } else {
      console.log('⚠️  Some data may remain. Please verify manually.')
    }

    console.log('')

  } catch (error) {
    console.error('\n❌ Error during database reset:')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Run the script
resetDatabase().catch(error => {
  console.error('Fatal error:', error)
  rl.close()
  process.exit(1)
})
