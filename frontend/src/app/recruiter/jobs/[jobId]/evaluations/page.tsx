'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import {
  FileSearch,
  AlertCircle,
  RefreshCw,
  Trophy,
  TrendingUp,
  Shield,
  ArrowRight,
  Upload,
} from 'lucide-react'

type Result = {
  evaluation_id: string
  profile: { name?: string; email?: string }
  evaluation: {
    score: number
    strengths: EvidenceClaim[]
    weaknesses: WeaknessClaim[]
    evidence_items?: EvidenceItem[]
    status?: string
  }
  critique?: { risk_factors?: string[] }
  decision: {
    verdict?: string
    confidence?: number
    ranking?: number
    explanation?: string
    ranking_rationale?: RankingRationale
  }
}

type EvidenceClaim = string | { claim?: string; evidence?: string; resume_section?: string }
type WeaknessClaim = string | { claim?: string; missing_or_weak_evidence?: string }
type EvidenceItem = { claim?: string; evidence?: string; resume_section?: string; quality?: string }
type RankingRationale = {
  summary?: string
  why_hire?: string[]
  why_not_hire?: string[]
  risks?: string[]
  evidence_count?: number
}

function labelFor(item: EvidenceClaim | WeaknessClaim): string {
  if (typeof item === 'string') return item
  const evidence = 'evidence' in item ? item.evidence : undefined
  const missing = 'missing_or_weak_evidence' in item ? item.missing_or_weak_evidence : undefined
  return item.claim || evidence || missing || 'Evidence signal'
}

function VerdictBadge({ verdict }: { verdict?: string }) {
  const v = (verdict || '').toLowerCase()
  if (v.includes('strong') || v.includes('hire')) {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{verdict}</span>
  }
  if (v.includes('consider') || v.includes('maybe')) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{verdict}</span>
  }
  if (v.includes('reject') || v.includes('no')) {
    return <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">{verdict}</span>
  }
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{verdict || 'Pending'}</span>
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-full bg-slate-200" />
          <div className="h-3 w-24 rounded-full bg-slate-100" />
          <div className="h-3 w-full rounded-full bg-slate-100 max-w-md" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-9 w-16 rounded-xl bg-slate-200" />
          <div className="h-3 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function EvaluationsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'done'>('loading')
  const [error, setError] = useState('')

  const load = () => {
    setLoadState('loading')
    apiFetch<{ results: Result[] }>(`/jobs/${jobId}/evaluations`, {}, auth.currentUser)
      .then((data) => {
        setResults(data.results)
        setLoadState('done')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load evaluations.')
        setLoadState('error')
      })
  }

  useEffect(() => { load() }, [jobId]) // eslint-disable-line

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="evaluations"
      title="Evaluations"
      subtitle="Candidate ranking · AI-powered"
      primaryActionLabel="Upload resumes"
      onPrimaryAction={() => router.push(`/recruiter/jobs/${jobId}/resumes`)}
      action={null}
      onCloseAction={() => undefined}
      backHref={`/recruiter/jobs/${jobId}`}
      backLabel="Back to job"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Candidate Rankings</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              {loadState === 'done' && results.length > 0
                ? `${results.length} candidate${results.length !== 1 ? 's' : ''} evaluated · ranked by AI score`
                : 'Evaluations appear after resumes are uploaded and AI is configured.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Refresh evaluations"
            >
              <RefreshCw className={`h-4 w-4 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href={`/recruiter/jobs/${jobId}/reports`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 transition"
            >
              Reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loadState === 'loading' && (
          <div className="space-y-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Could not load evaluations</p>
              <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {loadState === 'done' && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
              <FileSearch className="h-7 w-7 text-slate-300" />
            </div>
            <h2 className="text-base font-bold text-slate-800">No evaluations yet</h2>
            <p className="mt-1.5 text-sm font-medium text-slate-400 max-w-xs">
              Upload resumes and ensure AI is configured for this job to generate evaluations.
            </p>
            <Link
              href={`/recruiter/jobs/${jobId}/resumes`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" /> Upload resumes
            </Link>
          </motion.div>
        )}

        {/* Results */}
        {loadState === 'done' && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.article
                key={result.evaluation_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 hover:border-slate-300 transition-colors"
              >
                {/* Candidate header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {result.decision.ranking || index + 1}
                      </span>
                      <h2 className="text-lg font-extrabold text-slate-950">
                        {result.profile.name || 'Candidate'}
                      </h2>
                      {result.decision.verdict && <VerdictBadge verdict={result.decision.verdict} />}
                    </div>
                    {result.profile.email && (
                      <p className="mt-1 ml-11 text-xs font-medium text-slate-400">{result.profile.email}</p>
                    )}
                    {result.decision.ranking_rationale?.summary && (
                      <p className="mt-2 ml-11 text-sm font-medium leading-6 text-slate-600 max-w-2xl">
                        {result.decision.ranking_rationale.summary}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-extrabold text-slate-950">{result.evaluation.score}</div>
                    <div className="text-xs font-bold text-slate-400 mt-0.5">score</div>
                    {result.decision.confidence !== undefined && (
                      <div className="mt-1 text-xs font-bold text-slate-400">{result.decision.confidence}% confidence</div>
                    )}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {/* Why hire */}
                  <SignalList
                    title="Why hire"
                    icon={TrendingUp}
                    items={result.decision.ranking_rationale?.why_hire || result.evaluation.strengths.map(labelFor)}
                    tone="good"
                  />

                  {/* Risks */}
                  <SignalList
                    title="Risks"
                    icon={AlertCircle}
                    items={result.decision.ranking_rationale?.risks || result.critique?.risk_factors || result.evaluation.weaknesses.map(labelFor)}
                    tone="risk"
                  />

                  {/* Evidence count */}
                  <div className="rounded-lg border border-white bg-white p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Points</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-950">
                        {result.decision.ranking_rationale?.evidence_count ?? result.evaluation.evidence_items?.length ?? 0}
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">items found</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </WorkspaceShell>
  )
}

function SignalList({
  title,
  icon: Icon,
  items = [],
  tone,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items?: string[]
  tone: 'good' | 'risk'
}) {
  const color = tone === 'good' ? 'text-emerald-600' : 'text-amber-600'
  const iconColor = tone === 'good' ? 'text-emerald-500' : 'text-amber-500'

  return (
    <div className="rounded-lg border border-white bg-white p-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs font-medium text-slate-400">None recorded</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 4).map((item, i) => (
            <li key={i} className="text-xs font-medium leading-5 text-slate-600 line-clamp-2">{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
