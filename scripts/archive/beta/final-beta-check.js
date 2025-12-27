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

const BETA_CREDENTIALS = {
  'tmbarakat1958@gmail.com': { name: 'Terry Barakat', password: 'CareTest2024!Terry' },
  'ariadne.miranda.phd@gmail.com': { name: 'Ariadne Miranda', password: 'CareTest2024!Ariadne' },
  'cconaway@missouristate.edu': { name: 'Christy Conaway', password: 'CareTest2024!Christy' },
  'templemk@gmail.com': { name: 'Keith Templeman', password: 'CareTest2024!Keith' },
  'dianemusick@att.net': { name: 'Diane Musick', password: 'CareTest2024!Diane' },
}

async function finalCheck() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   🎉 BETA TESTING - FINAL VERIFICATION                        ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const { data: users } = await supabase.auth.admin.listUsers()
  const { data: profiles } = await supabase.from('profiles').select('*')
  const { count: helpCount } = await supabase.from('help_requests').select('*', { count: 'exact', head: true })
  const { count: msgCount } = await supabase.from('messages_v2').select('*', { count: 'exact', head: true })

  console.log('✅ Beta Test Accounts:\n')
  Object.entries(BETA_CREDENTIALS).forEach(([email, info]) => {
    const user = users.users.find(u => u.email === email)
    const profile = profiles?.find(p => p.id === user?.id)

    if (user && profile) {
      console.log(`   ✅ ${info.name}`)
      console.log(`      Email: ${email}`)
      console.log(`      Password: ${info.password}`)
      console.log(`      Status: ${profile.verification_status}`)
      console.log(`      Profile ID: ${user.id}`)
      console.log('')
    } else {
      console.log(`   ❌ ${info.name} - INCOMPLETE`)
      console.log(`      User exists: ${!!user}`)
      console.log(`      Profile exists: ${!!profile}`)
      console.log('')
    }
  })

  console.log('📊 Database State:\n')
  console.log(`   Help Requests: ${helpCount || 0}`)
  console.log(`   Messages: ${msgCount || 0}`)
  console.log(`   Conversations: 0`)
  console.log(`   Total Profiles: ${profiles?.length || 0}`)
  console.log(`   Total Auth Users: ${users.users.length}`)

  const readyCount = Object.keys(BETA_CREDENTIALS).filter(email => {
    const user = users.users.find(u => u.email === email)
    const profile = profiles?.find(p => p.id === user?.id)
    return user && profile
  }).length

  console.log('')
  console.log('╔════════════════════════════════════════════════════════════════╗')
  if (readyCount === 5 && helpCount === 0) {
    console.log('║   ✅ READY FOR BETA LAUNCH!                                    ║')
  } else {
    console.log('║   ⚠️  SETUP INCOMPLETE                                         ║')
  }
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`   ${readyCount}/5 accounts ready`)
  console.log(`   Database is ${helpCount === 0 ? 'clean' : 'has test data'}`)
  console.log('')
}

finalCheck().catch(console.error)
