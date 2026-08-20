import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const opportunity = INITIAL_OPPORTUNITIES.find(o => o.id === id)
  if (!opportunity) {
    return NextResponse.json({ detail: 'Opportunity not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    id: `app-${Date.now()}`,
    opportunity_id: id,
    status: 'under_review',
    created_at: new Date().toISOString(),
    opportunity
  })
}
