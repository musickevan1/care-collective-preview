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

const BETA_EMAILS = [
  'tmbarakat1958@gmail.com',
  'ariadne.miranda.phd@gmail.com',
  'cconaway@missouristate.edu',
  'templemk@gmail.com',
  'dianemusick@att.net'
]

async function removeExtra() {
  const { data: users } = await supabase.auth.admin.listUsers()
  
  console.log('Checking for non-beta users...\n')
  
  for (const user of users.users) {
    if (!BETA_EMAILS.includes(user.email)) {
      console.log(`🗑️  Removing: ${user.email}`)
      await supabase.auth.admin.deleteUser(user.id)
      await supabase.from('profiles').delete().eq('id', user.id)
      console.log(`✅ Deleted`)
    }
  }
  
  console.log('\n✅ Cleanup complete')
}

removeExtra().catch(console.error)
