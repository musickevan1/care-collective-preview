import * as fs from 'fs'
import * as path from 'path'

const accessTokenPath = path.join(process.env.HOME || '', '.supabase', 'access-token')
const accessToken = fs.readFileSync(accessTokenPath, 'utf-8').trim()
const PROJECT_REF = 'kecureoyekeqhrxkmjuh'

async function getServiceRoleKey() {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const keys = await response.json()
  const serviceKey = keys.find((k: any) => k.name === 'service_role')
  console.log(serviceKey?.api_key)
}

getServiceRoleKey()
