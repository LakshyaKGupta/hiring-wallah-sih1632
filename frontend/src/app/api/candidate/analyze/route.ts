import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null)
  const target_role = (formData?.get('target_role') as string) || 'AI Product Specialist'

  const sessionId = `sess-${Date.now()}`

  return NextResponse.json({
    session: {
      id: sessionId,
      candidate_id: 'cand-lakshya',
      target_role,
      fit_score: 88,
      skill_gaps: {
        'Cloud Scalability': 'Hands-on AWS / GCP container orchestration',
        'Model Evaluation Metrics': 'A/B testing and precision-recall calibration'
      },
      tailored_resume_suggestions: {
        'Worked on AI models': 'Architected end-to-end LLM pipeline with 88% precision rating and sub-100ms latency'
      },
      cover_letter: 'Dear Hiring Committee,\n\nI am writing to express my strong enthusiasm for the position. With proven experience across technical systems, user requirements, and full-stack execution, I am eager to contribute.\n\nSincerely,\nCandidate',
      interview_prep: {
        mock_questions: [
          'How do you measure product ROI and user retention for a technical feature?',
          'Explain how you debug complex distributed system bottlenecks.'
        ]
      },
      job_recommendations: INITIAL_OPPORTUNITIES.slice(0, 3),
      created_at: new Date().toISOString()
    },
    candidate: {
      id: 'cand-lakshya',
      name: 'Candidate',
      email: 'candidate@hiringwallah.gov.in',
      parsed_profile: {
        skills_demonstrated: ['Python', 'Machine Learning', 'SQL', 'FastAPI', 'Problem Solving'],
        branch: 'Technical Engineering'
      }
    }
  })
}
