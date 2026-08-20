'use client'

import React, { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Award,
  Flame,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'

interface ComparedCandidate {
  evaluation_id: string
  candidate_id: string
  candidate_name: string
  overall_score: number
  verdict: string
  confidence: number
  skills_match_percentage: number
  evidence_coverage_percentage: number
  verified_claims_count: number
  total_claims_count: number
  critical_concerns_count: number
  top_strengths: string[]
  key_risks: string[]
  devils_advocate_score: number
  agent_disagreement_delta: number
  is_fallback_evaluation: boolean
}

interface ComparisonResult {
  job_id: string
  job_title: string
  compared_candidates: ComparedCandidate[]
  winner_evaluation_id: string
  tradeoff_summary: string
  why_ranked_first: string
  key_differentiators: string[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CandidateComparisonPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()

  const [availableEvaluations, setAvailableEvaluations] = useState<any[]>([])
  const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch all evaluated candidates for this job
  const loadJobResults = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/recruiter/job/${jobId}/results`)
      if (!res.ok) throw new Error('Failed to load candidate evaluations.')
      const data = await res.json()
      const list = data.results || []
      setAvailableEvaluations(list)

      // Auto-select first 2 candidates if available
      if (list.length >= 2) {
        const topTwo = [list[0].evaluation_id, list[1].evaluation_id]
        setSelectedEvalIds(topTwo)
        runComparison(topTwo)
      } else if (list.length === 1) {
        setSelectedEvalIds([list[0].evaluation_id])
      }
    } catch (err: any) {
      setError(err.message || 'Unable to fetch candidates.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Perform comparison analysis
  const runComparison = async (evalIds: string[]) => {
    if (evalIds.length < 2) return
    setComparing(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation_ids: evalIds })
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Comparison analysis failed.')
      }
      const data: ComparisonResult = await res.json()
      setComparison(data)
    } catch (err: any) {
      setError(err.message || 'Comparison request failed.')
    } finally {
      setComparing(false)
    }
  }

  useEffect(() => {
    loadJobResults()
  }, [jobId])

  const toggleCandidate = (id: string) => {
    let next: string[]
    if (selectedEvalIds.includes(id)) {
      if (selectedEvalIds.length <= 2) {
        // Must keep at least 2 selected if comparing
        return
      }
      next = selectedEvalIds.filter(x => x !== id)
    } else {
      if (selectedEvalIds.length >= 4) {
        alert('You can compare a maximum of 4 candidates at once.')
        return
      }
      next = [...selectedEvalIds, id]
    }
    setSelectedEvalIds(next)
    if (next.length >= 2) {
      runComparison(next)
    }
  }

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="jobs"
      title="Candidate Trade-off Comparison"
      subtitle="Multi-candidate forensic evidence and decision intelligence"
      primaryActionLabel="Job Overview"
      onPrimaryAction={() => router.push(`/recruiter/jobs/${jobId}`)}
      action={null}
      onCloseAction={() => undefined}
      backHref={`/recruiter/jobs/${jobId}`}
      backLabel="Back to job"
    >
      <div className="space-y-8">
        
        {/* Candidate Selector Bar */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent-primary" />
                Select 2 to 4 Candidates to Compare Side-by-Side
              </h2>
              <p className="text-xs text-slate-500">
                Evaluating candidate evidence coverage, technical depth, and agent contention delta.
              </p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {selectedEvalIds.length} Selected
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {availableEvaluations.map((ev) => {
              const isSelected = selectedEvalIds.includes(ev.evaluation_id)
              const name = ev.candidate_profile?.name || ev.candidate?.name || 'Candidate'
              const score = ev.evaluation?.score ?? ev.score ?? 0
              return (
                <button
                  key={ev.evaluation_id}
                  onClick={() => toggleCandidate(ev.evaluation_id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                    isSelected
                      ? 'border-accent-primary/50 bg-accent-primary/10 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-accent-primary border-accent-primary text-black' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                  </div>
                  <span>{name}</span>
                  <span className="font-mono text-[11px] font-bold text-slate-400">({score}%)</span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {comparing && (
          <div className="flex items-center justify-center p-12 text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
            <span>Calculating side-by-side trade-off matrix...</span>
          </div>
        )}

        {/* Comparison Presentation */}
        {!comparing && comparison && (
          <div className="space-y-6">
            
            {/* Executive Trade-Off Rationale Card */}
            <div className="p-6 rounded-3xl border border-accent-primary/30 bg-gradient-to-br from-accent-primary/5 via-white to-accent-primary/10 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-primary text-black font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Award className="w-3 h-3" /> Comparative Lead
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Job: {comparison.job_title}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Decision Trade-off Summary
                  </h3>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {comparison.tradeoff_summary}
              </p>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                  Why Ranked First:
                </div>
                <p className="text-xs text-slate-600">
                  {comparison.why_ranked_first}
                </p>
                <div className="space-y-1 pt-1.5 border-t border-slate-100">
                  {comparison.key_differentiators.map((diff, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-accent-primary font-bold">•</span>
                      <span>{diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-Side Candidate Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparison.compared_candidates.map((cand) => {
                const isWinner = cand.evaluation_id === comparison.winner_evaluation_id
                return (
                  <div
                    key={cand.evaluation_id}
                    className={`rounded-3xl p-6 border transition flex flex-col justify-between space-y-6 ${
                      isWinner
                        ? 'border-accent-primary bg-white shadow-md ring-1 ring-accent-primary/30'
                        : 'border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              {cand.candidate_name}
                            </h4>
                            {isWinner && (
                              <span className="px-2 py-0.5 rounded-full bg-accent-primary/20 text-black text-[10px] font-bold">
                                #1 Pick
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: {cand.evaluation_id.slice(0, 8)}...
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            {cand.overall_score}%
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cand.verdict === 'Strong Hire' || cand.verdict === 'Hire'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {cand.verdict}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Coverage Progress Bar */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Evidence Coverage</span>
                          <span className="font-mono text-accent-primary">{cand.evidence_coverage_percentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            style={{ width: `${cand.evidence_coverage_percentage}%` }}
                            className="h-full bg-accent-primary rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>{cand.verified_claims_count} Verified Claims</span>
                          <span>{cand.total_claims_count} Total Claims</span>
                        </div>
                      </div>

                      {/* Key Comparison Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                          <span className="text-[10px] text-slate-400 block">Skills Fit</span>
                          <span className="font-bold text-slate-800 font-mono">{cand.skills_match_percentage}%</span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                          <span className="text-[10px] text-slate-400 block">Agent Delta</span>
                          <span className={`font-bold font-mono ${
                            cand.agent_disagreement_delta > 20 ? 'text-red-500' : 'text-slate-800'
                          }`}>
                            ±{cand.agent_disagreement_delta} pts
                          </span>
                        </div>
                      </div>

                      {/* Top Strengths */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Key Strengths
                        </span>
                        <ul className="space-y-1 text-slate-600 text-[11px]">
                          {cand.top_strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Critical Concerns */}
                      {cand.key_risks.length > 0 && (
                        <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500" /> Devil's Advocate Risks
                          </span>
                          <ul className="space-y-1 text-slate-600 text-[11px]">
                            {cand.key_risks.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>

                    {/* Action Link to Full Audit Report */}
                    <div className="pt-4 border-t border-slate-100">
                      <Link
                        href={`/recruiter/candidate/${cand.evaluation_id}`}
                        className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Open Audit Report
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>

                  </div>
                )
              })}
            </div>

          </div>
        )}

      </div>
    </WorkspaceShell>
  )
}
