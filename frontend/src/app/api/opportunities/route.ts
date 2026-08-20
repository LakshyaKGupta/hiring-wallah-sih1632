import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sector = searchParams.get('sector')
  const branch = searchParams.get('branch')
  const location = searchParams.get('location')
  const search = searchParams.get('search')?.toLowerCase()

  let results = [...INITIAL_OPPORTUNITIES]

  if (sector && sector !== 'all') {
    results = results.filter(o => o.sector === sector)
  }
  if (branch && branch !== 'All Branches') {
    results = results.filter(o => o.branch?.toLowerCase().includes(branch.toLowerCase()) || o.branch?.toLowerCase().includes('all'))
  }
  if (location && location !== 'All Locations') {
    results = results.filter(o => o.location.toLowerCase().includes(location.toLowerCase()))
  }
  if (search) {
    results = results.filter(o =>
      o.title.toLowerCase().includes(search) ||
      o.organization.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search) ||
      o.skills_required?.some(s => s.toLowerCase().includes(search))
    )
  }

  return NextResponse.json(results)
}
