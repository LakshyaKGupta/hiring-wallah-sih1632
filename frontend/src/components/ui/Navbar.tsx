'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  UserPlus,
  LogIn,
  ClipboardCheck,
  FileText,
  Sparkles,
  Network,
  Briefcase,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Zap,
  Cpu,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navLinks = [
  { href: '/#hero', label: 'Home', icon: Home, sectionId: 'hero', match: (p: string) => p === '/' },
  { href: '/#features', label: 'Features', icon: Zap, sectionId: 'features', match: (p: string) => p === '/' },
  { href: '/#workspaces', label: 'Workspaces', icon: Briefcase, sectionId: 'workspaces', match: (p: string) => p === '/' },
  { href: '/#how-it-works', label: 'How It Works', icon: Cpu, sectionId: 'how-it-works', match: (p: string) => p === '/' },
]

const sectionIds = navLinks.map((item) => item.sectionId)

function NavLink({
  href, label, sectionId, icon: Icon, isActive, onActivate, className = '',
}: {
  href: string; label: string; sectionId: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean; onActivate?: (id: string) => void; className?: string
}) {
  const pathname = usePathname()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        e.preventDefault()
        onActivate?.(sectionId)
        window.history.replaceState(null, '', window.location.pathname)
        const top = Math.max(0, el.offsetTop - 64)
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }
  }

  return (
    <motion.div whileTap={{ scale: 0.95 }} className="relative">
      <Link
        href={href}
        onClick={handleClick}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs font-semibold select-none border transition-all duration-200 group/nav ${
          isActive
            ? 'border-accent-primary/20 bg-accent-primary/5 text-text-primary shadow-sm'
            : 'border-transparent text-text-secondary hover:border-border-subtle hover:text-text-primary'
        } ${className}`}
      >
        <div className="p-0.5 rounded border border-border-subtle bg-bg-deep transition-transform duration-300 group-hover/nav:scale-110 group-hover/nav:rotate-6">
          <Icon className={`w-3 h-3 ${isActive ? 'text-accent-primary' : 'text-text-tertiary'}`} />
        </div>
        <span className="hidden md:inline">{label}</span>
        {isActive && (
          <motion.div
            layoutId="navbar-active-indicator"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute inset-0 bg-accent-primary/5 border border-accent-primary/20 rounded-lg -z-10"
          />
        )}
      </Link>
    </motion.div>
  )
}

/* ── User Avatar Dropdown ── */
function UserMenu({ user, signOut }: { user: { displayName: string | null; email: string | null; photoURL: string | null; role: string | null }; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    router.push('/')
  }

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border-subtle bg-bg-surface hover:border-accent-primary/30 hover:bg-accent-primary/5 transition-all duration-200 group"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent-primary text-white text-xs font-bold flex items-center justify-center">{initials}</div>
        )}
        <span className="hidden sm:inline text-xs font-semibold text-text-primary max-w-[100px] truncate">
          {user.displayName ?? user.email}
        </span>
        <ChevronDown className={`w-3 h-3 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border-subtle z-50 overflow-hidden"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-border-subtle bg-bg-surface/50">
                <p className="text-xs font-bold text-text-primary truncate">{user.displayName ?? 'User'}</p>
                <p className="text-[11px] text-text-tertiary truncate mt-0.5">{user.email}</p>
                {user.role && (
                  <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.role === 'recruiter' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {user.role === 'recruiter' ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {user.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                  </span>
                )}
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                {user.role && (
                  <Link
                    href={`/${user.role}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavbarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams?.get('mode')
  const isAuthPage = pathname === '/auth'
  const isDashboard = pathname?.startsWith('/recruiter') || pathname?.startsWith('/candidate')
  const [activeSection, setActiveSection] = useState('hero')
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (isDashboard) return
    let frame = 0
    const syncActiveSection = () => {
      const scrollPosition = window.scrollY + 96
      let nextSection = 'hero'
      for (const id of sectionIds) {
        const element = document.getElementById(id)
        if (element && scrollPosition >= element.offsetTop) nextSection = id
      }
      setActiveSection(nextSection)
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
    }
    const handleScroll = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(syncActiveSection)
    }
    syncActiveSection()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('scroll', handleScroll) }
  }, [isDashboard])

  if (isDashboard) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-surface/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center font-display font-bold text-base text-white shadow-sm relative overflow-hidden"
          >
            <span className="relative z-10">W</span>
            <motion.div
              className="absolute inset-0 bg-accent-primary/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
          <span className="font-display font-extrabold text-base sm:text-lg text-text-primary tracking-tight transition-all duration-200 group-hover:text-accent-primary">
            Hiring Wallah
          </span>
        </Link>

        {/* Landing page nav links - hide on dashboard */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-0.5 sm:gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.sectionId}
                href={item.href}
                label={item.label}
                sectionId={item.sectionId}
                icon={item.icon}
                isActive={pathname === '/' ? activeSection === item.sectionId : item.match(pathname ?? '')}
                onActivate={setActiveSection}
              />
            ))}
          </nav>
        )}

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-bg-subtle animate-pulse" />
          ) : user ? (
            <>
              {!isDashboard && (
                <button
                  type="button"
                  onClick={() => router.push(user.role ? `/${user.role}` : '/auth?mode=signup&completeProfile=1')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white"
                  title={user.role ? `Open ${user.role} dashboard` : 'Choose a role to open your dashboard'}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}
              {isDashboard && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                  user.role === 'recruiter'
                    ? 'border-blue-100 bg-blue-50 text-blue-700'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                }`}>
                  {user.role === 'recruiter' ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {user.role === 'recruiter' ? 'Recruiter workspace' : 'Candidate workspace'}
                </span>
              )}
              <UserMenu user={user} signOut={signOut} />
            </>
          ) : (
            <>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link
                  href="/auth?mode=signin"
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold font-bold transition-all duration-200 ${
                    isAuthPage && mode === 'signin'
                      ? 'text-accent-primary bg-accent-primary/5 border border-accent-primary/20'
                      : 'text-text-secondary hover:text-text-primary border border-transparent hover:border-border-subtle'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/auth?mode=signup"
                  className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${
                    isAuthPage && mode === 'signup'
                      ? 'bg-violet-900 !text-white border border-violet-950 shadow-sm'
                      : 'bg-violet-900 hover:bg-violet-800 !text-white border border-violet-950 shadow-sm shadow-violet-900/20'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-surface/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white font-bold">W</div>
            <span className="font-display font-extrabold text-base text-text-primary">Hiring Wallah</span>
          </div>
          <div className="w-24 h-8 rounded-lg bg-bg-subtle animate-pulse" />
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  )
}
