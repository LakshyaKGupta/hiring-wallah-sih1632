'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import { Briefcase, MapPin, Clock, FileText, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

type Job = { id: string }

const DESCRIPTION_MIN = 40

export default function NewJobPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    experience_range: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const descLen = form.description.length
  const descReady = descLen >= DESCRIPTION_MIN

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!descReady) {
      setError(`Job description must be at least ${DESCRIPTION_MIN} characters.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const job = await apiFetch<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify(form),
      }, auth.currentUser)
      router.push(`/recruiter/jobs/${job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create job.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="jobs"
      title="Create Job"
      subtitle="New job posting"
      primaryActionLabel="All jobs"
      onPrimaryAction={() => router.push('/recruiter/jobs')}
      action={null}
      onCloseAction={() => undefined}
      backHref="/recruiter/jobs"
      backLabel="Back to jobs"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Create Job</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Fill in the job details. AI rubric generation will run automatically after creation.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
        >
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Title */}
          <Field
            label="Job Title"
            required
            icon={Briefcase}
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="e.g. Senior Backend Engineer, AI Product Manager"
          />

          {/* Company */}
          <Field
            label="Company Name"
            required
            icon={Briefcase}
            value={form.company}
            onChange={(v) => setForm({ ...form, company: v })}
            placeholder="Your company name"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Location */}
            <Field
              label="Location"
              icon={MapPin}
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="e.g. Mumbai, Remote"
            />

            {/* Experience */}
            <Field
              label="Experience Range"
              icon={Clock}
              value={form.experience_range}
              onChange={(v) => setForm({ ...form, experience_range: v })}
              placeholder="e.g. 2–5 years, 5+ years"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Job Description <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                minLength={DESCRIPTION_MIN}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-52 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 resize-y"
                placeholder={`Describe the role, responsibilities, and requirements.\n\nExample:\nWe are looking for a Senior Backend Engineer to join our fintech team. You'll design and maintain high-throughput APIs using Python and FastAPI, integrate with payment gateways, and mentor junior engineers.\n\nRequired skills:\n• 4+ years Python / FastAPI or Django\n• PostgreSQL / Redis\n• Experience with payments or financial systems\n• Strong communication and ownership mindset`}
              />
            </label>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400">
                {descReady
                  ? '✓ Description meets minimum length'
                  : `Minimum ${DESCRIPTION_MIN} characters required`}
              </p>
              <span className={`text-xs font-bold ${descReady ? 'text-emerald-600' : descLen > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                {descLen} chars
              </span>
            </div>
          </div>

          {/* Preview card */}
          {form.title && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Preview</p>
              <p className="font-bold text-slate-900">{form.title}</p>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {[form.company, form.location, form.experience_range].filter(Boolean).join(' · ') || 'Add company, location, and experience range above'}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={saving}
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:-translate-y-px"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {saving ? 'Creating…' : 'Create job'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/recruiter/jobs')}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </motion.form>

        {/* Tips */}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white/60 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tips for better AI evaluation</p>
          <ul className="space-y-1.5 text-xs font-medium text-slate-400">
            <li>• Include specific required skills and technologies (e.g., "React 18, TypeScript, GraphQL")</li>
            <li>• List must-have vs. nice-to-have requirements clearly</li>
            <li>• Mention years of experience for key skills</li>
            <li>• Describe the team, culture, and growth opportunities</li>
          </ul>
        </div>
      </div>
    </WorkspaceShell>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <label className="block text-sm font-bold text-slate-800">
      <span className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-300"
      />
    </label>
  )
}
