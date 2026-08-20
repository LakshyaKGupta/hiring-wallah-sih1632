'use client'

import React, { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  GraduationCap,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Loader2,
  FileText,
  ShieldCheck,
  Globe2,
  Compass,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import type { Opportunity } from '../page'

interface ApplicationRecord {
  id: string
  opportunity_id: string
  user_uid: string
  status: string
  created_at: string
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Application state
  const [hasApplied, setHasApplied] = useState(false)
  const [existingApp, setExistingApp] = useState<ApplicationRecord | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyNote, setApplyNote] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch opportunity details
      const opp = await apiFetch<Opportunity>(`/opportunities/${id}`)
      setOpportunity(opp)

      // 2. If user is signed in, check if they already applied
      if (auth.currentUser) {
        try {
          const myApps = await apiFetch<ApplicationRecord[]>('/opportunities/applications/me', {}, auth.currentUser)
          const matched = myApps.find((a) => a.opportunity_id === id)
          if (matched) {
            setHasApplied(true)
            setExistingApp(matched)
          }
        } catch {
          // Non-blocking if applications check fails
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunity.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) {
      router.push('/auth?mode=signin')
      return
    }

    setApplying(true)
    setApplyError('')
    try {
      const response = await apiFetch<ApplicationRecord>(
        `/opportunities/${id}/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            cover_note: applyNote.trim() || undefined,
          }),
        },
        auth.currentUser,
      )

      setHasApplied(true)
      setExistingApp(response)
      setApplySuccess(true)
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Application submission failed.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-6 animate-pulse">
            <div className="h-6 w-32 bg-slate-100 rounded-full" />
            <div className="h-10 w-3/4 bg-slate-200 rounded-2xl" />
            <div className="h-5 w-1/2 bg-slate-100 rounded-full" />
            <div className="h-40 bg-slate-50 rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-red-900">Unable to load opportunity</h2>
            <p className="text-sm font-medium text-red-600 max-w-sm mx-auto">{error}</p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              Browse other opportunities
            </Link>
          </div>
        )}

        {/* Detail Content */}
        {!loading && !error && opportunity && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Column: Details */}
            <div className="space-y-8">
              {/* Header card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                    {opportunity.sector.toUpperCase()}
                  </span>
                  {opportunity.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Department Verified
                    </span>
                  )}
                  {opportunity.department && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      🏛️ {opportunity.department}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-950 tracking-tight">
                    {opportunity.title}
                  </h1>
                  <p className="text-base font-bold text-slate-600 mt-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{opportunity.organization}</span>
                  </p>
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 truncate">{opportunity.location}</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3 h-3" /> Branch
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 truncate">{opportunity.branch || 'All Branches'}</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      💰 Compensation
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 truncate">
                      {opportunity.stipend_or_salary || 'As per norms'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Overview */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">About this Opportunity</h2>
                  <p className="text-sm font-medium text-slate-700 mt-3 leading-relaxed whitespace-pre-line">
                    {opportunity.description}
                  </p>
                </div>

                {/* Eligibility Criteria */}
                {opportunity.eligibility_criteria && (
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-violet-600" /> Eligibility Criteria
                    </h3>
                    <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 text-sm font-medium text-slate-800 leading-relaxed">
                      {opportunity.eligibility_criteria}
                    </div>
                  </div>
                )}

                {/* Required Skills */}
                {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-950 mb-3">Target Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.skills_required.map((skill) => (
                        <span
                          key={skill}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Link */}
                {opportunity.official_link && (
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Source / Notification:</span>
                    <a
                      href={opportunity.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:text-violet-800 font-bold inline-flex items-center gap-1"
                    >
                      <span>Official Portal</span> <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Application Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs sticky top-24 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-950">Application Status</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Submit your profile directly to {opportunity.organization}.
                  </p>
                </div>

                {/* Deadline reminder */}
                {opportunity.application_deadline && (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Application Closes: {opportunity.application_deadline}</span>
                  </div>
                )}

                {/* Case 1: Already Applied */}
                {hasApplied ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="text-sm font-extrabold text-emerald-950">Application Submitted</h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        Your application is recorded in the Rajasthan Technical Education registry.
                      </p>
                      {existingApp && (
                        <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] font-bold text-emerald-800">
                          Status: <span className="uppercase">{existingApp.status}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/applications"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> View My Applications
                    </Link>
                  </div>
                ) : !user ? (
                  /* Case 2: Not logged in */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                      Sign in with your student account to apply with your verified skills and resume.
                    </div>
                    <Link
                      href={`/auth?mode=signin&redirect=/opportunities/${id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold transition shadow-xs"
                    >
                      Sign in to Apply
                    </Link>
                  </div>
                ) : (
                  /* Case 3: Ready to apply */
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Statement of Interest / Note (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={applyNote}
                        onChange={(e) => setApplyNote(e.target.value)}
                        placeholder="Briefly state your technical background, projects, or why you are interested in this position..."
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition resize-none"
                      />
                    </div>

                    {applyError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{applyError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-950 hover:bg-violet-950 text-white text-sm font-bold transition shadow-xs disabled:opacity-50"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Application
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      🔒 Your registered profile & skills will be attached automatically.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
