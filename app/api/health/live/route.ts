import { NextResponse } from 'next/server'

// Kubernetes liveness probe endpoint - minimal check that service is alive
export async function GET() {
  return NextResponse.json({ status: 'alive', timestamp: new Date().toISOString() })
}