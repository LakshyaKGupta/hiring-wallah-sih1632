import { NextResponse } from 'next/server'
import { INITIAL_RESOURCES } from '@/lib/serverData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  
  let results = [...INITIAL_RESOURCES]
  if (category && category !== 'all') {
    results = results.filter(r => r.category === category)
  }
  return NextResponse.json(results)
}
