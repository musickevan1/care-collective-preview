const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const prodEnvPath = path.join(process.cwd(), '.env.prod')
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

async function cleanupTestData() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   🧹 CLEANING UP TEST DATA                                     ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  // Get current state
  const { data: requestsBefore } = await supabase.from('help_requests').select('id, title')
  const { data: conversationsBefore } = await supabase.from('conversations_v2').select('id')
  const { data: messagesBefore } = await supabase.from('messages_v2').select('id')

  console.log('📊 Before cleanup:')
  console.log(`   Help Requests: ${requestsBefore?.length || 0}`)
  console.log(`   Conversations: ${conversationsBefore?.length || 0}`)
  console.log(`   Messages: ${messagesBefore?.length || 0}\n`)

  // Delete messages first (foreign key constraint)
  const { error: messagesError } = await supabase
    .from('messages_v2')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (messagesError) {
    console.log('⚠️  Error deleting messages:', messagesError.message)
  } else {
    console.log('✅ Deleted all test messages')
  }

  // Delete conversations
  const { error: conversationsError } = await supabase
    .from('conversations_v2')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (conversationsError) {
    console.log('⚠️  Error deleting conversations:', conversationsError.message)
  } else {
    console.log('✅ Deleted all test conversations')
  }

  // Delete help requests
  const { error: requestsError } = await supabase
    .from('help_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (requestsError) {
    console.log('⚠️  Error deleting help requests:', requestsError.message)
  } else {
    console.log('✅ Deleted all test help requests')
  }

  // Verify cleanup
  const { data: requestsAfter } = await supabase.from('help_requests').select('id')
  const { data: conversationsAfter } = await supabase.from('conversations_v2').select('id')
  const { data: messagesAfter } = await supabase.from('messages_v2').select('id')

  console.log('\n📊 After cleanup:')
  console.log(`   Help Requests: ${requestsAfter?.length || 0}`)
  console.log(`   Conversations: ${conversationsAfter?.length || 0}`)
  console.log(`   Messages: ${messagesAfter?.length || 0}\n`)

  console.log('✅ Test data cleanup complete!\n')
}

cleanupTestData().catch(console.error)
