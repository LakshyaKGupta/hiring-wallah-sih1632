'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'
import { API_URL } from '@/lib/api'
import { WorkspaceShell } from '@/components/ui/WorkspaceShell'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react'

type ResumeRow = {
  id: string
  file_name: string
  parse_status: string
  candidate_name?: string
  created_at: string
}

function parseStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
    pending: { label: 'Pending', className: 'border-slate-200 bg-slate-50 text-slate-500', Icon: RefreshCw },
    parsing: { label: 'Parsing…', className: 'border-sky-200 bg-sky-50 text-sky-700', Icon: Loader2 },
    done: { label: 'Parsed', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'border-red-200 bg-red-50 text-red-700', Icon: XCircle },
  }
  const { label, className, Icon } = map[status] ?? map['pending']
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

export default function ResumeUploadPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()

  const [files, setFiles] = useState<File[]>([])
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [uploading, setUploading] = useState(false)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoadingResumes(true)
    return apiFetch<{ resumes: ResumeRow[] }>(`/jobs/${jobId}/resumes`, {}, auth.currentUser)
      .then((data) => setResumes(data.resumes))
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Unable to load resumes.')
        setMessageType('error')
      })
      .finally(() => setLoadingResumes(false))
  }, [jobId])

  useEffect(() => { void load() }, [load])

  const acceptFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt'))
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...pdfs.filter((f) => !names.has(f.name))].slice(0, 20)
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFiles(Array.from(e.dataTransfer.files))
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return
    if (files.length > 20) {
      setMessage('Upload a maximum of 20 resumes at once.')
      setMessageType('error')
      return
    }
    setUploading(true)
    setMessage('')
    try {
      const form = new FormData()
      files.forEach((file) => form.append('files', file))
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`${API_URL}/jobs/${jobId}/resumes`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed.')
      setMessage(data.message || `${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully.`)
      setMessageType('success')
      setFiles([])
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.')
      setMessageType('error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <WorkspaceShell
      role="recruiter"
      activeId="resumes"
      title="Resume Upload"
      subtitle="PDF, DOCX, TXT · Max 20 per batch"
      primaryActionLabel="View evaluations"
      onPrimaryAction={() => router.push(`/recruiter/jobs/${jobId}/evaluations`)}
      action={null}
      onCloseAction={() => undefined}
      backHref={`/recruiter/jobs/${jobId}`}
      backLabel="Back to job"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Upload form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Upload Resumes</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Batch upload up to 20 resumes. Evaluation runs automatically once AI is configured.
            </p>
          </div>

          <form onSubmit={upload} className="flex flex-col gap-5">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                isDragging
                  ? 'border-sky-400 bg-sky-50'
                  : files.length > 0
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50/70 hover:border-sky-300 hover:bg-sky-50/30'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition ${files.length > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isDragging ? 'Drop files here' : files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Drop files or click to browse'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">PDF, DOCX, TXT · Max 20 files per upload</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(e) => acceptFiles(Array.from(e.target.files || []))}
              />
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {files.map((file, i) => (
                      <div key={file.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs font-medium text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                          className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-400">{files.length}/20 files selected</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
                    messageType === 'success'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-red-100 bg-red-50 text-red-700'
                  }`}
                >
                  {messageType === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                disabled={uploading || files.length === 0}
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? files.length + ' ' : ''}resume${files.length !== 1 ? 's' : ''}`}
              </button>
              {files.length > 0 && !uploading && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Uploaded resumes list */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Uploaded Resumes</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-400">
                {resumes.length > 0 ? `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} uploaded` : 'No resumes yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Refresh list"
              >
                <RefreshCw className={`h-4 w-4 ${loadingResumes ? 'animate-spin' : ''}`} />
              </button>
              {resumes.length > 0 && (
                <Link
                  href={`/recruiter/jobs/${jobId}/evaluations`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 transition"
                >
                  View evaluations <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {loadingResumes ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-40 rounded-full bg-slate-200" />
                    <div className="h-3 w-24 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
              <FileText className="h-9 w-9 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-500">No resumes uploaded yet</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Upload resumes using the form to begin evaluation.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto flex-1">
              {resumes.map((resume, i) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{resume.candidate_name || resume.file_name}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{resume.file_name}</p>
                  </div>
                  {parseStatusBadge(resume.parse_status)}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  )
}
