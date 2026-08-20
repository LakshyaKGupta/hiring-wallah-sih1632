import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const target_role = body.target_role || 'Engineering Candidate'
  const current_skills = (body.current_skills || []) as string[]

  return NextResponse.json({
    target_role,
    technical_domain: 'Rajasthan Technical Engineering & Technology',
    match_percentage: 84,
    skills_possessed: current_skills.length > 0 ? current_skills : ['Core Engineering', 'Problem Solving', 'Git'],
    skills_missing: ['SCADA / Telemetry Systems', 'IEC 61850 Standards', 'Cloud Containerization'],
    next_best_action: 'Complete NPTEL / AICTE certified Industrial Automation & Substation SCADA course',
    unlocked_opportunities_count: 6,
    opportunity_unlock_impact: 'Unlocks 6 high-priority state vacancies at Bhadla Solar Park and RVUNL generation substations.',
    learning_milestones: [
      {
        milestone: 1,
        phase: 'Foundational Competency',
        timeframe: 'Weeks 1-3',
        objective: 'Master Single Line Diagrams and Protection Relays',
        recommended_course: 'NPTEL Power System Protection & Switchgear',
        practical_lab: 'AutoCAD Electrical SLD Drafting Project'
      },
      {
        milestone: 2,
        phase: 'Applied Industrial Automation',
        timeframe: 'Weeks 4-7',
        objective: 'Configure PLC Ladder Logic & Modbus Telemetry',
        recommended_course: 'AICTE Industrial Automation Specialization',
        practical_lab: 'Simulated 33kV Substation Telemetry Dispatch'
      }
    ]
  })
}
