/**
 * Check profiles table directly
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

async function checkProfiles() {
  const serviceRoleKey = await getServiceRoleKey()
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // List profiles with test user IDs
  const testUserIds = [
    'f94bb6dd-d7c4-4d91-8638-df9a97aed4df', // test-user-a
    'c80374ce-5cc5-460d-b0d2-6959fcce9dae', // test-user-b
  ]

  console.log('Checking test user profiles...')

  for (const id of testUserIds) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.log(`\n${id}: Error - ${error.message}`)
    } else {
      console.log(`\n${id}:`)
      console.log(`  Name: ${data.name}`)
      console.log(`  Location: ${data.location}`)
      console.log(`  Status: ${data.verification_status}`)
      console.log(`  Admin: ${data.is_admin}`)
    }
  }

  // Update to approved
  console.log('\nUpdating to approved status...')

  for (const id of testUserIds) {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', id)

    if (error) {
      console.log(`${id}: Update failed - ${error.message}`)
    } else {
      console.log(`${id}: Updated to approved`)
    }
  }
}

checkProfiles().catch(console.error)
