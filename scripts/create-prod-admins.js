// Create admin users via Supabase production
const { createClient } = require('@supabase/supabase-js')

// Use production credentials (from MCP connection)
const SUPABASE_URL = 'https://kecureoyekeqhrxkmjuh.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_PROD || process.argv[3]

const admins = [
  {
    email: 'alice.test@carecollective.com',
    password: 'BetaTest2025!',
    name: 'Alice Martinez',
    location: 'Springfield, MO',
    is_admin: false
  },
  {
    email: 'bob.test@carecollective.com',
    password: 'BetaTest2025!',
    name: 'Bob Johnson',
    location: 'Branson, MO',
    is_admin: false
  },
  {
    email: 'carol.test@carecollective.com',
    password: 'BetaTest2025!',
    name: 'Carol Davis',
    location: 'Joplin, MO',
    is_admin: false
  }
]

async function createAdmins() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Need SUPABASE_SERVICE_ROLE_PROD or pass as 3rd arg')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  for (const admin of admins) {
    console.log(`\n📧 Creating: ${admin.email}`)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: { name: admin.name, role: 'admin' }
    })

    if (authError) {
      console.error(`❌ Error: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    console.log(`✅ Auth user: ${userId}`)

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      name: admin.name,
      location: admin.location || null,
      is_admin: admin.is_admin !== undefined ? admin.is_admin : true,
      verification_status: 'approved',
      email_confirmed: true,
      email_confirmed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })

    if (profileError) {
      console.error(`❌ Profile error: ${profileError.message}`)
    } else {
      console.log(`✅ Profile created for ${admin.email}`)
    }
  }

  console.log('\n🎉 Admin setup complete!')
  console.log('\n📋 Login Credentials:')
  admins.forEach(a => {
    console.log(`\n   ${a.name}:`)
    console.log(`   Email: ${a.email}`)
    console.log(`   Password: ${a.password}`)
  })
}

createAdmins().catch(console.error)
