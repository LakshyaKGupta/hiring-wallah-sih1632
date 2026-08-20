import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const opportunity = INITIAL_OPPORTUNITIES.find(o => o.id === id)
  if (!opportunity) {
    return NextResponse.json({ detail: 'Opportunity not found' }, { status: 404 })
  }
  return NextResponse.json(opportunity)
}
