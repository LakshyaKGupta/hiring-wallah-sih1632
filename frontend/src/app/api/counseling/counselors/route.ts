import { NextResponse } from 'next/server'
import { INITIAL_COUNSELORS } from '@/lib/serverData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const specialization = searchParams.get('specialization')
  
  let results = [...INITIAL_COUNSELORS]
  if (specialization) {
    results = results.filter(c => c.specialization.toLowerCase().includes(specialization.toLowerCase()))
  }
  return NextResponse.json(results)
}
