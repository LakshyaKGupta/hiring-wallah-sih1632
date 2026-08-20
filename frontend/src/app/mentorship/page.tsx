'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  Award,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'

interface Mentor {
  id: string
  name: string
  title: string
  company: string
  alumni_institution?: string
  industry: string
  experience_years: number
  bio: string
  skills?: string[]
  contact_email?: string
  linkedin_url?: string
  is_verified?: boolean
  created_at: string
}

interface MentorshipRequest {
  id: string
  mentor_id: string
  user_uid?: string
  career_goals: string
  technical_interests?: string[]
  status: string
  created_at: string
  mentor?: Mentor
}

const INDUSTRIES = [
  'All Domains',
  'Software & Cloud',
  'Solar & Renewable Power',
  'Public Sector & Government',
  'Automotive & Robotics',
  'Semiconductors & IoT',
]

export default function MentorshipPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'mentors' | 'requests'>('mentors')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [requests, setRequests] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('All Domains')

  // Request Pairing Modal
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [careerGoals, setCareerGoals] = useState('')
  const [technicalInterests, setTechnicalInterests] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchMentors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (selectedIndustry !== 'All Domains') params.append('industry', selectedIndustry)
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const data = await apiFetch<Mentor[]>(`/mentorship/mentors${queryString}`)
      setMentors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mentors.')
    } finally {
      setLoading(false)
    }
  }, [selectedIndustry])

  const fetchMyRequests = useCallback(async () => {
    if (!auth.currentUser) return
    setRequestsLoading(true)
    try {
      const data = await apiFetch<MentorshipRequest[]>('/mentorship/my-requests', {}, auth.currentUser)
      setRequests(data)
    } catch {
      // Handled
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMentors()
    if (user) {
      void fetchMyRequests()
    }
  }, [user, fetchMentors, fetchMyRequests])

  const filteredMentors = mentors.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      (m.alumni_institution && m.alumni_institution.toLowerCase().includes(q)) ||
      (m.skills && m.skills.some((s) => s.toLowerCase().includes(q)))
    )
  })

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMentor || !careerGoals.trim()) return
    if (!auth.currentUser) {
      router.push('/auth?mode=signin&redirect=/mentorship')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const interestsArray = technicalInterests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await apiFetch<MentorshipRequest>(
        '/mentorship/request',
        {
          method: 'POST',
          body: JSON.stringify({
            mentor_id: selectedMentor.id,
            career_goals: careerGoals.trim(),
            technical_interests: interestsArray.length > 0 ? interestsArray : undefined,
          }),
        },
        auth.currentUser,
      )

      setSubmitSuccess(true)
      void fetchMyRequests()
      setTimeout(() => {
        setSelectedMentor(null)
        setSubmitSuccess(false)
        setCareerGoals('')
        setTechnicalInterests('')
        setActiveTab('requests')
      }, 1400)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Mentorship request failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WorkspaceShell
      role="candidate"
      activeId="mentorship"
      title="Alumni & Industry Mentorship"
      subtitle="Connect with engineering alumni from Rajasthan colleges and industry leaders"
      primaryActionLabel="Browse Mentors"
      onPrimaryAction={() => setActiveTab('mentors')}
      action={null}
      onCloseAction={() => undefined}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('mentors')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'mentors'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" /> Mentor Registry ({mentors.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'requests'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> My Mentorship Requests ({requests.length})
          </button>
        </div>

        {/* ── TAB 1: MENTORS DIRECTORY ── */}
        {activeTab === 'mentors' && (
          <div className="space-y-6">
            {/* Search & Domain Filter */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mentors by name, company, RTU Kota / MBM alumni, skills..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="w-full sm:w-60">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  aria-label="Filter by Domain"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="h-10 w-10 bg-slate-100 rounded-2xl" />
                    <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                    <div className="h-16 bg-slate-50 rounded-2xl" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredMentors.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No mentors match your filter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or selecting a different technical domain.
                </p>
                <button
                  onClick={() => {
                    setSearch('')
                    setSelectedIndustry('All Domains')
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {!loading && filteredMentors.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMentors.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Avatar + Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        {m.is_verified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified Alumnus
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">{m.name}</h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">{m.title}</p>
                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {m.company}
                        </p>
                      </div>

                      {/* Alumni Tag */}
                      {m.alumni_institution && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100">
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span className="truncate">{m.alumni_institution}</span>
                        </div>
                      )}

                      {/* Bio */}
                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                        {m.bio}
                      </p>

                      {/* Skills */}
                      {m.skills && m.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {m.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedMentor(m)}
                        className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-violet-900 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" /> Request Mentorship Pairing
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MY REQUESTS ── */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Active Mentorship Pairings</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review the progress of your mentorship applications.
              </p>
            </div>

            {requestsLoading && (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
                    <div className="h-5 w-40 bg-slate-100 rounded-full" />
                    <div className="h-6 w-2/3 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {!requestsLoading && requests.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No mentorship requests yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse verified alumni and industry mentors to request 1-on-1 career guidance.
                </p>
                <button
                  onClick={() => setActiveTab('mentors')}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Browse Mentors
                </button>
              </div>
            )}

            {!requestsLoading && requests.length > 0 && (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {req.status.toUpperCase()}
                        </span>
                        {req.mentor?.company && (
                          <span className="text-xs font-bold text-slate-500">
                            {req.mentor.name} ({req.mentor.company})
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        Goals: &ldquo;{req.career_goals}&rdquo;
                      </p>

                      {req.technical_interests && req.technical_interests.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-bold">Interests:</span>
                          {req.technical_interests.join(', ')}
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                      Request ID: {req.id.slice(0, 8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REQUEST PAIRING MODAL ── */}
      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">Request Mentorship Pairing</h3>
                  <p className="text-xs text-slate-500 font-medium">With {selectedMentor.name} ({selectedMentor.company})</p>
                </div>
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-extrabold text-slate-950">Request Submitted!</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Your request has been delivered to {selectedMentor.name}. You will receive a notification once accepted.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Career Goals & Aspirations
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={careerGoals}
                      onChange={(e) => setCareerGoals(e.target.value)}
                      placeholder="e.g. I am a 3rd year Electrical student aiming for Solar Microgrid and PLC SCADA automation roles..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Technical Interests (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={technicalInterests}
                      onChange={(e) => setTechnicalInterests(e.target.value)}
                      placeholder="e.g. Python, Docker, Solar Grid Inverters, Embedded C"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !careerGoals.trim()}
                      className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-violet-950 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit Pairing Request
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WorkspaceShell>
  )
}
