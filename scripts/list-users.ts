/**
 * List all auth users
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const accessTokenPath = path.join(process.env.HOME || '', '.supabase', 'access-token')
const accessToken = fs.readFileSync(accessTokenPath, 'utf-8').trim()

const PROJECT_REF = 'kecureoyekeqhrxkmjuh'
const SUPABASE_URL = 'https://kecureoyekeqhrxkmjuh.supabase.co'

async function getServiceRoleKey(): Promise<string> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
  const keys = await response.json()
  return keys.find((k: any) => k.name === 'service_role').api_key
}

async function listUsers() {
  const serviceRoleKey = await getServiceRoleKey()
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Auth users:')
  for (const user of data.users) {
    console.log(`  ${user.email} (${user.id}) - confirmed: ${user.email_confirmed_at ? 'yes' : 'no'}`)
  }

  // Also list profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, verification_status')

  console.log('\nProfiles:')
  for (const profile of profiles || []) {
    console.log(`  ${profile.name} (${profile.id}) - status: ${profile.verification_status}`)
  }
}

listUsers().catch(console.error)
