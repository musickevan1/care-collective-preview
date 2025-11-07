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

async function forceDelete() {
  const userId = '11ddd4b2-cac3-4aee-ae7f-e5519232edad'
  
  console.log(`Deleting user ${userId}...`)
  
  const result = await supabase.auth.admin.deleteUser(userId)
  console.log('Delete result:', result)
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const { data: users } = await supabase.auth.admin.listUsers()
  console.log(`\nUsers after delete: ${users.users.length}`)
  const stillExists = users.users.find(u => u.id === userId)
  console.log(`test@admin.org still exists: ${!!stillExists}`)
}

forceDelete().catch(console.error)
