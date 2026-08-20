'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  FileSearch,
  ShieldCheck,
  Upload,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  BrainCircuit,
  Search,
  Target,
  Scale,
  Users,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import { useRouter } from 'next/navigation'

type Job = {
  id: string
  title: string
  company?: string | null
  location?: string | null
  experience_range?: string | null
  ai_status?: string | null
  created_at: string
  resume_count?: number
  evaluation_count?: number
}

function SkeletonAgent() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="h-3 w-48 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

function SkeletonJobRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-48 rounded-full bg-slate-200" />
          <div className="h-3 w-32 rounded-full bg-slate-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
    </div>
  )
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
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${className}`}>{label}</span>
  )
}



export default function RecruiterDashboard() {
  const router = useRouter()
  const { user, loading, profileLoading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState({
    active_jobs: 0,
    candidates_screened: 0,
    shortlisted_candidates: 0,
    reports_generated: 0,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (loading || profileLoading) return
    if (!user) {
      router.replace('/auth?mode=signin')
    } else if (!user.role) {
      router.replace('/auth')
    } else if (user.role !== 'recruiter') {
      router.replace(`/${user.role}`)
    }
  }, [user, loading, profileLoading, router])

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return
    Promise.all([
      apiFetch<Job[]>('/jobs', {}, auth.currentUser),
      apiFetch<{
        active_jobs: number
        candidates_screened: number
        shortlisted_candidates: number
        reports_generated: number
      }>('/recruiter/dashboard/stats', {}, auth.currentUser).catch(() => ({
        active_jobs: 0,
        candidates_screened: 0,
        shortlisted_candidates: 0,
        reports_generated: 0,
      })),
    ])
      .then(([jobsData, statsData]) => {
        setJobs(jobsData)
        setStats(statsData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load jobs.'))
      .finally(() => setIsLoading(false))
  }, [user])

  if (loading || profileLoading || !user || !user.role) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-4 w-4 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Opening Hiring Intelligence Center…</span>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="dashboard"
      title="Hiring Intelligence Center"
      subtitle={`${stats.active_jobs || jobs.length} Active Hiring Processes`}
      primaryActionLabel="Create Hiring Process"
      onPrimaryAction={() => router.push('/recruiter/jobs/new')}
      action={null}
      onCloseAction={() => undefined}
    >
      {/* ── LIVE METRICS BANNER ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Active Jobs</div>
            <div className="text-2xl font-black text-slate-950">{stats.active_jobs || jobs.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Candidates Screened</div>
            <div className="text-2xl font-black text-slate-950">{stats.candidates_screened}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Shortlisted Finalists</div>
            <div className="text-2xl font-black text-slate-950">{stats.shortlisted_candidates}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Audit Reports Ready</div>
            <div className="text-2xl font-black text-slate-950">{stats.reports_generated}</div>
          </div>
        </div>
      </section>

      {/* ── EMPTY STATE OR RECENT JOBS ── */}
      <section>
        {isLoading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <SkeletonJobRow /><SkeletonJobRow /><SkeletonJobRow />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 flex items-center gap-3 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p>Could not load hiring processes</p>
              <p className="font-medium text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-14 shadow-sm text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-white to-white" />

            <div className="relative z-10 flex flex-col items-center justify-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
                <Briefcase className="h-8 w-8 text-slate-300" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 mb-2">No active hiring processes</h2>
              <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto mb-8">
                Create a job to unleash your AI hiring team and start automatically screening and ranking candidates.
              </p>
              
              <Link
                href="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4" /> Create First Hiring Process
              </Link>
            </div>
          </motion.div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Recent Hiring Decisions</h2>
                <p className="mt-0.5 text-sm font-medium text-slate-500">Select a process to view AI recommendations and candidate rankings.</p>
              </div>
              <Link
                href="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 hover:-translate-y-px"
              >
                <Plus className="h-4 w-4" /> New process
              </Link>
            </div>

            <div className="space-y-3">
              {jobs.slice(0, 6).map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/recruiter/jobs/${job.id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-sky-50 group-hover:border-sky-100 group-hover:text-sky-600">
                        <Briefcase className="h-5 w-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-950 text-base truncate">{job.title}</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
                          {[job.company, job.location, job.experience_range].filter(Boolean).join(' · ') || 'Details pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <AiStatusBadge status={job.ai_status} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}

              {jobs.length > 6 && (
                <Link
                  href="/recruiter/jobs"
                  className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3.5 text-sm font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-white"
                >
                  View all {jobs.length} hiring processes <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </WorkspaceShell>
  )
}
