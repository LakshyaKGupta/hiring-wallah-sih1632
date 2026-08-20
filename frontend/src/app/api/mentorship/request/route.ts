import { NextResponse } from 'next/server'
import { INITIAL_MENTORS } from '@/lib/serverData'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const mentor = INITIAL_MENTORS.find(m => m.id === body.mentor_id) || INITIAL_MENTORS[0]

  return NextResponse.json({
    id: `req-${Date.now()}`,
    mentor_id: mentor.id,
    career_goals: body.career_goals || 'Technical Career Guidance',
    status: 'pending',
    created_at: new Date().toISOString(),
    mentor
  })
}
