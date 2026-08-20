import { NextResponse } from 'next/server'

let recruiterJobs: any[] = [
  {
    id: 'job-01',
    title: 'Lead Solar Grid Engineer',
    company: 'Rajasthan Renewable Energy Corp (RRECL)',
    location: 'Bhadla (Jodhpur), Rajasthan',
    experience_range: '0-2 years',
    description: 'Lead PV array site operations and high-voltage grid dispatch telemetry.',
    ai_status: 'ready',
    candidates_count: 8,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: 'job-02',
    title: 'Associate Cloud Engineer (DOIT&C State Portal)',
    company: 'Dept of Information Technology & Communication',
    location: 'Jaipur, Rajasthan',
    experience_range: '0-1 year',
    description: 'Develop and maintain Rajasthan e-governance state portal microservices.',
    ai_status: 'ready',
    candidates_count: 14,
    created_at: '2026-08-20T04:15:13.199419'
  }
]

export async function GET() {
  return NextResponse.json(recruiterJobs)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const newJob = {
    id: `job-${Date.now()}`,
    title: body.title || 'Technical Specialist',
    company: body.company || 'Rajasthan Enterprise Partner',
    location: body.location || 'Jaipur, Rajasthan',
    experience_range: body.experience_range || 'Fresher',
    description: body.description || 'Verified hiring process for Rajasthan technical graduates.',
    ai_status: 'ready',
    candidates_count: 0,
    created_at: new Date().toISOString()
  }
  recruiterJobs.unshift(newJob)
  return NextResponse.json(newJob)
}
