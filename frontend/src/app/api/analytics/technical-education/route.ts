import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    metrics: {
      total_opportunities: 48,
      total_candidates: 320,
      total_applications: 184,
      total_evaluations: 142,
      active_jobs: 12
    },
    branch_demand: [
      { branch: 'Computer Science / IT', open_positions: 22, student_interest_pct: 45, demand_index: 92 },
      { branch: 'Electrical & Power Systems', open_positions: 14, student_interest_pct: 25, demand_index: 86 },
      { branch: 'Mechanical & Automation', open_positions: 8, student_interest_pct: 18, demand_index: 74 },
      { branch: 'Civil & Infra', open_positions: 4, student_interest_pct: 12, demand_index: 68 }
    ],
    sector_distribution: [
      { sector: 'Govt & PSUs', count: 18, share_pct: 37.5 },
      { sector: 'Private Tech SEZ', count: 16, share_pct: 33.3 },
      { sector: 'AICTE Internships', count: 8, share_pct: 16.7 },
      { sector: 'Overseas (TITP)', count: 6, share_pct: 12.5 }
    ],
    top_missing_skills: [
      { skill: 'SCADA / Substation Telemetry', frequency: 64, primary_branch: 'Electrical', recommended_course: 'NPTEL Industrial Automation & SCADA' },
      { skill: 'TypeScript & Next.js', frequency: 58, primary_branch: 'Computer Science / IT', recommended_course: 'Modern Full Stack Engineering' },
      { skill: 'AutoCAD Electrical & SLD', frequency: 46, primary_branch: 'Electrical', recommended_course: 'Solar PV Single Line Diagram Design' },
      { skill: 'Docker Containerization & CI/CD', frequency: 42, primary_branch: 'Computer Science / IT', recommended_course: 'Cloud Native DevOps' }
    ],
    governance_metadata: {
      data_source: 'Rajasthan Directorate of Technical Education & Verified Employers',
      audit_standard: 'SIH1632 Deterministic Demand Signal Analytics',
      last_synced: new Date().toISOString()
    }
  })
}
