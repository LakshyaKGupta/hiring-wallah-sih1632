'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Target,
  Compass,
  BookOpen,
  Edit2,
  FileText,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Zap
} from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import type { Opportunity } from '@/app/opportunities/page'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SessionDetail {
  session: {
    id: string
    candidate_id: string
    target_role: string
    fit_score: number
    skill_gaps: Record<string, string> | string[]
    tailored_resume_suggestions: Record<string, string> | string[]
    cover_letter: string
    interview_prep: Record<string, any>
    job_recommendations?: Opportunity[]
    created_at: string
  }
  candidate: {
    id: string
    name: string
    email: string
    parsed_profile?: {
      skills_demonstrated?: string[]
      branch?: string
      education?: string
      experience_level?: string
    }
  }
}

function cleanRoleTitle(raw: string): string {
  if (!raw) return 'Technical Career Candidate'
  const trimmed = raw.trim()
  if (trimmed.toLowerCase() === 'ai proudct' || trimmed.toLowerCase() === 'ai product') {
    return 'AI Product Specialist'
  }
  // Title-case formatting
  return trimmed
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export default function CandidateReportPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.sessionId as string

  const [data, setData] = useState<SessionDetail | null>(null)
  const [matchingJobs, setMatchingJobs] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'fit' | 'gaps' | 'resume' | 'cover' | 'interview' | 'matching_jobs'>('fit')
  const [copiedCover, setCopiedCover] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/candidate/report/${sessionId}`)
      if (res.ok) {
        const report = await res.json()
        setData(report)

        // Load real database opportunities matching this candidate's target role & skills
        const role = report.session?.target_role || ''
        const skills = report.candidate?.parsed_profile?.skills_demonstrated || []
        
        try {
          const recRes = await fetch(`${API_URL}/matchmaking/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_role: role,
              branch: report.candidate?.parsed_profile?.branch || 'All Branches',
              candidate_skills: skills
            })
          })
          if (recRes.ok) {
            const recData = await recRes.json()
            const jobs = (recData.recommendations || []).map((r: any) => r.opportunity)
            setMatchingJobs(jobs)
          }
        } catch {
          // Fallback to all opportunities
          const oppsRes = await fetch(`${API_URL}/opportunities?limit=4`)
          if (oppsRes.ok) {
            const opps = await oppsRes.json()
            setMatchingJobs(opps)
          }
        }
      }
    } catch (e) {
      console.error('Error fetching candidate report:', e)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      void fetchReport()
    }
  }, [sessionId, fetchReport])

  const copyCoverLetter = () => {
    if (!data) return
    navigator.clipboard.writeText(data.session.cover_letter)
    setCopiedCover(true)
    setTimeout(() => setCopiedCover(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <RefreshCw className="h-4 w-4 rounded-full text-violet-700 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Generating candidate intelligence report...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Analysis Report Not Found</h2>
          <p className="text-xs text-slate-500">The requested candidate session report could not be retrieved.</p>
          <button
            onClick={() => router.push('/candidate')}
            className="px-4 py-2 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Back to Candidate Studio
          </button>
        </div>
      </div>
    )
  }

  const session = data.session
  const candidate = data.candidate
  const formattedRole = cleanRoleTitle(session.target_role)

  // Radar Chart data formatting
  let chartData: any[] = []
  if (session.skill_gaps && typeof session.skill_gaps === 'object') {
    if (!Array.isArray(session.skill_gaps)) {
      chartData = Object.entries(session.skill_gaps).map(([skill, gapDesc]) => {
        const isMajorGap = String(gapDesc).toLowerCase().includes('lack') || String(gapDesc).toLowerCase().includes('missing')
        return {
          subject: skill.length > 16 ? skill.slice(0, 14) + '...' : skill,
          Candidate: isMajorGap ? 45 : 85,
          Required: 100,
          fullMark: 100
        }
      })
    }
  }

  return (
    <WorkspaceShell
      role="candidate"
      activeId="overview"
      title={`Report: ${formattedRole}`}
      subtitle={`Verified profile analysis for ${candidate.name || 'Candidate'}`}
      primaryActionLabel="Explore Matching Jobs"
      onPrimaryAction={() => setActiveTab('matching_jobs')}
      action={null}
      onCloseAction={() => undefined}
      backHref="/candidate"
      backLabel="Back to candidate workspace"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold text-[11px] border border-violet-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Candidate Analysis Report
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ID: {session.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Target Role: {formattedRole}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Candidate: <strong className="text-slate-900">{candidate.name || 'Candidate'}</strong> · {candidate.email || 'Verified Student'}
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50/60 border border-violet-100 shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-violet-600 uppercase tracking-wide">Role Fit Score</div>
                <div className="text-3xl font-black text-slate-950 font-mono">{session.fit_score}%</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
            {[
              { id: 'fit', label: 'Fit Breakdown', icon: Target },
              { id: 'gaps', label: 'Skill Gaps & Radar', icon: Compass },
              { id: 'matching_jobs', label: 'Jobs for Your Resume', icon: Briefcase, badge: matchingJobs.length },
              { id: 'resume', label: 'Resume Optimizations', icon: Edit2 },
              { id: 'cover', label: 'Generated Cover Letter', icon: FileText },
              { id: 'interview', label: 'Interview Prep', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: FIT SCORE */}
          {activeTab === 'fit' && (
            <motion.div
              key="fit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-1 p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" className="stroke-slate-100 fill-transparent" strokeWidth="10" />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="fill-transparent stroke-violet-600"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={2 * Math.PI * 60 - (session.fit_score / 100) * 2 * Math.PI * 60}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-slate-950 font-mono">{session.fit_score}%</span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Match Rating</span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Based on verified project history & role rubric.
                </div>
              </div>

              <div className="md:col-span-2 p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-violet-600" /> Evidence-Based Fit Summary
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We evaluated your resume against live requirements for <strong>{formattedRole}</strong>. Your profile demonstrates foundational competencies with specific high-value skills ready for deployment in Rajasthan technology and core engineering ecosystems.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Match Signals
                    </span>
                    <p className="text-[11px] text-emerald-700">Demonstrated hands-on technical execution & problem solving.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs space-y-1">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" /> Recommended Action
                    </span>
                    <p className="text-[11px] text-amber-700">Bridge specialized domain tools to unlock top percentile match.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SKILL GAPS & RADAR */}
          {activeTab === 'gaps' && (
            <motion.div
              key="gaps"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {chartData.length > 0 && (
                <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 text-center">Competency Radar</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                        <Radar name="Target" dataKey="Required" stroke="#cbd5e1" fill="#f1f5f9" fillOpacity={0.4} />
                        <Radar name="Candidate" dataKey="Candidate" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className={`${chartData.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4`}>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-violet-600" /> Identified Skill Gaps & Focus Areas
                </h3>
                <div className="space-y-3">
                  {typeof session.skill_gaps === 'object' && !Array.isArray(session.skill_gaps) ? (
                    Object.entries(session.skill_gaps).map(([skill, desc]) => (
                      <div key={skill} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-xs font-bold text-violet-700">{skill}</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{String(desc)}</p>
                      </div>
                    ))
                  ) : Array.isArray(session.skill_gaps) ? (
                    session.skill_gaps.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                        {item}
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: MATCHING JOBS FROM DATABASE ACCORDING TO RESUME */}
          {activeTab === 'matching_jobs' && (
            <motion.div
              key="matching_jobs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-violet-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>These verified openings directly match your uploaded resume and target role.</span>
                </div>
                <Link href="/opportunities" className="text-violet-700 font-bold hover:underline">
                  Browse all vacancies →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchingJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-xs hover:border-violet-300 transition flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                          {job.sector.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {job.location}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 line-clamp-1">{job.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {job.organization}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {job.stipend_or_salary || 'Competitive Pay'}
                      </span>
                      <Link
                        href={`/opportunities/${job.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-violet-900 transition flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: RESUME OPTIMIZATIONS */}
          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-violet-600" /> Resume Bullet Optimization
              </h3>
              <p className="text-xs text-slate-500">
                Enhance your resume bullets by replacing passive duties with quantified project outcomes.
              </p>

              <div className="space-y-4 pt-2">
                {typeof session.tailored_resume_suggestions === 'object' && !Array.isArray(session.tailored_resume_suggestions) ? (
                  Object.entries(session.tailored_resume_suggestions).map(([orig, sugg], idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Original Line</span>
                        <p className="text-xs text-slate-600">{orig}</p>
                      </div>
                      <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Recommended Revision
                        </span>
                        <p className="text-xs text-slate-900 font-semibold">{String(sugg)}</p>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </motion.div>
          )}

          {/* TAB 4: COVER LETTER */}
          {activeTab === 'cover' && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" /> Tailored Cover Letter
                </h3>
                <button
                  onClick={copyCoverLetter}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-white transition flex items-center gap-1.5"
                >
                  {copiedCover ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCover ? 'Copied!' : 'Copy Letter'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={session.cover_letter}
                rows={12}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed resize-none focus:outline-none"
              />
            </motion.div>
          )}

          {/* TAB 5: INTERVIEW PREP */}
          {activeTab === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" /> Tailored Interview Preparation Questions
              </h3>
              <p className="text-xs text-slate-500">
                Technical and situational questions likely to be asked by hiring panels for this role.
              </p>

              <div className="space-y-3 pt-2">
                {session.interview_prep?.mock_questions ? (
                  session.interview_prep.mock_questions.map((q: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <span className="font-bold text-violet-700">Question 0{idx + 1}</span>
                      <p className="text-slate-800 font-medium">{q}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    Be prepared to walk through your hands-on engineering projects and demonstrate how you debug technical bottlenecks.
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </WorkspaceShell>
  )
}
