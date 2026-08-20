'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  FileSearch,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Settings,
  Upload,
  Sparkles,
  Target,
  X,
  ArrowLeft,
  Compass,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export type WorkspaceRole = 'recruiter' | 'candidate'

export interface WorkspaceNavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  contribution: string
  needsJobContext?: boolean
}

export interface WorkspaceAction {
  title: string
  description: string
  steps?: string[]
  cta?: string
}

interface WorkspaceShellProps {
  role: WorkspaceRole
  activeId: string
  title: string
  subtitle: string
  primaryActionLabel: string
  onPrimaryAction: () => void
  onNavSelect?: (id: string) => void
  children: React.ReactNode
  toast?: string
  action: WorkspaceAction | null
  onCloseAction: () => void
  backHref?: string
  backLabel?: string
}

const recruiterNav: WorkspaceNavItem[] = [
  { id: 'dashboard', label: 'Overview', href: '/recruiter', icon: LayoutDashboard, contribution: 'Hiring Intelligence' },
  { id: 'jobs', label: 'Hiring Processes', href: '/recruiter/jobs', icon: Briefcase, contribution: 'Active jobs' },
  { id: 'resumes', label: 'Candidates', href: '/recruiter/jobs', icon: Upload, contribution: 'Evidence collection', needsJobContext: true },
  { id: 'evaluations', label: 'Recommendations', href: '/recruiter/jobs', icon: Target, contribution: 'AI verdict', needsJobContext: true },
  { id: 'reports', label: 'Reports', href: '/recruiter/jobs', icon: ShieldCheck, contribution: 'Audit trail', needsJobContext: true },
  { id: 'settings', label: 'Settings', href: '/recruiter/settings', icon: Settings, contribution: 'Platform config' },
]

const candidateNav: WorkspaceNavItem[] = [
  { id: 'overview', label: 'Home Dashboard', href: '/candidate', icon: LayoutDashboard, contribution: 'Candidate OS' },
  { id: 'opportunities', label: 'Opportunities', href: '/opportunities', icon: Briefcase, contribution: 'Multi-sector hub' },
  { id: 'applications', label: 'My Applications', href: '/applications', icon: ShieldCheck, contribution: 'Status tracking' },
  { id: 'counseling', label: 'Career Counseling', href: '/counseling', icon: Compass, contribution: 'Advisors & Copilot' },
  { id: 'mentorship', label: 'Mentorship', href: '/mentorship', icon: Users, contribution: 'Alumni pairing' },
  { id: 'resume', label: 'Upload Resume', href: '/candidate?tab=resume', icon: Upload, contribution: 'Analyze fit' },
  { id: 'settings', label: 'Profile & Settings', href: '/candidate?tab=settings', icon: Settings, contribution: 'Account info' },
]

export function WorkspaceShell({
  role,
  activeId,
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryAction,
  onNavSelect,
  children,
  toast,
  action,
  onCloseAction,
  backHref,
  backLabel,
}: WorkspaceShellProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [contextToast, setContextToast] = useState('')
  const nav = role === 'recruiter' ? recruiterNav : candidateNav
  const roleLabel = role === 'recruiter' ? 'Recruiter workspace' : 'Candidate workspace'

  const initials = useMemo(() => {
    const name = user?.displayName || user?.email || 'User'
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [user?.displayName, user?.email])

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('[data-user-menu]')) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  const showContextToast = (msg: string) => {
    setContextToast(msg)
    setTimeout(() => setContextToast(''), 2800)
  }

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, item: WorkspaceNavItem) => {
    const href = item.href

    // Items that need a job context — redirect to jobs list with a hint
    if (item.needsJobContext) {
      event.preventDefault()
      showContextToast('Select a job first to access ' + item.label.toLowerCase() + '.')
      router.push('/recruiter/jobs')
      return
    }

    if (!href.startsWith('#')) return

    if (onNavSelect) {
      event.preventDefault()
      window.history.replaceState(null, '', href)
      onNavSelect(item.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const target = document.querySelector(href)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      {/* ── Sidebar (desktop lg+) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white/95 py-5 text-slate-950 shadow-[4px_0_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
          sidebarCollapsed ? 'w-[72px] px-2' : 'w-[260px] px-4'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <Link href="/" className={`flex min-w-0 items-center rounded-xl transition hover:bg-slate-50 p-1 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">W</div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold tracking-tight text-slate-950">Hiring Wallah</div>
                <div className="truncate text-xs font-semibold text-slate-400">Hiring intelligence OS</div>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`${sidebarCollapsed ? 'absolute -right-3.5 top-6 shadow-md' : ''} grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700`}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Role badge */}
        <div className={`mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ${sidebarCollapsed ? 'text-center px-1 py-2' : ''}`}>
          {sidebarCollapsed ? role[0].toUpperCase() : roleLabel}
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-1 flex-col gap-0.5" aria-label="Workspace navigation">
          {nav.map((item) => {
            const Icon = item.icon
            const active = activeId === item.id
            
            // Dynamic context logic
            let targetHref = item.href
            let requiresContext = item.needsJobContext
            const isRecruiter = role === 'recruiter'
            
            if (isRecruiter && item.needsJobContext) {
              const match = typeof window !== 'undefined' ? window.location.pathname.match(/\/recruiter\/jobs\/([^/]+)/) : null
              const currentJobId = match ? match[1] : null
              
              if (currentJobId && currentJobId !== 'new') {
                requiresContext = false // We have the context
                if (item.id === 'resumes') targetHref = `/recruiter/jobs/${currentJobId}/resumes`
                if (item.id === 'evaluations') targetHref = `/recruiter/jobs/${currentJobId}/evaluations`
                if (item.id === 'reports') targetHref = `/recruiter/jobs/${currentJobId}/reports`
              }
            }
            
            const muted = requiresContext && activeId !== item.id
            
            return (
              <React.Fragment key={item.id}>
                {item.id === 'settings' && <div className="mt-auto" />}
                <Link
                  href={targetHref}
                  title={sidebarCollapsed ? `${item.label}: ${item.contribution}` : undefined}
                  onClick={(e) => {
                    if (requiresContext) {
                      e.preventDefault()
                      showContextToast('Select a job first to access ' + item.label.toLowerCase() + '.')
                      router.push('/recruiter/jobs')
                    } else if (targetHref.startsWith('#')) {
                      handleNavClick(e, item)
                    }
                  }}
                  className={`group rounded-xl border transition-all duration-150 ${
                    sidebarCollapsed ? 'flex h-11 items-center justify-center px-0 py-0' : 'px-3 py-2.5'
                  } ${
                    active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : muted
                      ? 'border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                      : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-bold">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <div className={`mt-0.5 pl-7 text-[11px] font-medium leading-4 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                      {item.contribution}
                    </div>
                  )}
                </Link>
              </React.Fragment>
            )
          })}
        </nav>

        {/* User section at bottom */}
        {!sidebarCollapsed && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover shrink-0" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900">{user?.displayName || 'User'}</div>
                <div className="truncate text-xs text-slate-400">{user?.email}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            {/* Left: back or title */}
            <div className="flex min-w-0 items-center gap-4">
              {backHref && (
                <Link href={backHref} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm" aria-label={backLabel || 'Back'}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">{title}</h1>
                {subtitle && (
                  <>
                    <span className="hidden sm:block h-4 w-px bg-slate-200" />
                    <span className="hidden sm:block truncate text-sm font-medium text-slate-500">{subtitle}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: actions + user */}
            <div className="flex shrink-0 items-center gap-3">
              {primaryActionLabel && (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="hidden rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md sm:inline-flex"
                >
                  {primaryActionLabel}
                </button>
              )}
              <button
                type="button"
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>

              {/* User menu */}
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex h-9 items-center gap-2 rounded-xl pl-2 pr-3 transition hover:bg-slate-50"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full border border-slate-200 object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {initials}
                    </div>
                  )}
                  <span className="hidden text-sm font-bold text-slate-900 sm:block">{user?.displayName?.split(' ')[0] || 'Account'}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 p-4">
                        <p className="truncate text-sm font-bold text-slate-950">{user?.displayName ?? 'Hiring Wallah User'}</p>
                        <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{user?.email}</p>
                        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{role}</span>
                      </div>
                      <div className="p-1.5">
                        <button
                          role="menuitem"
                          type="button"
                          onClick={() => { setUserMenuOpen(false); void signOut() }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile / tablet horizontal nav (visible below lg) */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-4 py-2 scrollbar-none lg:hidden">
            {nav.map((item) => {
              const Icon = item.icon
              const active = activeId === item.id
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </a>
              )
            })}
          </div>
        </header>

        {/* Main content */}
        <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8" aria-label="Main content">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
          {children}
        </main>
      </div>

      {/* ── Context toast (for nav items that need job context) ── */}
      <AnimatePresence>
        {contextToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 shadow-xl"
          >
            {contextToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success/info toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action drawer ── */}
      <AnimatePresence>
        {action && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm"
              onClick={onCloseAction}
              aria-hidden
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
              role="dialog"
              aria-modal
              aria-label={action.title}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">{action.title}</h2>
                  <p className="mt-1.5 text-sm font-medium leading-6 text-slate-500">{action.description}</p>
                </div>
                <button
                  type="button"
                  onClick={onCloseAction}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {(action.steps ?? []).map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</div>
                    <p className="text-sm font-medium leading-6 text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-5">
                <button
                  type="button"
                  onClick={onCloseAction}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
                >
                  {action.cta ?? 'Close'}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
