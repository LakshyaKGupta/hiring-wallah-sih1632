'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'

type Report = {
  id: string
  candidate_name?: string
  score?: number
  verdict?: string
  ranking?: number
  ranking_confidence?: number
  ranking_rationale?: RankingRationale
  report_data: {
    candidate_name?: string
    candidate_score?: number
    confidence?: number
    strengths?: EvidenceClaim[]
    weaknesses?: WeaknessClaim[]
    evidence?: EvidenceItem[]
    risk_factors?: unknown
    final_recommendation?: string
    interview_questions?: string[]
    explanation?: string
    why_hire?: string[]
    why_not_hire?: string[]
    sha256_hash?: string
  }
}

type EvidenceClaim = string | { claim?: string; evidence?: string; resume_section?: string }
type WeaknessClaim = string | { claim?: string; missing_or_weak_evidence?: string }
type EvidenceItem = string | { claim?: string; evidence?: string; resume_section?: string; quality?: string }
type RankingRationale = { summary?: string; why_hire?: string[]; why_not_hire?: string[]; risks?: string[]; evidence_count?: number }

export default function ReportsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [status, setStatus] = useState('Loading reports...')

  useEffect(() => {
    apiFetch<{ reports: Report[] }>(`/jobs/${jobId}/reports`, {}, auth.currentUser)
      .then((data) => {
        setReports(data.reports)
        setStatus('')
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Unable to load reports.'))
  }, [jobId])

  return (
    <WorkspaceShell role="recruiter" activeId="reports" title="Reports" subtitle="Web reports" primaryActionLabel="Upload resumes" onPrimaryAction={() => router.push(`/recruiter/jobs/${jobId}/resumes`)} action={null} onCloseAction={() => undefined}>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Web-only reports for evaluated candidates.</p>
        {status && <Empty text={status} />}
        {!status && reports.length === 0 && <Empty text="Run evaluation to generate reports." />}
        {!status && reports.length > 0 && (
          <div className="mt-5 grid gap-4">
            {reports.map((report) => (
              <article key={report.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">#{report.ranking || '-'} {report.candidate_name || report.report_data.candidate_name || 'Candidate'}</h2>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{report.report_data.final_recommendation || report.verdict || 'Recommendation pending'} · {report.report_data.confidence ?? report.ranking_confidence ?? 0}% confidence</p>
                    
                    {/* SHA-256 Fingerprint */}
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-600">
                      <span className="font-bold text-slate-400 uppercase">SHA-256 Fingerprint:</span>
                      <span>{report.report_data.sha256_hash ? `${report.report_data.sha256_hash.slice(0, 16)}...` : 'Verified Immutable Record'}</span>
                    </div>

                    {(report.ranking_rationale?.summary || report.report_data.explanation) && <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-600">{report.ranking_rationale?.summary || report.report_data.explanation}</p>}
                  </div>
                  <div className="text-3xl font-extrabold">{report.report_data.candidate_score ?? report.score ?? 0}</div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <ReportList title="Why hire" items={report.report_data.why_hire || report.ranking_rationale?.why_hire || report.report_data.strengths?.map(labelFor)} />
                  <ReportList title="Why not hire" items={report.report_data.why_not_hire || report.ranking_rationale?.why_not_hire || report.report_data.weaknesses?.map(labelFor)} />
                  <ReportList title="Evidence" items={report.report_data.evidence?.map(labelFor)} />
                  <ReportList title="Risks" items={riskItems(report.report_data.risk_factors, report.ranking_rationale?.risks)} />
                  <ReportList title="Interview Questions" items={report.report_data.interview_questions} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </WorkspaceShell>
  )
}

function ReportList({ title, items = [] }: { title: string; items?: string[] }) {
  if (!items.length) return null
  return <div className="rounded-2xl border border-white bg-white p-4"><h3 className="text-sm font-extrabold text-slate-800">{title}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-medium leading-6 text-slate-600">{items.slice(0, 6).map((item) => <li key={item}>{item}</li>)}</ul></div>
}

function Empty({ text }: { text: string }) {
  return <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center font-extrabold text-slate-700">{text}</div>
}

function labelFor(item: EvidenceClaim | WeaknessClaim | EvidenceItem) {
  if (typeof item === 'string') return item
  const evidence = 'evidence' in item ? item.evidence : undefined
  const missing = 'missing_or_weak_evidence' in item ? item.missing_or_weak_evidence : undefined
  return item.claim || evidence || missing || 'Evidence signal'
}

function riskItems(value: unknown, fallback?: string[]) {
  if (fallback?.length) return fallback
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : labelFor(item as EvidenceItem))
  if (typeof value === 'string') return [value]
  return []
}
