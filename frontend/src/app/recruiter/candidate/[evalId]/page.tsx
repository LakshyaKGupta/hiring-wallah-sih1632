'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Copy, Check, MessageSquare, Calendar, GraduationCap, Award } from 'lucide-react'
import ScoreBar from '@/components/ui/ScoreBar'
import DAPanel from '@/components/ui/DAPanel'
import VerdictReveal from '@/components/ui/VerdictReveal'
import MeshBackground from '@/components/ui/MeshBackground'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface EvaluationDetail {
  evaluation: {
    id: string
    candidate_id: string
    job_id: string
    score: number
    breakdown: Record<string, { score: number; evidence: string[]; justification: string }>
    strengths: string[]
    weaknesses: string[]
    evidence: string[]
    devils_advocate?: {
      contested_claims?: Array<{
        severity: string
        original_claim: string
        counter: string
      }>
      risk_factors?: string[]
      overall_confidence_adjustment?: number
      recommendation?: string
    }
  }
  candidate: {
    id: string
    name: string
    email: string
    raw_resume_text: string
    parsed_profile: {
      name: string
      experience_years: number
      projects: Array<{
        name: string
        description: string
        evidence: string[]
        impact: string
        technologies: string[]
      }>
      skills_demonstrated: string[]
      quantified_achievements: string[]
      education: string[]
      missing_evidence: string[]
      career_trajectory: string
    }
  }
  decision: {
    id: string
    verdict: string
    confidence: number
    explanation: string
    interview_questions: string[]
    ranking: number
  }
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const evalId = params?.evalId as string

  const [data, setData] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Candidate Status & Integrity State
  const [candidateStatus, setCandidateStatus] = useState('Screened')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<{ valid: boolean; sha256: string; status: string } | null>(null)
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/recruiter/evaluation/${evalId}`)
      if (res.ok) {
        const detail = await res.json()
        setData(detail)
        if (detail.evaluation?.status) {
          setCandidateStatus(detail.evaluation.status)
        }
      }
    } catch (e) {
      console.error('Error fetching candidate evaluation details:', e)
    } finally {
      setLoading(false)
    }
  }, [evalId])

  const verifyIntegrity = useCallback(async () => {
    setVerifyingIntegrity(true)
    try {
      const res = await fetch(`${API_URL}/recruiter/evaluation/${evalId}/integrity`)
      if (res.ok) {
        const result = await res.json()
        setIntegrityResult(result)
      }
    } catch {
      // Handled
    } finally {
      setVerifyingIntegrity(false)
    }
  }, [evalId])

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      const res = await fetch(`${API_URL}/recruiter/evaluation/${evalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCandidateStatus(newStatus)
      }
    } catch {
      // Handled
    } finally {
      setStatusUpdating(false)
    }
  }

  useEffect(() => {
    let active = true
    if (evalId) {
      const handle = requestAnimationFrame(() => {
        if (active) {
          fetchDetail()
          verifyIntegrity()
        }
      })
      return () => {
        active = false
        cancelAnimationFrame(handle)
      }
    }
  }, [evalId, fetchDetail, verifyIntegrity])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-bg-deep flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
        <span className="type-label text-xs text-text-tertiary">
          Syncing reasoning trails...
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 bg-bg-deep flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary text-sm mb-4">Candidate evaluation detail not found.</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-bg-surface border border-border-subtle text-caption font-sans font-medium rounded text-text-primary hover:border-accent-primary cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  const profile = data.candidate.parsed_profile
  const evaluation = data.evaluation
  const decision = data.decision
  const da = evaluation.devils_advocate || {}

  return (
    <div className="flex-1 bg-bg-deep min-h-screen text-text-primary font-sans flex flex-col relative">
      {/* Zoho Grid backdrop with Mesh Blobs */}
      <MeshBackground opacity={0.2} />

      {/* Sub Header */}
      <header className="border-b border-border-subtle bg-bg-surface py-4 px-6 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full border border-border-subtle hover:border-accent-primary flex items-center justify-center text-text-secondary hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="type-caption text-text-tertiary block">
                Candidate Evaluation
              </span>
              <h1 className="text-xl font-display font-extrabold text-text-primary tracking-tight">
                {profile.name || data.candidate.name || 'Unknown Candidate'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="type-label text-text-tertiary">Verdict:</span>
            <span className={`px-2 py-0.5 rounded text-xs type-label border ${
              decision.verdict === 'Strong Hire' 
                ? 'text-accent-green border-accent-green/20 bg-accent-green/5' 
                : decision.verdict === 'Consider' 
                  ? 'text-accent-amber border-accent-amber/20 bg-accent-amber/5' 
                  : 'text-accent-red border-accent-red/20 bg-accent-red/5'
            }`}>
              {decision.verdict}
            </span>
          </div>
        </div>
      </header>

      {/* Grid Layout - 3 Columns on desktop */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24">
        
        {/* COLUMN 1: CANDIDATE PROFILE (col span 3) */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-5">
            <h2 className="type-label text-text-tertiary border-b border-border-subtle pb-2">
              Background
            </h2>

            {/* Exp & Email */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-text-secondary">
                <Calendar className="w-4 h-4 text-accent-primary" />
                <span>{profile.experience_years || 0} Years Experience</span>
              </div>
              <div className="flex items-center gap-2.5 text-text-secondary">
                <GraduationCap className="w-4 h-4 text-accent-primary" />
                <span className="truncate">{profile.education?.[0] || 'Degree Unspecified'}</span>
              </div>
            </div>

            {/* Skills chip list */}
            <div>
              <span className="type-caption text-text-tertiary block mb-2">
                Demonstrated Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills_demonstrated?.map((skill) => (
                  <span key={skill} className="bg-bg-deep border border-border-subtle px-2 py-0.5 rounded text-[10px] type-label text-text-secondary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Career trajectory */}
            <div>
              <span className="type-caption text-text-tertiary block mb-1">
                Career Trajectory
              </span>
              <p className="text-xs text-text-secondary leading-relaxed font-sans italic">
                &ldquo;{profile.career_trajectory}&rdquo;
              </p>
            </div>
          </div>

          {/* Stated Projects */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
            <h2 className="type-label text-text-tertiary border-b border-border-subtle pb-2">
              Experience
            </h2>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {profile.projects?.map((project, idx) => (
                <div key={idx} className="border-b border-border-subtle/50 pb-3 last:border-b-0 last:pb-0">
                  <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-accent-primary" />
                    {project.name}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-1 font-sans leading-relaxed">
                    {project.description}
                  </p>
                  {project.impact && (
                    <div className="mt-1.5 text-[10px] text-accent-green font-sans leading-tight">
                      <span className="font-semibold">Stated Impact:</span> {project.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMN 2: COMMITTEE EVALUATION (col span 5) */}
        <section className="lg:col-span-5 space-y-6">
          {/* Custom animated Verdict Reveal component */}
          <VerdictReveal
            verdict={decision.verdict}
            confidence={decision.confidence}
            explanation={decision.explanation}
          />

          {/* Scoring Rubric Dimension breakdowns */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-5">
            <h2 className="type-label text-text-tertiary border-b border-border-subtle pb-2">
              Evaluation Breakdown
            </h2>

            <div className="space-y-5">
              {Object.entries(evaluation.breakdown || {}).map(([dim, details]) => (
                <div key={dim} className="border-b border-border-subtle/30 pb-4 last:border-b-0 last:pb-0">
                  <ScoreBar
                    label={dim}
                    score={details.score}
                    color={details.score > 80 ? 'bg-accent-green' : details.score > 60 ? 'bg-accent-amber' : 'bg-accent-red'}
                  />
                  
                  {/* Justification text */}
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed font-sans pl-1 border-l-2 border-border-subtle">
                    {details.justification}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Interview Questions */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
            <h2 className="type-label text-text-tertiary border-b border-border-subtle pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent-primary" />
              <span>Suggested Interview Questions</span>
            </h2>

            <div className="space-y-3">
              {decision.interview_questions?.map((q, idx) => (
                <div key={idx} className="bg-bg-deep border border-border-subtle rounded-lg p-3 relative group">
                  <p className="text-xs text-text-primary leading-relaxed pr-8 font-sans">
                    {q}
                  </p>
                  
                  <button
                    onClick={() => copyToClipboard(q, idx)}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded border border-border-subtle hover:border-accent-primary text-text-tertiary hover:text-accent-primary flex items-center justify-center transition-colors bg-bg-deep"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-accent-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMN 3: DEVIL'S ADVOCATE CRITIQUE (col span 4) */}
        <section className="lg:col-span-4 space-y-6">
          <DAPanel
            claims={da.contested_claims || []}
            riskFactors={da.risk_factors || []}
            confidenceAdjustment={da.overall_confidence_adjustment || 0}
            recommendation={da.recommendation || 'Approve'}
          />

          {/* Strengths & Weaknesses checklist */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 grid grid-cols-2 gap-4">
            
            {/* Strengths */}
            <div>
              <h4 className="type-caption text-accent-green border-b border-border-subtle pb-1 mb-2">
                Evaluator Strengths
              </h4>
              <ul className="space-y-1.5">
                {evaluation.strengths?.slice(0, 3).map((st, i) => (
                  <li key={i} className="text-xs text-text-secondary font-sans leading-tight">
                    • {st}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <h4 className="type-caption text-accent-da border-b border-border-subtle pb-1 mb-2">
                Evaluator Weaknesses
              </h4>
              <ul className="space-y-1.5">
                {evaluation.weaknesses?.slice(0, 3).map((wk, i) => (
                  <li key={i} className="text-xs text-text-secondary font-sans leading-tight">
                    • {wk}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

      </main>

      {/* Sticky Action Bar & Real SHA-256 Integrity Fingerprint */}
      <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-md py-4 px-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Workflow Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Status:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                {candidateStatus}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                disabled={statusUpdating || candidateStatus === 'Shortlisted'}
                onClick={() => handleUpdateStatus('Shortlisted')}
                className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-xs font-bold rounded-xl text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-40"
              >
                {statusUpdating ? 'Updating...' : '✓ Shortlist Candidate'}
              </button>

              <button
                disabled={statusUpdating || candidateStatus === 'Interview Scheduled'}
                onClick={() => handleUpdateStatus('Interview Scheduled')}
                className="px-3.5 py-1.5 bg-sky-50 border border-sky-200 text-xs font-bold rounded-xl text-sky-800 hover:bg-sky-100 transition disabled:opacity-40"
              >
                📅 Schedule Interview
              </button>

              <button
                disabled={statusUpdating || candidateStatus === 'Offer Extended'}
                onClick={() => handleUpdateStatus('Offer Extended')}
                className="px-3.5 py-1.5 bg-violet-50 border border-violet-200 text-xs font-bold rounded-xl text-violet-800 hover:bg-violet-100 transition disabled:opacity-40"
              >
                🎉 Extend Offer
              </button>

              <button
                disabled={statusUpdating || candidateStatus === 'Rejected'}
                onClick={() => handleUpdateStatus('Rejected')}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition disabled:opacity-40"
              >
                ✗ Reject
              </button>
            </div>
          </div>

          {/* Real SHA-256 Integrity Verification Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Report Integrity Fingerprint
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 truncate max-w-[200px]">
                {integrityResult?.sha256 ? `${integrityResult.sha256.slice(0, 16)}...` : 'Computing SHA-256...'}
              </div>
            </div>

            <button
              onClick={verifyIntegrity}
              disabled={verifyingIntegrity}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
                integrityResult?.valid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-950 text-white border-slate-950 hover:bg-slate-800'
              }`}
            >
              {verifyingIntegrity ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : integrityResult?.valid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Valid
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Verify Integrity
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
