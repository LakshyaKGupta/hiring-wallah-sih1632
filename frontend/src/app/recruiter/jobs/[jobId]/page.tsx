'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import {
  Upload,
  FileSearch,
  ShieldCheck,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Scale,
} from 'lucide-react'

type Job = {
  id: string
  title: string
  company?: string
  location?: string
  experience_range?: string
  description: string
  ai_status?: string
  created_at?: string
}

function AiStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    not_configured: { label: 'AI not configured', className: 'border-slate-200 bg-slate-50 text-slate-500' },
    configured: { label: 'AI ready', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    processing: { label: 'Processing', className: 'border-sky-200 bg-sky-50 text-sky-700' },
    done: { label: 'Evaluation complete', className: 'border-violet-200 bg-violet-50 text-violet-700' },
    error: { label: 'Error occurred', className: 'border-red-200 bg-red-50 text-red-700' },
  }
  const s = status || 'not_configured'
  const { label, className } = map[s] ?? map['not_configured']
  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${className}`}>{label}</span>
}

function SkeletonJob() {
  return (
    <div className="animate-pulse grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
        <div className="h-4 w-1/2 rounded-full bg-slate-100" />
        <div className="space-y-2 mt-6">
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="h-3 w-5/6 rounded-full bg-slate-100" />
          <div className="h-3 w-4/6 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-6 w-32 rounded-xl bg-slate-200" />
        <div className="space-y-3 mt-4">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'done'>('loading')
  const [error, setError] = useState('')

  const load = () => {
    setLoadState('loading')
    apiFetch<Job>(`/jobs/${jobId}`, {}, auth.currentUser)
      .then((data) => { setJob(data); setLoadState('done') })
      .catch((err) => { setError(err instanceof Error ? err.message : 'Unable to load job.'); setLoadState('error') })
  }

  useEffect(() => { load() }, [jobId]) // eslint-disable-line

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="jobs"
      title={job ? job.title : 'Job'}
      subtitle="Job workspace"
      primaryActionLabel="Upload resumes"
      onPrimaryAction={() => router.push(`/recruiter/jobs/${jobId}/resumes`)}
      action={null}
      onCloseAction={() => undefined}
      backHref="/recruiter/jobs"
      backLabel="Back to jobs"
    >
      {loadState === 'loading' && <SkeletonJob />}

      {loadState === 'error' && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 flex flex-col items-center text-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div>
            <h2 className="text-lg font-bold text-red-800">Could not load job</h2>
            <p className="text-sm font-medium text-red-500 mt-1">{error}</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {loadState === 'done' && job && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"
        >
          {/* Job details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{job.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {job.company && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                    </span>
                  )}
                  {job.experience_range && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {job.experience_range}
                    </span>
                  )}
                </div>
              </div>
              <AiStatusBadge status={job.ai_status} />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Job Description</h2>
              <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{job.description}</p>
            </div>
          </section>

          {/* Next actions */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950 mb-5">Next Actions</h2>
            <div className="grid gap-3">
              <ActionCard
                href={`/recruiter/jobs/${job.id}/resumes`}
                icon={Upload}
                title="Upload Resumes"
                body="PDF, DOCX, TXT · Max 20 per batch"
                color="sky"
              />
              <ActionCard
                href={`/recruiter/jobs/${job.id}/evaluations`}
                icon={FileSearch}
                title="Candidate Rankings"
                body="Review completed AI evaluations"
                color="violet"
              />
              <ActionCard
                href={`/recruiter/jobs/${job.id}/compare`}
                icon={Scale}
                title="Compare Candidates"
                body="Side-by-side evidence & trade-off analysis"
                color="amber"
              />
              <ActionCard
                href={`/recruiter/jobs/${job.id}/reports`}
                icon={ShieldCheck}
                title="Reports"
                body="Open verified audit reports"
                color="emerald"
              />
            </div>

            {job.created_at && (
              <p className="mt-5 text-xs font-medium text-slate-300">
                Created {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </aside>
        </motion.div>
      )}
    </WorkspaceShell>
  )
}

function ActionCard({
  href,
  icon: Icon,
  title,
  body,
  color,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  color: 'sky' | 'violet' | 'emerald' | 'amber'
}) {
  const colorMap = {
    sky: 'bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-100',
    violet: 'bg-violet-50 border-violet-100 text-violet-600 group-hover:bg-violet-100',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-100',
  }
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${colorMap[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5">{body}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}
