'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import type { Opportunity } from '@/app/opportunities/page'

interface ApplicationItem {
  id: string
  opportunity_id: string
  user_uid: string
  status: string
  cover_note?: string
  match_score?: number
  applied_at?: string
  created_at?: string
  opportunity?: Opportunity
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    applied: { label: 'Application Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
    under_review: { label: 'Under Department Review', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
    shortlisted: { label: 'Shortlisted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Not Selected', className: 'bg-slate-50 text-slate-600 border-slate-200', icon: AlertCircle },
  }

  const normalized = status.toLowerCase()
  const info = map[normalized] || map.applied
  const Icon = info.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${info.className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{info.label}</span>
    </span>
  )
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchApplications = useCallback(async () => {
    if (!auth.currentUser) return
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<ApplicationItem[]>('/opportunities/applications/me', {}, auth.currentUser)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load applications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?mode=signin&redirect=/applications')
      return
    }
    if (user) {
      void fetchApplications()
    }
  }, [user, authLoading, router, fetchApplications])

  return (
    <WorkspaceShell
      role="candidate"
      activeId="applications"
      title="My Applications"
      subtitle="Track your submissions across Rajasthan opportunities"
      primaryActionLabel="Find Opportunities"
      onPrimaryAction={() => router.push('/opportunities')}
      action={null}
      onCloseAction={() => undefined}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Application History</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Real-time submission status recorded in the technical education registry.
            </p>
          </div>

          {applications.length > 0 && (
            <button
              onClick={fetchApplications}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <div className="h-5 w-40 bg-slate-100 rounded-full" />
                <div className="h-7 w-2/3 bg-slate-200 rounded-xl" />
                <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-900">Failed to load applications</h3>
            <p className="text-sm font-medium text-red-600 max-w-sm mx-auto">{error}</p>
            <button
              onClick={fetchApplications}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && applications.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No active applications yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Explore verified Rajasthan opportunities across government PSUs, private tech, and overseas programs to submit your first application.
            </p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
            >
              <Search className="w-3.5 h-3.5" /> Browse Opportunities
            </Link>
          </div>
        )}

        {/* Applications List */}
        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const opp = app.opportunity
              const dateStr = app.applied_at || app.created_at
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently'

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={app.status} />
                      {opp?.sector && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {opp.sector.toUpperCase()}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Applied {formattedDate}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-950 truncate">
                        {opp?.title || 'Applied Opportunity'}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp?.organization || 'Registered Organization'}</span>
                        {opp?.location && <span>· {opp.location}</span>}
                      </p>
                    </div>

                    {app.cover_note && (
                      <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-1">
                        Note: &ldquo;{app.cover_note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    {app.match_score !== undefined && (
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase text-slate-400">Match Score</span>
                        <div className="text-xl font-extrabold text-emerald-600">{app.match_score}%</div>
                      </div>
                    )}

                    <Link
                      href={`/opportunities/${app.opportunity_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}
