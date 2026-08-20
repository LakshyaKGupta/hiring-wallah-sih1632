'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Briefcase,
  MapPin,
  GraduationCap,
  Calendar,
  Building2,
  Globe2,
  Compass,
  CheckCircle2,
  ArrowRight,
  Filter,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Award,
  Zap,
} from 'lucide-react'
import { apiFetch, API_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'

export interface Opportunity {
  id: string
  title: string
  organization: string
  sector: string
  opportunity_type?: string
  department?: string
  location: string
  stipend_or_salary?: string
  experience_level?: string
  qualification_required?: string
  branch?: string
  skills_required?: string[]
  eligibility_criteria?: string
  application_deadline?: string
  official_link?: string
  source?: string
  description: string
  is_verified?: boolean
  created_at: string
}

const SECTOR_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }> = {
  all: { label: 'All Sectors', icon: Sparkles, color: 'text-slate-900 bg-slate-100 border-slate-200', badge: 'All Opportunities' },
  private_job: { label: 'Private Tech', icon: Building2, color: 'text-violet-700 bg-violet-50 border-violet-200', badge: 'Private Sector' },
  govt_job: { label: 'Govt & PSUs', icon: GraduationCap, color: 'text-blue-700 bg-blue-50 border-blue-200', badge: 'Official Vacancy' },
  overseas: { label: 'Overseas (TITP)', icon: Globe2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: 'International' },
  internship: { label: 'Internships', icon: Compass, color: 'text-amber-700 bg-amber-50 border-amber-200', badge: 'AICTE Certified' },
  industrial_training: { label: 'Industrial Training', icon: Briefcase, color: 'text-teal-700 bg-teal-50 border-teal-200', badge: 'Practical Training' },
}

const BRANCHES = [
  'All Branches',
  'Computer Science / IT',
  'Electrical',
  'Mechanical',
  'Civil',
  'Power Systems',
  'Robotics / Mechatronics',
]

const LOCATIONS = [
  'All Locations',
  'Jaipur',
  'Jodhpur',
  'Kota',
  'Bhadla',
  'Udaipur',
  'Tokyo & Nagoya',
  'Remote',
]

export default function OpportunitiesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [candidateSkills, setCandidateSkills] = useState<string[]>([])
  const [candidateBranch, setCandidateBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('All Branches')
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [matchOnly, setMatchOnly] = useState(false)

  // Load candidate's resume skills if available
  useEffect(() => {
    const loadCandidateContext = async () => {
      const lastSessionId = typeof window !== 'undefined' ? localStorage.getItem('hw_last_session_id') : null
      if (lastSessionId) {
        try {
          const session = await apiFetch<any>(`/candidate/session/${lastSessionId}`, {}, auth.currentUser)
          if (session?.verified_claims && Array.isArray(session.verified_claims)) {
            setCandidateSkills(session.verified_claims)
          }
          if (session?.candidate?.parsed_profile?.branch) {
            setCandidateBranch(session.candidate.parsed_profile.branch)
          }
        } catch {
          // Non-blocking
        }
      }
    }
    if (user?.role === 'candidate') {
      void loadCandidateContext()
    }
  }, [user])

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (selectedSector !== 'all') params.append('sector', selectedSector)
      if (selectedBranch !== 'All Branches') params.append('branch', selectedBranch)
      if (selectedLocation !== 'All Locations') params.append('location', selectedLocation)
      if (search.trim()) params.append('search', search.trim())

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const data = await apiFetch<Opportunity[]>(`/opportunities${queryString}`)
      setOpportunities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities.')
    } finally {
      setLoading(false)
    }
  }, [selectedSector, selectedBranch, selectedLocation, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOpportunities()
    }, 200)
    return () => clearTimeout(timer)
  }, [fetchOpportunities])

  const resetFilters = () => {
    setSearch('')
    setSelectedSector('all')
    setSelectedBranch('All Branches')
    setSelectedLocation('All Locations')
    setMatchOnly(false)
  }

  // Calculate resume match for each opportunity
  const calculateMatch = (opp: Opportunity) => {
    const reqSkills = opp.skills_required || []
    if (reqSkills.length === 0 || candidateSkills.length === 0) {
      return { score: 75, matching: [] }
    }
    const matching = reqSkills.filter(req => 
      candidateSkills.some(cand => cand.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(cand.toLowerCase()))
    )
    const ratio = matching.length / reqSkills.length
    const score = Math.round(ratio * 40 + 50)
    return { score: Math.min(score, 98), matching }
  }

  const displayedOpportunities = opportunities.filter(opp => {
    if (!matchOnly || candidateSkills.length === 0) return true
    const { matching } = calculateMatch(opp)
    return matching.length > 0
  })

  const content = (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Rajasthan Multi-Sector Opportunity Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-950">
          Explore Verified Careers & Internships
        </h1>
        <p className="text-slate-500 font-medium text-sm sm:text-base max-w-2xl">
          Find jobs, internships, government vacancies, industrial training and overseas programs matched to your technical profile.
        </p>
      </div>

      {/* Candidate Resume Grounding Bar */}
      {candidateSkills.length > 0 && (
        <div className="p-4 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Resume Skills Grounding Active ({candidateSkills.length} Verified Skills)
              </span>
              <span className="text-slate-500 text-[11px]">
                Showing real database opportunities matching your parsed competencies.
              </span>
            </div>
          </div>
          <button
            onClick={() => setMatchOnly(!matchOnly)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              matchOnly
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white border border-violet-200 text-violet-700 hover:bg-violet-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{matchOnly ? 'Showing Resume Matches Only' : 'Filter by Resume Fit'}</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, skills, organization (e.g. RVUNL, Python, Solar)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Branch dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Filter by Branch"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Location dropdown */}
          <div className="w-full md:w-52">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              aria-label="Filter by Location"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sector Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {Object.entries(SECTOR_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            const active = selectedSector === key
            return (
              <button
                key={key}
                onClick={() => setSelectedSector(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900 font-extrabold">{displayedOpportunities.length}</span> opportunities
        </p>
        {(search || selectedSector !== 'all' || selectedBranch !== 'All Branches' || selectedLocation !== 'All Locations' || matchOnly) && (
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-violet-700 hover:text-violet-900"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 h-64" />
          ))}
        </div>
      ) : displayedOpportunities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No opportunities found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or clearing active filters to see all available vacancies.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Opportunity Cards Grid */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedOpportunities.map((opp) => {
            const sectorInfo = SECTOR_CONFIG[opp.sector] || SECTOR_CONFIG.all
            const { score, matching } = calculateMatch(opp)
            return (
              <div
                key={opp.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sectorInfo.color}`}>
                      {sectorInfo.badge}
                    </span>
                    {candidateSkills.length > 0 && matching.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {score}% Resume Fit
                      </span>
                    )}
                  </div>

                  {/* Title & Org */}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950 group-hover:text-violet-950 transition-colors line-clamp-1">
                      {opp.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{opp.organization}</span>
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-400" /> {opp.location}
                    </span>
                    {opp.stipend_or_salary && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-100">
                        {opp.stipend_or_salary}
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Skills tags */}
                  {opp.skills_required && opp.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {opp.skills_required.slice(0, 3).map((skill) => {
                        const isMatched = matching.includes(skill)
                        return (
                          <span
                            key={skill}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}
                          >
                            {isMatched ? `✓ ${skill}` : skill}
                          </span>
                        )
                      })}
                      {opp.skills_required.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5">
                          +{opp.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {opp.application_deadline ? `Deadline: ${opp.application_deadline}` : 'Open Enrollment'}
                  </div>
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-violet-900 transition-all shadow-xs"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (user?.role === 'candidate') {
    return (
      <WorkspaceShell
        role="candidate"
        activeId="opportunities"
        title="Opportunities Hub"
        subtitle="Explore verified multi-sector technical vacancies in Rajasthan"
        primaryActionLabel="My Applications"
        onPrimaryAction={() => router.push('/applications')}
        action={null}
        onCloseAction={() => undefined}
        backHref="/candidate"
        backLabel="Back to candidate workspace"
      >
        {content}
      </WorkspaceShell>
    )
  }

  if (user?.role === 'recruiter') {
    return (
      <WorkspaceShell
        role="recruiter"
        activeId="jobs"
        title="Opportunities Hub"
        subtitle="Statewide technical vacancies and placements"
        primaryActionLabel="Create New Job"
        onPrimaryAction={() => router.push('/recruiter/jobs/new')}
        action={null}
        onCloseAction={() => undefined}
        backHref="/recruiter"
        backLabel="Back to recruiter workspace"
      >
        {content}
      </WorkspaceShell>
    )
  }

  // Public visitor view
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {content}
      </main>
    </div>
  )
}
