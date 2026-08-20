import { NextResponse } from 'next/server'
import { INITIAL_COUNSELORS } from '@/lib/serverData'

export async function GET() {
  return NextResponse.json([
    {
      id: 'cs-demo-01',
      counselor_id: INITIAL_COUNSELORS[0].id,
      topic: 'Polytechnic to LEET B.Tech Transition',
      preferred_mode: 'video_call',
      slot_time: 'Next Available',
      status: 'confirmed',
      created_at: new Date().toISOString()
    }
  ])
}
