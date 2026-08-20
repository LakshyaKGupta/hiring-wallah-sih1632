'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  FileCheck2,
  Fingerprint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import FloatingIcons from '@/components/ui/FloatingIcons'

/* ── Interactive Candidate Profiles (Auto-Rotating) ── */
interface HeroCandidateProfile {
  id: string
  score: number
  verdict: string
  verdictColor: string
  proofCount: number
  claimsCount: number
}

const HERO_PROFILES: HeroCandidateProfile[] = [
  {
    id: 'candidate-1',
    score: 91,
    verdict: 'Strong Hire',
    verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    proofCount: 18,
    claimsCount: 42,
  },
  {
    id: 'candidate-2',
    score: 94,
    verdict: 'Exceptional Fit',
    verdictColor: 'text-violet-700 bg-violet-50 border-violet-200',
    proofCount: 24,
    claimsCount: 38,
  },
  {
    id: 'candidate-3',
    score: 88,
    verdict: 'Recommended',
    verdictColor: 'text-blue-700 bg-blue-50 border-blue-200',
    proofCount: 15,
    claimsCount: 31,
  },
]

const CORE_CX = 280
const CORE_CY = 260

type NodeDef = {
  label: string
  value: (p: HeroCandidateProfile) => string
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  cx: number
  cy: number
  floatDelay: string
  floatDuration: string
}

const NODE_DEFS: NodeDef[] = [
  { label: 'Rubric Criteria', value: () => 'Weighted 100%', Icon: BarChart3, cx: 118, cy: 98, floatDelay: '0s', floatDuration: '6s' },
  { label: 'Resume Claims', value: (p) => `${p.claimsCount} claims extracted`, Icon: FileCheck2, cx: 522, cy: 160, floatDelay: '-2s', floatDuration: '6s' },
  { label: 'Verified Proofs', value: (p) => `${p.proofCount} proofs confirmed`, Icon: ShieldCheck, cx: 524, cy: 360, floatDelay: '-4s', floatDuration: '6s' },
  { label: 'Consensus Ledger', value: () => 'SHA-256 Fingerprint', Icon: Fingerprint, cx: 124, cy: 420, floatDelay: '-1.5s', floatDuration: '6s' },
]

function signalPath({ cx, cy }: { cx: number; cy: number }) {
  const mx = (cx + CORE_CX) / 2
  const my = (cy + CORE_CY) / 2
  return `M ${cx} ${cy} Q ${mx} ${my} ${CORE_CX} ${CORE_CY}`
}

function nodePct(node: { cx: number; cy: number }) {
  return {
    left: `${(node.cx / 560) * 100}%`,
    top: `${(node.cy / 520) * 100}%`,
  }
}

function HeroSignalMap({
  activeProfile,
}: {
  activeProfile: HeroCandidateProfile
}) {
  return (
    <div className="relative h-[520px] w-[560px] max-w-full select-none transform-gpu" style={{ overflow: 'visible' }}>
      {/* Ambient radial glow behind core */}
      <div
        className="pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.08),transparent_65%)] blur-2xl transform-gpu"
        style={{ width: 320, height: 320, left: CORE_CX - 160, top: CORE_CY - 160 }}
      />

      {/* SVG: orbit rings + dynamic signal paths */}
      <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 560 520" fill="none" aria-hidden>
        {/* Outer dashed orbit */}
        <circle
          className="hero-orbit-ring"
          cx={CORE_CX}
          cy={CORE_CY}
          r={220}
          stroke="rgba(124,58,237,0.12)"
          strokeWidth="1.2"
          strokeDasharray="8 12"
          style={{ transformOrigin: `${CORE_CX}px ${CORE_CY}px` }}
        />
        {/* Inner dashed orbit */}
        <circle
          className="hero-orbit-ring hero-orbit-ring-reverse"
          cx={CORE_CX}
          cy={CORE_CY}
          r={145}
          stroke="rgba(15,23,42,0.05)"
          strokeWidth="1"
          strokeDasharray="4 10"
          style={{ transformOrigin: `${CORE_CX}px ${CORE_CY}px` }}
        />
        {/* Signal paths with animated dashes */}
        {NODE_DEFS.map((node, i) => (
          <path
            key={node.label}
            className="hero-signal-path"
            d={signalPath(node)}
            stroke={i % 2 === 0 ? 'rgba(124,58,237,0.28)' : 'rgba(16,185,129,0.26)'}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="8 12"
            style={{ animationDelay: `${i * -1.3}s` }}
          />
        ))}
      </svg>

      {/* Score core — positioned via CSS to match SVG coordinate */}
      <div
        className="hero-score-cluster absolute z-30 transform-gpu"
        style={{
          left: `${(CORE_CX / 560) * 100}%`,
          top: `${(CORE_CY / 520) * 100}%`,
          '--score-transform': 'translate(-50%, -50%)',
        } as React.CSSProperties}
      >
        {/* Spinning gradient arc */}
        <svg
          className="hero-arc-spin absolute pointer-events-none"
          viewBox="0 0 236 236"
          fill="none"
          style={{
            width: 236,
            height: 236,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'visible',
          }}
          aria-hidden
        >
          <circle
            cx="118"
            cy="118"
            r="112"
            stroke="url(#heroArcGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 280"
          />
          <defs>
            <linearGradient id="heroArcGrad" x1="0" y1="0" x2="236" y2="236" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(124,58,237)" stopOpacity="0.85" />
              <stop offset="60%" stopColor="rgb(99,102,241)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>

        {/* Score Card Display */}
        <motion.div
          key={activeProfile.id}
          initial={{ scale: 0.96, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="hero-score-core relative flex h-54 w-54 flex-col items-center justify-center rounded-full border border-white/95 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transform-gpu"
        >
          <div className="absolute inset-5 rounded-full border-[8px] border-slate-100/80" />
          <div className="relative z-10 text-center px-4">
            <div className="text-[4.5rem] font-black leading-none tracking-[-0.07em] text-slate-950">
              {activeProfile.score}
            </div>
            <div className={`mt-1 inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${activeProfile.verdictColor}`}>
              {activeProfile.verdict}
            </div>
            <div className="mt-2 text-[10px] font-bold tracking-wide uppercase text-slate-400">
              Consensus Score
            </div>
          </div>
        </motion.div>
      </div>

      {/* Signal Nodes — positioned to match SVG anchors */}
      {NODE_DEFS.map((node) => {
        const Icon = node.Icon
        const isLeftNode = node.cx < CORE_CX
        return (
          <div
            key={node.label}
            className={`hero-signal-node absolute z-20 flex items-center gap-2.5 transform-gpu ${
              isLeftNode ? 'flex-row-reverse text-right' : ''
            }`}
            style={{
              ...nodePct(node),
              '--node-transform': isLeftNode ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
              animationDelay: node.floatDelay,
              animationDuration: node.floatDuration,
            } as React.CSSProperties}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/90 bg-white text-violet-700 shadow-sm backdrop-blur-lg">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="rounded-2xl border border-slate-200/90 bg-white/90 px-3.5 py-2 shadow-xs backdrop-blur-md">
              <span className="block text-xs font-extrabold leading-none text-slate-950">{node.label}</span>
              <span className="mt-1 block text-[11px] font-semibold leading-none text-slate-500">
                {node.value(activeProfile)}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Main export ── */
export function HeroConvergenceScene() {
  const [profileIdx, setProfileIdx] = useState(0)

  // Smooth candidate rotation every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setProfileIdx((prev) => (prev + 1) % HERO_PROFILES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const activeProfile = HERO_PROFILES[profileIdx]

  const scrollToWorkspaces = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const element = document.getElementById('workspaces')
    if (!element) return
    event.preventDefault()
    window.history.replaceState(null, '', window.location.pathname)
    window.scrollTo({ top: Math.max(0, element.offsetTop - 64), behavior: 'smooth' })
  }

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] w-full items-center overflow-hidden bg-[#faf9f7] px-5 py-14 md:px-6 lg:py-12">
      {/* Ambient floating icons */}
      <FloatingIcons count={5} className="opacity-60" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute left-1/2 top-0 h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.06),transparent_68%)] blur-2xl pointer-events-none transform-gpu" />

      {/* Fade to white at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white pointer-events-none" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        {/* ── Left: Copy & Actions ── */}
        <div className="mx-auto max-w-2xl space-y-7 text-center lg:mx-0 lg:max-w-none lg:text-left">
          <div className="space-y-5">
            <div className="relative inline-block pb-2">
              <h1 className="font-display text-5xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 md:text-7xl lg:text-[5rem]">
                Autonomous career{' '}
                <span className="whitespace-nowrap bg-gradient-to-r from-violet-700 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
                  & hiring OS.
                </span>
              </h1>
              <svg
                className="hero-pencil-underline pointer-events-none absolute -bottom-2 left-1/2 h-8 w-[94%] -translate-x-1/2 overflow-visible lg:left-0 lg:w-[88%] lg:translate-x-0"
                viewBox="0 0 560 44"
                fill="none"
                aria-hidden
              >
                <path className="hero-pencil-glow" d="M8 29 C88 9 148 31 226 18 C312 4 366 35 552 16" />
                <path className="hero-pencil-path" d="M8 29 C88 9 148 31 226 18 C312 4 366 35 552 16" />
              </svg>
            </div>

            <p className="mx-auto max-w-xl text-lg font-medium leading-8 text-slate-600 lg:mx-0">
              Autonomous hiring and career matching platform. Replace blind keyword filtering with verified evidence auditing across multi-sector employment channels.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth?mode=signup"
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl border border-violet-950 bg-violet-900 px-7 py-4 text-base font-bold text-white shadow-[0_14px_28px_rgba(124,58,237,0.20)] transition-all duration-200 hover:bg-violet-800 hover:shadow-[0_18px_36px_rgba(124,58,237,0.25)]"
              >
                <span>Get started free</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/"
                onClick={scrollToWorkspaces}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-7 py-4 text-base font-bold text-slate-900 shadow-xs backdrop-blur transition-all duration-200 hover:border-violet-300 hover:bg-white"
              >
                <Briefcase className="h-5 w-5 text-violet-600" />
                <span>Explore Portals</span>
              </Link>
            </motion.div>
          </div>

          <div className="mx-auto grid max-w-xl grid-cols-3 gap-3.5 pt-1 lg:mx-0">
            {[
              { stat: '6x', label: 'Faster Screening' },
              { stat: '100%', label: 'Explainable Fit' },
              { stat: 'SHA', label: 'Verified Reports' },
            ].map(({ stat, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 text-left shadow-xs backdrop-blur-md"
              >
                <div className="text-2xl font-black tracking-[-0.04em] text-slate-950">{stat}</div>
                <div className="mt-1 text-xs font-semibold leading-snug text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Interactive Signal Map ── */}
        <div className="hidden w-full md:flex md:justify-center lg:justify-self-center">
          <HeroSignalMap activeProfile={activeProfile} />
        </div>
      </div>
    </section>
  )
}
export default HeroConvergenceScene
