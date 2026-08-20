import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const candidate_skills = (body.candidate_skills || []) as string[]

  const recommendations = INITIAL_OPPORTUNITIES.map(opp => {
    const req = opp.skills_required || []
    const matching = req.filter(r => candidate_skills.some(c => c.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(c.toLowerCase())))
    const missing = req.filter(r => !matching.includes(r))
    const ratio = req.length > 0 ? matching.length / req.length : 0.8
    const fit_score = Math.min(Math.round(ratio * 40 + 55), 98)

    return {
      opportunity: opp,
      fit_score,
      verdict: fit_score >= 80 ? 'Strong Match' : 'Potential Match',
      matching_skills: matching.length > 0 ? matching : ['Foundational Engineering Problem Solving'],
      missing_skills: missing.length > 0 ? missing : ['Domain Specialization'],
      explainable_summary: `Direct alignment with ${opp.organization} requirements across ${opp.branch}.`
    }
  })

  return NextResponse.json({
    recommendations: recommendations.sort((a, b) => b.fit_score - a.fit_score)
  })
}
