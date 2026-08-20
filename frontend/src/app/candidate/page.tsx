'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Briefcase,
  Building2,
  FileText,
  Loader2,
  Sparkles,
  Target,
  UploadCloud,
  Settings,
  Save,
  Scan,
  ArrowRight,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  RefreshCw,
  ArrowUpRight,
  GraduationCap,
  MapPin,
  Compass,
  Users,
  Clock,
  BookOpen,
} from 'lucide-react'
import { API_URL, apiFetch } from '@/lib/api'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import type { Opportunity } from '@/app/opportunities/page'

/* ─── Types ──────────────────────────────────────────────────────────────── */
type AnalysisReport = {
  session: {
    id: string
    target_role: string
    created_at?: string
  }
  resume_score?: number
  match_strength?: number
  estimated_improvement?: number
  pending_actions?: number
  top_role?: string
  next_best_action?: string
  verified_claims?: string[]
  missing_keywords?: string[]
  skill_gaps?: string[]
  strengths?: string[]
  interview_questions?: string[]
}

interface RecommendedItem {
  opportunity: Opportunity
  fit_score: number
  verdict: string
  matching_skills: string[]
  missing_skills: string[]
  explainable_summary: string
}

interface ApplicationSummary {
  id: string
  opportunity_id: string
  status: string
  created_at: string
  opportunity?: Opportunity
}

interface SkillGapRoadmap {
  target_role: string
  technical_domain: string
  match_percentage: number
  skills_possessed: string[]
  skills_missing: string[]
  next_best_action?: string
  unlocked_opportunities_count?: number
  opportunity_unlock_impact?: string
  learning_milestones: Array<{
    milestone: number
    phase: string
    timeframe: string
    objective: string
    recommended_course: string
    practical_lab: string
  }>
}

function cleanRoleTitle(raw?: string): string {
  if (!raw) return 'Technical Career Candidate'
  const trimmed = raw.trim()
  if (trimmed.toLowerCase() === 'ai proudct' || trimmed.toLowerCase() === 'ai product') {
    return 'AI Product Specialist'
  }
  return trimmed
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function CandidateDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, profileLoading } = useAuth()

  const tabParam = searchParams.get('tab')
  const [activeView, setActiveView] = useState(tabParam || 'overview')
  const [targetRole, setTargetRole] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('Computer Science / IT')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [toast, setToast] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Real Data States
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [appLoading, setAppLoading] = useState(false)
  const [skillGapData, setSkillGapData] = useState<SkillGapRoadmap | null>(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)

  // Profile Form in Settings
  const [settingsName, setSettingsName] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)

  useEffect(() => {
    if (tabParam) setActiveView(tabParam)
  }, [tabParam])

  useEffect(() => {
    if (user?.displayName) setSettingsName(user.displayName)
  }, [user])

  useEffect(() => {
    if (loading || profileLoading) return
    if (!user) router.replace('/auth?mode=signin')
    else if (!user.role) router.replace('/auth')
    else if (user.role !== 'candidate') router.replace(`/${user.role}`)
  }, [user, loading, profileLoading, router])

  // Load last session from localStorage
  const loadLastSession = useCallback(async () => {
    const lastSessionId = localStorage.getItem('hw_last_session_id')
    if (!lastSessionId) return
    setReportLoading(true)
    try {
      const data = await apiFetch<AnalysisReport>(`/candidate/session/${lastSessionId}`, {}, auth.currentUser)
      setReport(data)
      if (data.session?.target_role) {
        setTargetRole(data.session.target_role)
      }
    } catch {
      localStorage.removeItem('hw_last_session_id')
    } finally {
      setReportLoading(false)
    }
  }, [])

  // Load Recommendations
  const loadRecommendations = useCallback(async () => {
    setRecLoading(true)
    try {
      const skills = report?.verified_claims && report.verified_claims.length > 0 
        ? report.verified_claims 
        : []
      const res = await apiFetch<{ recommendations: RecommendedItem[] }>('/matchmaking/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          target_role: targetRole || report?.session?.target_role || 'Engineering Candidate',
          branch: selectedBranch,
          qualification: 'B.Tech / Diploma',
          candidate_skills: skills,
        }),
      })
      setRecommendations(res.recommendations || [])
    } catch {
      // Non-blocking
    } finally {
      setRecLoading(false)
    }
  }, [targetRole, selectedBranch, report])

  // Load Applications
  const loadApplications = useCallback(async () => {
    if (!auth.currentUser) return
    setAppLoading(true)
    try {
      const myApps = await apiFetch<ApplicationSummary[]>('/opportunities/applications/me', {}, auth.currentUser)
      setApplications(myApps)
    } catch {
      // Non-blocking
    } finally {
      setAppLoading(false)
    }
  }, [])

  // Load Skill Gap Analysis
  const loadSkillGap = useCallback(async () => {
    setSkillGapLoading(true)
    try {
      const skills = report?.verified_claims && report.verified_claims.length > 0
        ? report.verified_claims
        : []
      const data = await apiFetch<SkillGapRoadmap>('/matchmaking/skill-gap-analysis', {
        method: 'POST',
        body: JSON.stringify({
          target_role: targetRole || report?.session?.target_role || 'Engineering Candidate',
          current_skills: skills,
        }),
      })
      setSkillGapData(data)
    } catch {
      // Non-blocking
    } finally {
      setSkillGapLoading(false)
    }
  }, [targetRole, report])

  useEffect(() => {
    if (user?.role === 'candidate') {
      void loadLastSession()
      void loadApplications()
    }
  }, [user, loadLastSession, loadApplications])

  useEffect(() => {
    if (user?.role === 'candidate') {
      void loadRecommendations()
      void loadSkillGap()
    }
  }, [user, loadRecommendations, loadSkillGap])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  // Profile Completeness Calculation
  const hasName = Boolean(user?.displayName && user.displayName.trim())
  const hasResume = Boolean(report)
  const hasTargetRole = Boolean(targetRole && targetRole.trim())
  const hasBranch = Boolean(selectedBranch)
  const hasApplied = applications.length > 0

  const completeness = [
    hasName ? 20 : 0,
    hasResume ? 25 : 0,
    hasTargetRole ? 20 : 0,
    hasBranch ? 20 : 0,
    hasApplied ? 15 : 0,
  ].reduce((a, b) => a + b, 0)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      if (auth.currentUser) {
        await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ display_name: settingsName.trim() }),
        }, auth.currentUser)
      }
      showToast('Profile updated successfully.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const acceptFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF resumes are supported.')
      return
    }
    setResumeFile(file)
    setErrorMsg('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) acceptFile(file)
  }

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile || !targetRole.trim()) return
    setIsRunning(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('target_role', targetRole.trim())
      formData.append('resume', resumeFile)
      const res = await fetch(`${API_URL}/candidate/analyze`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Resume analysis failed.')
      }
      const data = await res.json()
      localStorage.setItem('hw_last_session_id', data.session.id)
      router.push(`/candidate/report/${data.session.id}`)
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Could not connect to the analysis backend.')
      setIsRunning(false)
    }
  }

  if (loading || profileLoading || !user || !user.role) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-4 w-4 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Opening candidate workspace…</span>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceShell
      role="candidate"
      activeId={activeView}
      title="Candidate Dashboard"
      subtitle={report?.session?.target_role ? `Active Target: ${cleanRoleTitle(report.session.target_role)}` : 'Technical career OS & opportunity hub'}
      primaryActionLabel="Explore Opportunities"
      onPrimaryAction={() => router.push('/opportunities')}
      toast={toast}
      action={null}
      onCloseAction={() => undefined}
      onNavSelect={(id) => setActiveView(id)}
    >
      {/* ── OVERVIEW / HOME ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.section key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 mt-2">
            {/* Greeting & Profile Completeness */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-950">
                    Welcome back, {user.displayName || 'Candidate'}
                  </h1>
                  <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                    Your Rajasthan technical education and career profile is <span className="font-bold text-slate-900">{completeness}% complete</span>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-violet-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-900">{completeness}%</span>
                </div>
              </div>

              {/* Actionable Checklist */}
              {completeness < 100 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setActiveView('resume')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
                      hasResume ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasResume ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className="truncate font-semibold">{hasResume ? 'Resume Verified' : '+ Upload Resume'}</span>
                  </button>

                  <button
                    onClick={() => setActiveView('resume')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
                      hasTargetRole ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasTargetRole ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className="truncate font-semibold">{hasTargetRole ? cleanRoleTitle(targetRole) : '+ Set Target Role'}</span>
                  </button>

                  <button
                    onClick={() => router.push('/opportunities')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
                      hasApplied ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasApplied ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className="truncate font-semibold">{hasApplied ? `${applications.length} Applied` : '+ Apply to 1st Job'}</span>
                  </button>

                  <button
                    onClick={() => router.push('/counseling')}
                    className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-600 hover:bg-white text-left transition flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-violet-600 shrink-0" />
                    <span className="truncate font-semibold">Career Guidance</span>
                  </button>
                </div>
              )}
            </div>

            {/* Next Best Action Card (SIH1632 Dynamic Recommendation) */}
            {skillGapData?.next_best_action && (
              <div className="p-6 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Next Best Action
                    </span>
                    {skillGapData.unlocked_opportunities_count ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                        +{skillGapData.unlocked_opportunities_count} Opportunities Unlocked
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-slate-950">
                    {skillGapData.next_best_action}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {skillGapData.opportunity_unlock_impact || 'Bridge your technical missing skills with verified Rajasthan curriculum courses.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveView('skillgap')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> View Skill Roadmap
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Verified Fit Score</div>
                  <div className="text-2xl font-black text-slate-950">
                    {report?.match_strength ? `${report.match_strength}%` : '85%'}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Applications Submitted</div>
                  <div className="text-2xl font-black text-slate-950">{applications.length}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Recommended Matches</div>
                  <div className="text-2xl font-black text-slate-950">{recommendations.length}</div>
                </div>
              </div>
            </div>

            {/* Recommended Opportunities for You */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" /> Recommended For Your Profile
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Live matches computed from your skills and qualification.
                  </p>
                </div>
                <Link
                  href="/opportunities"
                  className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 h-36" />
                  <div className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 h-36" />
                </div>
              )}

              {!recLoading && recommendations.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendations.slice(0, 4).map((rec) => (
                    <div
                      key={rec.opportunity.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            {rec.opportunity.sector.toUpperCase()}
                          </span>
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {rec.fit_score}% Match
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-950 line-clamp-1">{rec.opportunity.title}</h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {rec.opportunity.organization} · {rec.opportunity.location}
                        </p>

                        <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                          {rec.explainable_summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex gap-1">
                          {rec.matching_skills.slice(0, 2).map((s) => (
                            <span key={s} className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/opportunities/${rec.opportunity.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-violet-900 transition"
                        >
                          View & Apply
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Applications Section */}
            {applications.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-950">Active Applications</h3>
                  <Link href="/applications" className="text-xs font-bold text-violet-700 hover:underline">
                    View All ({applications.length})
                  </Link>
                </div>

                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">
                          {app.opportunity?.title || 'Applied Position'}
                        </div>
                        <div className="text-slate-500 font-medium truncate mt-0.5">
                          {app.opportunity?.organization || 'Organization'}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ── RESUME ANALYSIS TAB ────────────────────────────────────────── */}
        {activeView === 'resume' && (
          <motion.section key="resume" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 mt-2">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Upload & Analyze Resume</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Our AI engine extracts verified claims, identifies missing keywords, and evaluates fit for your target role.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <form onSubmit={handleRunAnalysis} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Role or Opportunity</label>
                  <input
                    type="text"
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Electrical Engineer, Python Backend Developer, Solar PV Engineer"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload PDF Resume</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed text-center transition cursor-pointer ${
                      isDragging ? 'border-violet-500 bg-violet-50' : resumeFile ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <label className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400">
                        <UploadCloud className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">
                          {resumeFile ? resumeFile.name : 'Click to browse or drop PDF here'}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">PDF format · Max 10MB</span>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRunning || !resumeFile || !targetRole.trim()}
                  className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-violet-950 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                  {isRunning ? 'Analyzing with Multi-Agent Pipeline...' : 'Run Evidence Analysis'}
                </button>
              </form>

              {/* Profile Summary Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" /> Evidence Audit Summary
                </h3>

                {!report ? (
                  <div className="py-16 text-center space-y-3">
                    <Scan className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">Awaiting Resume Analysis</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Upload your resume to extract claims, identify missing keywords, and get tailored interview questions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {report.verified_claims && report.verified_claims.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                        <div className="font-bold text-emerald-900 uppercase text-[10px]">Verified Skills & Claims</div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.verified_claims.map((claim, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-semibold">
                              ✓ {claim}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.missing_keywords && report.missing_keywords.length > 0 && (
                      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                        <div className="font-bold text-rose-900 uppercase text-[10px]">Missing Industry Keywords</div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.missing_keywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-semibold">
                              ✗ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/candidate/report/${report.session.id}`}
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-center block transition"
                    >
                      View Full Analysis Dossier →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── SKILL GAP & ROADMAP TAB ────────────────────────────────────── */}
        {activeView === 'improvement' && (
          <motion.section key="improvement" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 mt-2">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Skill-Gap Analysis & Learning Roadmap</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Target Role: <span className="font-bold text-slate-900">{targetRole || 'Software / Electrical Engineering'}</span>
              </p>
            </div>

            {skillGapLoading && (
              <div className="animate-pulse bg-white rounded-3xl border border-slate-200 p-8 h-64" />
            )}

            {!skillGapLoading && skillGapData && (
              <div className="space-y-6">
                {/* Benchmark score card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <div className="text-xs font-bold uppercase text-violet-700 bg-violet-50 px-3 py-1 rounded-full inline-block border border-violet-200 mb-2">
                      {skillGapData.technical_domain}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-950">
                      Curated Bridge Curriculum
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Based on AICTE credit standards and NPTEL / SWAYAM Rajasthan portal courses.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-violet-700">{skillGapData.match_percentage}%</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Current Readiness</div>
                  </div>
                </div>

                {/* Missing Skills Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Skills You Possess
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapData.skills_possessed.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" /> Missing Benchmark Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapData.skills_missing.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step-by-step Milestones */}
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-slate-950">Recommended Learning Milestones</h3>
                  <div className="space-y-3">
                    {skillGapData.learning_milestones.map((m) => (
                      <div
                        key={m.milestone}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black">
                              {m.milestone}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{m.phase}</span>
                            <span className="text-[11px] font-semibold text-slate-400">({m.timeframe})</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-950">{m.objective}</h4>
                          <p className="text-xs text-slate-600 font-medium">Course: {m.recommended_course}</p>
                          <p className="text-xs text-violet-700 font-semibold bg-violet-50 p-2 rounded-xl border border-violet-100">
                            Practical Lab: {m.practical_lab}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ── SETTINGS TAB ───────────────────────────────────────────────── */}
        {activeView === 'settings' && (
          <motion.section key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 mt-2 max-w-2xl">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Profile & Preferences</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update your registered technical branch and target aspirations.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Technical Engineering Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                >
                  <option value="Computer Science / IT">Computer Science & Information Technology</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Power Systems">Power Systems & Renewable Energy</option>
                  <option value="Robotics / Mechatronics">Robotics & Mechatronics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Settings
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </WorkspaceShell>
  )
}

export default function CandidatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
        </div>
      }
    >
      <CandidateDashboardContent />
    </Suspense>
  )
}
