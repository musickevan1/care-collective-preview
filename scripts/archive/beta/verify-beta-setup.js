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

async function verifySetup() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   📊 BETA SETUP VERIFICATION                                   ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message)
    return
  }

  const { data: profiles } = await supabase.from('profiles').select('*')
  const { data: requests } = await supabase.from('help_requests').select('*')
  const { data: conversations } = await supabase.from('conversations_v2').select('*')
  const { data: messages } = await supabase.from('messages_v2').select('*')

  console.log('📊 Database Status:\n')
  console.log(`👥 Users: ${users.length}`)
  console.log(`📋 Profiles: ${profiles?.length || 0}`)
  console.log(`📝 Help Requests: ${requests?.length || 0}`)
  console.log(`💬 Conversations: ${conversations?.length || 0}`)
  console.log(`📨 Messages: ${messages?.length || 0}\n`)

  console.log('👥 Beta User Accounts:\n')
  const expectedEmails = [
    'tmbarakat1958@gmail.com',
    'ariadne.miranda.phd@gmail.com',
    'cconaway@missouristate.edu',
    'templemk@gmail.com',
    'dianemusick@att.net'
  ]

  expectedEmails.forEach((email, i) => {
    const user = users.find(u => u.email === email)
    const profile = profiles?.find(p => p.id === user?.id)
    
    if (user) {
      console.log(`${i + 1}. ✅ ${email}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Profile: ${profile?.name || '❌ Missing'}`)
      console.log(`   Location: ${profile?.location || '❌ Missing'}`)
    } else {
      console.log(`${i + 1}. ❌ ${email} - NOT FOUND`)
    }
    console.log('')
  })

  console.log('\n✅ Database verification complete\n')
}

verifySetup().catch(console.error)
