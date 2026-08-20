'use client'

import React, { useState, useEffect } from 'react'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { getAuth } from 'firebase/auth'

export default function RecruiterSettingsPage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      try {
        const auth = getAuth()
        const fbUser = auth.currentUser
        if (!fbUser) return
        const profile = await apiFetch<any>('/auth/profile', {}, fbUser)
        setDisplayName(profile.display_name || user.displayName || '')
        setCompanyName(profile.company_name || '')
      } catch (err) {
        console.error('Failed to load profile details', err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const auth = getAuth()
      const fbUser = auth.currentUser
      if (!fbUser) throw new Error('Not authenticated')
      
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: displayName,
          company_name: companyName,
        })
      }, fbUser)
      
      setMessage({ type: 'success', text: 'Settings updated successfully.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkspaceShell role="recruiter" activeId="settings" title="Settings" subtitle="Recruiter workspace settings" primaryActionLabel="Jobs" onPrimaryAction={() => { window.location.href = '/recruiter/jobs' }} action={null} onCloseAction={() => undefined}>
      <div className="mx-auto max-w-2xl mt-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-950 mb-6">Profile Settings</h2>
          
          {initialLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </WorkspaceShell>
  )
}
