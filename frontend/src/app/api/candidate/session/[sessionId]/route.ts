import { NextResponse } from 'next/server'
import { INITIAL_OPPORTUNITIES } from '@/lib/serverData'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  return NextResponse.json({
    id: sessionId,
    candidate_id: 'cand-lakshya',
    target_role: 'AI Product Specialist',
    fit_score: 88,
    match_strength: 88,
    verified_claims: ['Python', 'Machine Learning', 'Product Strategy', 'SQL', 'FastAPI'],
    strengths: [
      { claim: 'Hands-on AI Application Development', evidence: 'Built multimodal retrieval pipeline' }
    ],
    weaknesses: [],
    missing_keywords: ['IEC Standards', 'SCADA'],
    session: {
      id: sessionId,
      candidate_id: 'cand-lakshya',
      target_role: 'AI Product Specialist',
      fit_score: 88,
      skill_gaps: {
        'Cloud Infrastructure': 'Hands-on AWS / GCP production scaling',
        'Model Evaluation Metrics': 'A/B testing and precision-recall calibration'
      },
      tailored_resume_suggestions: {
        'Worked on AI models': 'Architected end-to-end LLM pipeline with 88% precision rating and sub-100ms latency'
      },
      cover_letter: 'Dear Hiring Committee,\n\nI am writing to express my strong enthusiasm for the AI Product Specialist position. With proven experience across AI systems, user-centric product requirements, and full-stack execution, I am eager to contribute to your engineering initiatives.\n\nSincerely,\nCandidate',
      interview_prep: {
        mock_questions: [
          'How do you measure product ROI and user retention for an AI feature?',
          'Explain how you prevent LLM hallucinations in customer-facing workflows.'
        ]
      },
      job_recommendations: INITIAL_OPPORTUNITIES.slice(0, 3),
      created_at: new Date().toISOString()
    },
    candidate: {
      id: 'cand-lakshya',
      name: 'Lakshya Sharma',
      email: 'lakshya.sharma@dte.rajasthan.gov.in',
      parsed_profile: {
        skills_demonstrated: ['Python', 'Machine Learning', 'Product Strategy', 'SQL', 'FastAPI'],
        branch: 'Computer Science / IT'
      }
    }
  })
}
