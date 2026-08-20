import { NextResponse } from 'next/server'
import { INITIAL_MENTORS } from '@/lib/serverData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const industry = searchParams.get('industry')

  let results = [...INITIAL_MENTORS]
  if (industry && industry !== 'All Domains') {
    results = results.filter(m => m.industry === industry)
  }
  return NextResponse.json(results)
}
