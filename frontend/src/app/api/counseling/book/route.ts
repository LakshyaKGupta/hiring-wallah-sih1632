import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    id: `session-${Date.now()}`,
    counselor_id: body.counselor_id,
    topic: body.topic || 'Career Guidance',
    preferred_mode: body.preferred_mode || 'video_call',
    slot_time: body.slot_time || 'Next Available',
    status: 'confirmed',
    created_at: new Date().toISOString()
  })
}
