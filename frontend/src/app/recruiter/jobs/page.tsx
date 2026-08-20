'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import {
  Briefcase,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

type Job = {
  id: string
  title: string
  company?: string | null
  location?: string | null
  experience_range?: string | null
  ai_status?: string | null
  created_at: string
  resume_count?: number
}

function AiStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'not_configured'
  const map: Record<string, { label: string; className: string }> = {
    not_configured: { label: 'Not configured', className: 'border-slate-200 bg-slate-50 text-slate-500' },
    configured: { label: 'AI ready', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    processing: { label: 'Processing', className: 'border-sky-200 bg-sky-50 text-sky-700' },
    done: { label: 'Evaluated', className: 'border-violet-200 bg-violet-50 text-violet-700' },
    error: { label: 'Error', className: 'border-red-200 bg-red-50 text-red-700' },
  }
  const { label, className } = map[s] ?? map['not_configured']
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{label}</span>
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-48 rounded-full bg-slate-200" />
          <div className="h-3 w-32 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-6 w-24 rounded-full bg-slate-100" />
        <div className="h-4 w-16 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

export default function RecruiterJobsPage() {
  const router = useRouter()
  const { user, loading, profileLoading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth?mode=signin')
    if (!loading && user?.role && user.role !== 'recruiter') router.replace(`/${user.role}`)
  }, [user, loading, router])

  const load = () => {
    if (!user || user.role !== 'recruiter') return
    setStatus('loading')
    setError('')
    apiFetch<Job[]>('/jobs', {}, auth.currentUser)
      .then((data) => {
        setJobs(data)
        setStatus('done')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load jobs.')
        setStatus('error')
      })
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line

  if (loading || profileLoading || !user || !user.role) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-4 w-4 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading jobs…</span>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="jobs"
      title="Jobs"
      subtitle={`${jobs.length} job${jobs.length !== 1 ? 's' : ''} · Create and manage postings`}
      primaryActionLabel="Create job"
      onPrimaryAction={() => router.push('/recruiter/jobs/new')}
      action={null}
      onCloseAction={() => undefined}
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Jobs</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">Create a job, then upload resumes for AI-powered evaluation.</p>
          </div>
          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" /> Create job
          </Link>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="space-y-2.5">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Could not load jobs</p>
              <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {status === 'done' && jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
              <Briefcase className="h-7 w-7 text-slate-300" />
            </div>
            <h2 className="text-base font-bold text-slate-800">No jobs yet</h2>
            <p className="mt-1.5 text-sm font-medium text-slate-400 max-w-xs">
              Create your first job posting to start the hiring pipeline.
            </p>
            <Link
              href="/recruiter/jobs/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Create first job
            </Link>
          </motion.div>
        )}

        {/* Jobs list */}
        {status === 'done' && jobs.length > 0 && (
          <div className="space-y-2.5">
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/recruiter/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-sky-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm group-hover:border-sky-200 transition-colors">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-950 truncate">{job.title}</h2>
                      <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                        {[job.company, job.location, job.experience_range].filter(Boolean).join(' · ') || 'Details not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {job.resume_count !== undefined && job.resume_count > 0 && (
                      <span className="hidden sm:block text-xs font-bold text-slate-400">
                        {job.resume_count} resume{job.resume_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    <AiStatusBadge status={job.ai_status} />
                    <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-300">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </WorkspaceShell>
  )
}
