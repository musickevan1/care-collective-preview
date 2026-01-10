/**
 * Finalize test user profiles with proper names and locations
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

async function finalizeUsers() {
  const serviceRoleKey = await getServiceRoleKey()
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const updates = [
    {
      id: 'f94bb6dd-d7c4-4d91-8638-df9a97aed4df',
      name: 'Test User A',
      location: 'Springfield, MO',
    },
    {
      id: 'c80374ce-5cc5-460d-b0d2-6959fcce9dae',
      name: 'Test User B',
      location: 'Branson, MO',
    },
  ]

  console.log('Finalizing test user profiles...\n')

  for (const user of updates) {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: user.name,
        location: user.location,
        verification_status: 'approved',
      })
      .eq('id', user.id)

    if (error) {
      console.log(`✗ ${user.name}: ${error.message}`)
    } else {
      console.log(`✓ ${user.name} (${user.location}) - approved`)
    }
  }

  console.log('\n✅ Test users ready!\n')
  console.log('Credentials:')
  console.log('  test-user-a@example.com / testpassword123')
  console.log('  test-user-b@example.com / testpassword123')
}

finalizeUsers().catch(console.error)
