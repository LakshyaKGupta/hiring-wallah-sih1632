'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { Loader2, BriefcaseBusiness, AlertCircle, Target, CheckCircle2, Star } from 'lucide-react'

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) return
    
    fetch(`${API_URL}/candidate/public/${username}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Profile not found' : 'Failed to load profile')
        }
        return res.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [username])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Profile Not Found</h1>
        <p className="text-slate-500 mt-2">{error || "This candidate hasn't published their profile yet."}</p>
      </div>
    )
  }

  const { user, session } = data

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-white">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-950">Hiring Wallah</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          {user.photo_url ? (
            <img src={user.photo_url} alt={user.display_name} className="h-32 w-32 rounded-3xl object-cover shadow-sm border border-slate-200" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-200 text-4xl font-bold text-slate-600 shadow-sm">
              {user.display_name?.charAt(0) || 'C'}
            </div>
          )}
          
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tight text-slate-950">{user.display_name}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <Target className="h-4 w-4" /> Target Role: {session.target_role}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Star className="h-4 w-4" /> Fit Score: {session.fit_score}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skill Gaps */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Current Skill Gaps
            </h2>
            <ul className="mt-6 space-y-4">
              {session.skill_gaps?.map((gap: any, i: number) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{gap.missing_skill || gap.skill}</h4>
                    <p className="mt-1 text-sm text-slate-600">{gap.impact}</p>
                  </div>
                </li>
              ))}
              {(!session.skill_gaps || session.skill_gaps.length === 0) && (
                <li className="text-slate-500 text-sm">No major skill gaps identified!</li>
              )}
            </ul>
          </section>

          {/* Action Plan */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Action Plan
            </h2>
            <ul className="mt-6 space-y-4">
              {session.skill_gaps?.slice(0, 3).map((gap: any, i: number) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{gap.actionable_step || 'Recommended action'}</h4>
                  </div>
                </li>
              ))}
              {(!session.skill_gaps || session.skill_gaps.length === 0) && (
                <li className="text-slate-500 text-sm">Candidate is highly qualified for this role.</li>
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
