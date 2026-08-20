'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  Briefcase,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import MeshBackground from '@/components/ui/MeshBackground'
import { useAuth } from '@/context/AuthContext'

/* ── Google Logo SVG ── */
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

/* ── Role Picker Modal ── */
function RolePickerModal({
  onSelect,
  loading,
  notice,
}: {
  onSelect: (role: 'recruiter' | 'candidate') => void
  loading: boolean
  notice?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
            W
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Welcome aboard!</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            How will you be using Hiring Wallah?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('recruiter')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all duration-200 group text-left disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-sm">I&apos;m a Recruiter</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">Post jobs, evaluate candidates, get verified audit reports</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-950 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onSelect('candidate')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 group text-left disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-sm">I&apos;m a Candidate</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">Upload resume, analyze fit, close skill gaps</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {notice && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-100 text-center">
            {notice}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Setting up your workspace…</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ── Main Auth Form ── */
function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const completeProfile = searchParams.get('completeProfile') === '1'
  const activeTab: 'signin' | 'signup' = mode === 'signup' ? 'signup' : 'signin'

  const { user, loading, profileLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, setUserRole } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [role,     setRole]     = useState<'recruiter' | 'candidate'>('recruiter')

  const [isLoading,      setIsLoading]      = useState(false)
  const [googleLoading,  setGoogleLoading]  = useState(false)
  const [roleModalOpen,  setRoleModalOpen]  = useState(false)
  const [roleLoading,    setRoleLoading]    = useState(false)
  const [isSuccess,      setIsSuccess]      = useState(false)
  const [successRole,    setSuccessRole]    = useState<'recruiter' | 'candidate'>('recruiter')
  const [authNotice,     setAuthNotice]     = useState('')
  const currentRole = user?.role
  const isSignedIn = Boolean(user)
  const shouldShowRoleModal = roleModalOpen || (!loading && !profileLoading && isSignedIn && !currentRole)
  const profileNotice = completeProfile && shouldShowRoleModal
    ? 'Choose how you want to use Hiring Wallah to open your dashboard.'
    : ''

  useEffect(() => {
    if (loading || profileLoading || isSuccess || !currentRole) return
    router.replace(`/${currentRole}`)
  }, [currentRole, loading, profileLoading, isSuccess, router])

  const switchTab = (tab: 'signin' | 'signup') => {
    setAuthNotice('')
    router.replace(`/auth?mode=${tab}`, { scroll: false })
  }

  /* ── Google Sign-In ── */
  const handleGoogleSignIn = async () => {
    const preferredRole = activeTab === 'signup' ? role : undefined
    
    setGoogleLoading(true)
    setAuthNotice('')
    
    try {
      await signInWithGoogle(preferredRole)
    } catch (err: unknown) {
      const code = typeof err === 'object' && err && 'code' in err
        ? String((err as { code?: unknown }).code)
        : ''
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      if (code.includes('popup-closed') || msg.includes('popup-closed')) {
        setAuthNotice('Sign-in cancelled.')
      } else if (code.includes('wrong-firebase-project')) {
        setAuthNotice('Google sign-in must use the Hiring Wallah Firebase project. Add the Hiring Wallah Firebase keys to .env.local before continuing.')
      } else if (code.includes('unauthorized-domain')) {
        setAuthNotice('This domain is not authorized in Firebase Authentication yet.')
      } else if (code.includes('configuration-not-found') || code.includes('operation-not-allowed')) {
        setAuthNotice('Google sign-in is not enabled in the Hiring Wallah Firebase console yet.')
      } else {
        console.error('Google Auth Error:', err)
        setAuthNotice(`Google sign-in failed: ${msg}`)
      }
      setGoogleLoading(false)
    }
  }

  const handleRoleSelect = async (selectedRole: 'recruiter' | 'candidate') => {
    setRoleLoading(true)
    setAuthNotice('')
    try {
      await setUserRole(selectedRole)
      setRoleModalOpen(false)
      setSuccessRole(selectedRole)
      setIsSuccess(true)
      setTimeout(() => router.push(`/${selectedRole}`), 1200)
    } catch (err: any) {
      setAuthNotice(err?.message || 'Failed to save your role. Please try again.')
      setRoleLoading(false)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthNotice('')
    try {
      const authUser = activeTab === 'signup'
        ? await signUpWithEmail({ role, email, password, displayName: name })
        : await signInWithEmail(email, password)

      if (!authUser.role) {
        setRoleModalOpen(true)
      } else {
        redirectToWorkspace(authUser.role)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('auth/invalid-credential')) {
        setAuthNotice('Incorrect email or password. If you do not have an account, please switch to the Sign Up tab.')
      } else {
        setAuthNotice(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const redirectToWorkspace = (r: 'recruiter' | 'candidate') => {
    setSuccessRole(r)
    setIsSuccess(true)
    setTimeout(() => router.push(`/${r}`), 1000)
  }

  return (
    <>
      {/* ── Role Picker Modal ── */}
      <AnimatePresence>
        {shouldShowRoleModal && (
          <RolePickerModal onSelect={handleRoleSelect} loading={roleLoading} notice={authNotice || profileNotice} />
        )}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-64px)] bg-[#f8f8f6] relative overflow-hidden flex items-center justify-center px-6 py-12">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <MeshBackground opacity={0.25} />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="w-full max-w-md bg-white/80 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-sm relative z-10"
        >
          {/* ── Success overlay ── */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4"
                >
                  <CheckCircle2 className="w-7 h-7" />
                </motion.div>
                <h3 className="font-extrabold text-xl text-slate-950 tracking-tight">
                  You&apos;re in!
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                  Opening your {successRole} workspace…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Logo + title ── */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
              W
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              {activeTab === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              {activeTab === 'signup'
                ? 'Join thousands making better hiring decisions'
                : 'Sign in to your Hiring Wallah workspace'}
            </p>
          </div>

          {/* ── Google Sign-In Button ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
            className="google-btn-shimmer w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 font-bold text-slate-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <GoogleLogo size={20} />
            )}
            <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── Tab switcher ── */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── Email form ── */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition"
              />
            </div>

            {/* Role selection (signup only) */}
            {activeTab === 'signup' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {(['recruiter', 'candidate'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${
                      role === r
                        ? 'border-slate-950 bg-slate-50 text-slate-950'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {r === 'recruiter' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="capitalize">{r}</span>
                  </button>
                ))}
              </div>
            )}

            {(authNotice || profileNotice) && (
              <p className="text-sm text-rose-600 font-medium text-center py-1">{authNotice || profileNotice}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {activeTab === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Trust badges ── */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 verified</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>No data sold</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

/* ── Page wrapper ── */
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
