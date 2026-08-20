import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function GET() {
  return NextResponse.json([
    {
      id: 'app-demo-01',
      opportunity_id: INITIAL_OPPORTUNITIES[0].id,
      status: 'shortlisted',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      opportunity: INITIAL_OPPORTUNITIES[0]
    }
  ])
}
