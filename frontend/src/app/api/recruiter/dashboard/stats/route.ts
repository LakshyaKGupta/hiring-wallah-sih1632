import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    active_jobs: 2,
    candidates_screened: 22,
    shortlisted_candidates: 9,
    reports_generated: 16
  })
}
