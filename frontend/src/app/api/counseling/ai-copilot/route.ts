import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES, INITIAL_RESOURCES } from '@/lib/serverData'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const query = (body.query || '').trim()
  const branch = body.student_branch || 'Computer Science / Engineering'
  const qual = body.qualification || 'B.Tech / Diploma'
  const q_lower = query.toLowerCase()

  let answer = ''
  let actionable_steps: string[] = []

  if (q_lower.includes('product') || q_lower.includes('pm') || q_lower.includes('ai')) {
    answer = `### Career Roadmap: AI & Technical Product Management (${qual} - ${branch})\n\n1. **Core AI Product Fundamentals**: Master differences between traditional software and probabilistic AI systems (precision/recall, token latency, context windows, and safety guardrails).\n2. **Product Execution**: Write PRDs defining user personas and metrics (Retention, Time-to-Value). Create interactive Figma wireframes.\n3. **Proof-of-Work**: Build and document an end-to-end AI application and highlight metric outcomes on your resume.`
    actionable_steps = [
      'Build and document an AI prototype product with a published PRD',
      'Complete Google Cloud AI / Gemini Foundations certification',
      'Optimize resume with quantified metric achievements',
      'Apply to AI Product Specialist openings on the Hiring Wallah portal'
    ]
  } else if (q_lower.includes('solar') || q_lower.includes('electrical') || q_lower.includes('power')) {
    answer = `### Career Roadmap: Electrical & Renewable Energy Engineering (${qual} - ${branch})\n\n1. **Solar PV & Substation Competencies**: Master PVsyst, AutoCAD Electrical single-line diagrams, and SCADA automation.\n2. **State & PSU Pathways**: Target RVUNL, RVPN, RRECL, and Bhadla Solar Park operators (Sterling & Wilson, Tata Power Solar).`
    actionable_steps = [
      'Enroll in Solar PV & Substation Automation certification',
      'Practice modeling 500kW+ solar single-line diagrams in AutoCAD',
      'Download official RVUNL Junior Engineer exam syllabus',
      'Apply to verified Renewable EPC vacancies on Opportunities Hub'
    ]
  } else if (q_lower.includes('polytechnic') || q_lower.includes('diploma') || q_lower.includes('leet')) {
    answer = `### Polytechnic to B.Tech & High-Paying Employment Pathways (${qual} - ${branch})\n\n1. **Rajasthan Lateral Entry (LEET)**: Direct admission into 2nd year B.Tech across RTU Kota, MBM Jodhpur, and CTAE Udaipur.\n2. **State Government Technical Jobs**: RSSB Junior Engineer (Pay Level 10) and RRB JE.\n3. **Overseas Apprenticeships**: Japan TITP technical placement in Tokyo/Nagoya.`
    actionable_steps = [
      'Track official LEET counseling portal on dte.rajasthan.gov.in',
      'Begin Japanese N5 prep for overseas TITP placement',
      'Assemble semester marksheets and AICTE logbook',
      'Book a 1-on-1 session with a Rajasthan Polytechnic Advisor'
    ]
  } else {
    answer = `### Personalized Technical Career Guidance for ${qual} (${branch})\n\nAddressing your query: *"${query}"*\n\n1. **High-Growth Placement Channels**: Private technology hubs across Jaipur Tech SEZ and Rajasthan State Govt technical cadres (RVUNL, RPSC, RSSB).\n2. **Skill-Gap Strategy**: Target hands-on verified projects to prove competency.\n3. **State Guidance**: Connect with state career counselors and alumni mentors.`
    actionable_steps = [
      'Run a free Skill-Gap Analysis against your target job title',
      'Explore verified multi-sector opportunities matching your branch',
      'Book a 1-on-1 guidance session with a Technical Education Counselor',
      'Connect with an active alumni mentor on the Mentorship portal'
    ]
  }

  return NextResponse.json({
    answer,
    recommended_opportunities: INITIAL_OPPORTUNITIES.slice(0, 3),
    actionable_steps,
    related_resources: INITIAL_RESOURCES.slice(0, 2)
  })
}
