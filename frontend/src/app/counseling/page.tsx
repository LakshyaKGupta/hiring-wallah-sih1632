'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  MessageSquare,
  Bot,
  User,
  Send,
  Calendar,
  Clock,
  Video,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Building2,
  X,
  FileText,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'

interface Counselor {
  id: string
  name: string
  title: string
  specialization: string
  organization: string
  experience_years: number
  bio: string
  contact_email: string
  rating: number
  available_slots?: string[]
  languages?: string[]
}

interface CounselingSession {
  id: string
  counselor_id: string
  user_uid?: string
  topic: string
  preferred_mode: string
  slot_time: string
  status: string
  notes?: string
  created_at: string
}

interface GuidanceResource {
  id: string
  title: string
  category: string
  department: string
  description: string
  content_url?: string
  tags?: string[]
  created_at: string
}

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actionable_steps?: string[]
  suggested_resources?: string[]
}

const SUGGESTED_PROMPTS = [
  'How do I transition from Polytechnic Diploma to B.Tech via LEET?',
  'What is the syllabus and strategy for RVUNL & RSSB JE exams?',
  'How can I get an AICTE-approved internship at Bhadla Solar or RISL?',
  'What are the eligibility requirements for Japan TITP overseas employment?',
]

export default function CounselingPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Tabs: 'copilot' | 'counselors' | 'sessions' | 'resources'
  const [activeTab, setActiveTab] = useState<'copilot' | 'counselors' | 'sessions' | 'resources'>('copilot')

  // Counselors
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [counselorsLoading, setCounselorsLoading] = useState(false)

  // My Sessions
  const [sessions, setSessions] = useState<CounselingSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Resources
  const [resources, setResources] = useState<GuidanceResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)

  // Booking Modal
  const [bookingCounselor, setBookingCounselor] = useState<Counselor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookingTopic, setBookingTopic] = useState('')
  const [bookingMode, setBookingMode] = useState<'online' | 'offline'>('online')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  // Copilot Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am your Rajasthan Technical Education Career Copilot. Ask me anything about polytechnic pathways, lateral entry (LEET), state government exams (RVUNL, RSSB), AICTE internships, or Japan TITP overseas programs.',
      actionable_steps: [
        'Ask about exam patterns for Rajasthan state engineering positions',
        'Explore 6-month industrial training options in solar and automation',
        'Review eligibility criteria for lateral degree admissions',
      ],
    },
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Fetch Counselors
  const fetchCounselors = useCallback(async () => {
    setCounselorsLoading(true)
    try {
      const data = await apiFetch<Counselor[]>('/counseling/counselors')
      setCounselors(data)
    } catch {
      // Handled
    } finally {
      setCounselorsLoading(false)
    }
  }, [])

  // Fetch Sessions
  const fetchSessions = useCallback(async () => {
    if (!auth.currentUser) return
    setSessionsLoading(true)
    try {
      const data = await apiFetch<CounselingSession[]>('/counseling/my-sessions', {}, auth.currentUser)
      setSessions(data)
    } catch {
      // Handled
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Fetch Resources
  const fetchResources = useCallback(async () => {
    setResourcesLoading(true)
    try {
      const data = await apiFetch<GuidanceResource[]>('/counseling/resources')
      setResources(data)
    } catch {
      // Handled
    } finally {
      setResourcesLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCounselors()
    void fetchResources()
    if (user) {
      void fetchSessions()
    }
  }, [user, fetchCounselors, fetchResources, fetchSessions])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  // Submit Copilot Query
  const handleSendQuery = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim()
    if (!text || chatLoading) return

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInputQuery('')
    setChatLoading(true)

    try {
      const response = await apiFetch<{
        answer: string
        actionable_steps: string[]
        suggested_resources: string[]
        suggested_counselors: string[]
      }>('/counseling/ai-copilot', {
        method: 'POST',
        body: JSON.stringify({
          query: text,
          student_branch: user?.displayName ? 'Computer Science / IT' : undefined,
          qualification: 'B.Tech / Diploma',
        }),
      })

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        actionable_steps: response.actionable_steps,
        suggested_resources: response.suggested_resources,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'I could not process your query right now. Please try asking again or reach out to a verified human counselor below.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setChatLoading(false)
    }
  }

  // Handle Counselor Booking
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingCounselor || !selectedSlot || !bookingTopic.trim()) return
    if (!auth.currentUser) {
      router.push('/auth?mode=signin&redirect=/counseling')
      return
    }

    setBookingLoading(true)
    setBookingError('')
    try {
      await apiFetch<CounselingSession>(
        '/counseling/book',
        {
          method: 'POST',
          body: JSON.stringify({
            counselor_id: bookingCounselor.id,
            slot_time: selectedSlot,
            topic: bookingTopic.trim(),
            preferred_mode: bookingMode,
            notes: bookingNotes.trim() || undefined,
          }),
        },
        auth.currentUser,
      )

      setBookingSuccess(true)
      void fetchSessions()
      setTimeout(() => {
        setBookingCounselor(null)
        setBookingSuccess(false)
        setSelectedSlot('')
        setBookingTopic('')
        setBookingNotes('')
        setActiveTab('sessions')
      }, 1500)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Please select another slot.')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <WorkspaceShell
      role="candidate"
      activeId="counseling"
      title="Career Guidance & Copilot"
      subtitle="AI advisory and 1-on-1 sessions with Rajasthan education mentors"
      primaryActionLabel="Ask AI Copilot"
      onPrimaryAction={() => setActiveTab('copilot')}
      action={null}
      onCloseAction={() => undefined}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'copilot'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bot className="w-4 h-4" /> AI Career Copilot
          </button>

          <button
            onClick={() => setActiveTab('counselors')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'counselors'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" /> Verified Counselors ({counselors.length})
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'sessions'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> My Booked Sessions ({sessions.length})
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'resources'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Guidance Handbooks ({resources.length})
          </button>
        </div>

        {/* ── TAB 1: AI CAREER COPILOT ── */}
        {activeTab === 'copilot' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Copilot Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
                    Rajasthan Technical Education Copilot
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Grounded in LEET pathways, state exams, AICTE rules, & overseas guidelines
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">
                AI Knowledge Engine
              </span>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-950 text-white font-semibold'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 space-y-3'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Actionable Steps checklist if present */}
                    {msg.actionable_steps && msg.actionable_steps.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
                          Recommended Action Steps
                        </div>
                        {msg.actionable_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      U
                    </div>
                  )}
                </motion.div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl px-4 py-2.5 text-xs font-medium flex items-center gap-2">
                    <span>Consulting Rajasthan Technical Education handbook...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Prompts */}
            <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Suggested:</span>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuery(prompt)}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-[11px] font-medium text-slate-700 hover:text-violet-900 whitespace-nowrap transition shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSendQuery()
              }}
              className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about polytechnic transition, RVUNL exams, Bhadla Solar internships, or TITP Japan..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputQuery.trim()}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-violet-950 text-white transition disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: VERIFIED COUNSELORS ── */}
        {activeTab === 'counselors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Department & Industry Counselors</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Book a free 1-on-1 video or in-person advisory session.
                </p>
              </div>
            </div>

            {counselorsLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                    <div className="h-16 bg-slate-50 rounded-2xl" />
                  </div>
                ))}
              </div>
            )}

            {!counselorsLoading && counselors.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {counselors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-700 flex items-center justify-center font-extrabold text-base">
                          {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          ★ {c.rating.toFixed(1)} Rating
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">{c.name}</h3>
                        <p className="text-xs font-bold text-slate-500">{c.title}</p>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" /> {c.organization}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                        <div className="font-bold text-slate-700">Specialization:</div>
                        <div className="text-slate-600 font-medium">{c.specialization}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">{c.experience_years} years experience</div>
                      </div>

                      {c.available_slots && c.available_slots.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1.5">Next Available Slots</div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.available_slots.slice(0, 2).map((slot, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100">
                                <Clock className="w-2.5 h-2.5 inline mr-1" />
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setBookingCounselor(c)
                          setSelectedSlot(c.available_slots?.[0] || 'Tomorrow, 3:00 PM')
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-violet-900 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book 1-on-1 Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: MY BOOKED SESSIONS ── */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">My Career Guidance Sessions</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your confirmed appointments with department advisors.
              </p>
            </div>

            {sessionsLoading && (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
                    <div className="h-5 w-40 bg-slate-100 rounded-full" />
                    <div className="h-6 w-2/3 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {!sessionsLoading && sessions.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No sessions booked yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select a verified counselor from the directory to schedule your personalized career consultation.
                </p>
                <button
                  onClick={() => setActiveTab('counselors')}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Browse Counselors
                </button>
              </div>
            )}

            {!sessionsLoading && sessions.length > 0 && (
              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sess.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          {sess.preferred_mode === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          {sess.preferred_mode === 'online' ? 'Google Meet Video Call' : 'Department In-Person'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-950">{sess.topic}</h3>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Scheduled: {sess.slot_time}</span>
                      </p>

                      {sess.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          Notes: {sess.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        Session ID: {sess.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: GUIDANCE RESOURCES ── */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Official Technical Handbooks & Roadmaps</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Curated by Technical Education Department, Government of Rajasthan.
              </p>
            </div>

            {resourcesLoading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
                    <div className="h-16 bg-slate-50 rounded-2xl" />
                  </div>
                ))}
              </div>
            )}

            {!resourcesLoading && (
              <div className="grid gap-5 sm:grid-cols-2">
                {resources.map((res) => (
                  <div key={res.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {res.category.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-950">{res.title}</h3>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{res.description}</p>
                      <p className="text-[11px] font-bold text-slate-400">Published by {res.department}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      {res.tags && (
                        <div className="flex gap-1">
                          {res.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] font-semibold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs font-bold text-violet-700 flex items-center gap-1 cursor-pointer hover:underline">
                        <FileText className="w-3.5 h-3.5" /> Read Handbook
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOOKING MODAL ── */}
      <AnimatePresence>
        {bookingCounselor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">Book 1-on-1 Counseling</h3>
                  <p className="text-xs text-slate-500 font-medium">With {bookingCounselor.name} ({bookingCounselor.title})</p>
                </div>
                <button
                  onClick={() => setBookingCounselor(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-extrabold text-slate-950">Session Confirmed!</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Your appointment has been registered in the department calendar. Check your email for video call details.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookSession} className="space-y-4">
                  {/* Select Slot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Time Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      required
                      aria-label="Select Time Slot"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      {bookingCounselor.available_slots && bookingCounselor.available_slots.length > 0 ? (
                        bookingCounselor.available_slots.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))
                      ) : (
                        <option value="Tomorrow, 3:00 PM">Tomorrow, 3:00 PM</option>
                      )}
                    </select>
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingMode('online')}
                        className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                          bookingMode === 'online'
                            ? 'bg-violet-50 border-violet-300 text-violet-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Video className="w-4 h-4" /> Online (Video Call)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingMode('offline')}
                        className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                          bookingMode === 'offline'
                            ? 'bg-violet-50 border-violet-300 text-violet-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-4 h-4" /> In-Person Campus
                      </button>
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Topic</label>
                    <input
                      type="text"
                      required
                      value={bookingTopic}
                      onChange={(e) => setBookingTopic(e.target.value)}
                      placeholder="e.g. Lateral Entry LEET guidance / RVUNL exam roadmap"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Specific Questions (Optional)</label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Mention your current branch, diploma percentage, or target companies..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 resize-none"
                    />
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingCounselor(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading || !bookingTopic.trim()}
                      className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-violet-950 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      Confirm Booking
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
