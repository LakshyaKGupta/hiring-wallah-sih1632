'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { 
  Briefcase, 
  User, 
  ShieldAlert, 
  Cpu, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  AlertOctagon, 
  Search, 
  Sliders, 
  Users, 
  Zap,
  FileText,
  GraduationCap,
  Building2,
  Globe2,
  Compass,
  Target,
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import MeshBackground from '@/components/ui/MeshBackground'
import {
  fadeUpItemVariants as sectionItemVariants,
  EASE_OUT,
  EASE_SNAPPY,
  EASE_KORE,
  appleTransition,
  koreTransition,
  SPRING_SNAPPY,
  SPRING_GENTLE,
} from '@/lib/motion'
import ScrollProgress from '@/components/ui/ScrollProgress'
import { HeroConvergenceScene } from '@/components/3d/HeroConvergenceScene'
import FloatingIcons from '@/components/ui/FloatingIcons'
import { SectionReveal } from '@/components/ui/SectionReveal'

const featureCards = [
  {
    title: '6× Faster Screening',
    detail: 'Ingest thousands of resumes, parse credentials, and shortlist top talent in under 5 minutes without manual reading.',
    icon: Zap,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50/80',
    stat: '6x faster',
  },
  {
    title: 'Explainable Decisions',
    detail: 'Get a comprehensive written scorecard explaining exactly why every candidate was recommended or skipped.',
    icon: FileText,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50/80',
    stat: 'Full trail',
  },
  {
    title: 'Evidence-Based Evaluation',
    detail: 'Verify skills against actual project history, timelines, and role scope, bypassing buzzword keyword packing.',
    icon: CheckCircle2,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50/80',
    stat: 'Verified',
  },
  {
    title: 'Multi-Sector Intelligence',
    detail: 'Seamlessly match candidates across Private Jobs, Rajasthan Govt PSUs, Overseas TITP Japan, and AICTE Internships.',
    icon: GraduationCap,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50/80',
    stat: 'Statewide',
  },
] as const

function FeatureReasoningCard({
  title,
  detail,
  icon: Icon,
  colorClass,
  bgClass,
  stat,
  index,
}: {
  title: string
  detail: string
  icon: LucideIcon
  colorClass: string
  bgClass: string
  stat: string
  index: number
}) {
  return (
    <motion.div
      variants={sectionItemVariants}
      whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="group grid gap-3 border-b border-slate-200/80 px-5 py-5 last:border-b-0 md:grid-cols-[56px_1fr_auto] md:items-center md:px-7 transition-all"
    >
      <div className={`idle-drift-${(index % 4) + 1} flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bgClass} border border-slate-200/60 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className={`h-5 w-5 ${colorClass}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-violet-950 transition-colors">{title}</h3>
          <span className="hidden rounded-full border border-slate-200 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500 sm:inline-flex">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-500">{detail}</p>
      </div>
      <div className="self-start rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-xs font-extrabold text-slate-700 shadow-xs md:self-auto md:justify-self-end group-hover:border-violet-300 group-hover:text-violet-700 transition-colors">
        {stat}
      </div>
    </motion.div>
  )
}

function AnimatedScore({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const [display, setDisplay] = useState(value)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      motionValue.set(value)
      setDisplay(value)
      return
    }

    const controls = animate(motionValue, value, {
      duration: 0.5,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, motionValue])

  return <motion.span className="inline-block">{display}</motion.span>
}

/* ── Sector Showcase Opportunities ── */
const SECTOR_SHOWCASE = [
  {
    id: 'private',
    name: 'Private Tech Sector',
    badge: 'High Demand',
    icon: Building2,
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    title: 'Full Stack Cloud Engineer',
    org: 'Infosys / Mahindra World City (Jaipur)',
    package: '₹6.5 - 10.0 LPA',
    branch: 'B.Tech CSE / IT / ECE',
    skills: ['React', 'Python / FastAPI', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'govt',
    name: 'Rajasthan Govt / PSUs',
    badge: 'Official Vacancy',
    icon: GraduationCap,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    title: 'Junior Engineer (Electrical & Automation)',
    org: 'RVUNL — Suratgarh Super Thermal Power Station',
    package: 'Level-10 (₹39,300 - 1,15,500)',
    branch: 'Electrical / Power Systems',
    skills: ['SCADA', 'Grid Synchronization', 'PLC Automation'],
  },
  {
    id: 'overseas',
    name: 'Overseas Employment',
    badge: 'International TITP',
    icon: Globe2,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    title: 'Mechatronics & Robotics Trainee',
    org: 'Japan TITP Program (Tokyo & Nagoya)',
    package: '¥220,000 / mo (~₹1.25 Lakhs)',
    branch: 'Diploma / B.Tech Mechanical / Mechatronics',
    skills: ['Robotics', 'CNC Machining', 'Japanese N4 / N5'],
  },
  {
    id: 'internship',
    name: 'Internships & Training',
    badge: 'AICTE Certified',
    icon: Compass,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    title: 'Solar Inverter & Microgrid Intern',
    org: 'Bhadla 2.25GW Solar Park (Jodhpur)',
    package: '₹12,000 / month Stipend',
    branch: 'Electrical / Renewable Energy',
    skills: ['PV Inverters', 'Solar PV Design', 'MATLAB/Simulink'],
  },
]

export default function LandingPage() {
  const [workspaceTab, setWorkspaceTab] = useState<'recruiter' | 'candidate' | 'sectors'>('recruiter')
  const [activeSectorIdx, setActiveSectorIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const candidatesData = [
    {
      name: "Derrick Vance (The Vet)",
      experience: "9 Years",
      role: "Staff Engineer (Java/Node focus)",
      description: "Former Staff Engineer at Enterprise scale. High ownership, but missing target skills (Python & GraphQL).",
      expMatch: 95,
      skillMatch: 55,
      gaps: ["Python", "GraphQL", "Kubernetes"]
    },
    {
      name: "Sasha Chen (The Match)",
      experience: "2.5 Years",
      role: "Mid Developer (Full-Stack stack)",
      description: "Exceptional skill alignment across all required tools. Fast learner with shorter timeline exposure.",
      expMatch: 45,
      skillMatch: 100,
      gaps: []
    },
    {
      name: "Elena Rostova (The All-Rounder)",
      experience: "5 Years",
      role: "Senior Software Engineer",
      description: "Strong candidate with balanced tenure and skills. Only missing target cloud infrastructure tool (Docker).",
      expMatch: 75,
      skillMatch: 80,
      gaps: ["Docker"]
    }
  ]

  const [activeCandidateIdx, setActiveCandidateIdx] = useState(0)
  const [expWeight, setExpWeight] = useState(50)
  const skillWeight = 100 - expWeight

  const candidate = candidatesData[activeCandidateIdx]
  const suitabilityScore = Math.round((candidate.expMatch * expWeight + candidate.skillMatch * skillWeight) / 100)

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (suitabilityScore / 100) * circumference

  return (
    <div ref={containerRef} className="relative w-full bg-white scroll-smooth selection:bg-violet-100 selection:text-violet-900">
      <ScrollProgress />
      
      {/* SECTION 1: HERO */}
      <section id="hero" className="w-full relative overflow-hidden scroll-mt-16">
        <HeroConvergenceScene />
      </section>

      {/* SECTION 2: FEATURES */}
      <section id="features" className="w-full min-h-screen flex flex-col justify-center py-16 lg:py-20 relative overflow-hidden bg-white scroll-mt-16 section-divider">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 to-white pointer-events-none" />
        <div className="section-glow-seam pointer-events-none absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#f8f8fb]" />
        <FloatingIcons count={5} />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            <SectionReveal className="space-y-5 lg:w-1/3" variant="left">
              <div className="section-kicker-glow inline-flex bg-violet-50 border border-violet-200/80 text-violet-700 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-xs">
                Product Outcomes
              </div>
              <h2 className="section-title-glow font-display text-4xl lg:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950">
                Screen with precision.<br />Hire with receipts.
              </h2>
              <p className="text-base leading-relaxed text-slate-500 font-medium">
                Shortlist top talent with{' '}
                <span className="font-extrabold text-slate-900">absolute trust</span>. Hiring Wallah replaces blind keyword filters with verified evidence auditing and consensus scoring — backed by tamper-evident cryptographic audit trails.
              </p>
              <div className="relative overflow-hidden border-y border-slate-200/90 bg-white/80 px-4 py-2.5 text-xs font-extrabold tracking-wide text-slate-700 rounded-xl shadow-xs">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span>Parse</span>
                  <span className="h-px w-6 bg-slate-300" />
                  <span>Verify</span>
                  <span className="h-px w-6 bg-slate-300" />
                  <span>Rank</span>
                  <span className="h-px w-6 bg-slate-300" />
                  <span>Fingerprint</span>
                </div>
              </div>
            </SectionReveal>

            <SectionReveal className="lg:w-2/3" variant="default" delay={100}>
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-md shadow-sm">
                {featureCards.map((feature, index) => (
                  <FeatureReasoningCard key={feature.title} {...feature} index={index} />
                ))}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* SECTION 3: WORKSPACES & SECTORS */}
      <section id="workspaces" className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center py-16 lg:py-20 relative overflow-hidden bg-[#f8f8fb] scroll-mt-16 section-divider">
        <MeshBackground opacity={0.05} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
        <div className="section-glow-seam pointer-events-none absolute left-1/2 top-16 h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        <FloatingIcons count={4} />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 space-y-8 lg:space-y-10">
          {/* Header & Tabs */}
          <SectionReveal className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="section-kicker-glow inline-flex bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-xs">
              Enterprise & Candidate Workspaces
            </div>
            <h2 className="section-title-glow text-4xl md:text-5xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
              Integrated Hiring Ecosystem
            </h2>
            <p className="section-copy-drift text-base text-slate-500 leading-relaxed font-medium max-w-lg mx-auto">
              Explore multi-sector employment channels, explainable candidate audits, and dynamic score calibrations.
            </p>
            
            {/* Sliding Pill Tab Switcher */}
            <div className="inline-flex p-1.5 bg-slate-200/60 rounded-2xl relative border border-slate-200">
              {[
                { id: 'recruiter', label: 'Recruiter Workspace' },
                { id: 'candidate', label: 'Candidate Studio' },
                { id: 'sectors', label: 'Opportunity Hub' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id as any)}
                  className={`relative px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 z-10 ${
                    workspaceTab === tab.id ? 'text-slate-950 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {workspaceTab === tab.id && (
                    <motion.div
                      layoutId="workspace-tab-pill"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/70 z-[-1]"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </SectionReveal>

          <AnimatePresence mode="wait">
            {workspaceTab === 'recruiter' && (
              <motion.div
                key="recruiter"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={appleTransition(0.4)}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center"
              >
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
                      See exactly why a candidate was recommended.
                    </h3>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">
                      Hiring Wallah is not a black box. Each recommendation is backed by a structured reasoning trail from our AI committee. Drill down into individual objections, claim verification facts, and dynamic rubrics.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { num: '01', title: 'Generative Job Descriptions', desc: 'Create tailored rubrics with explicit skill and experience limits.' },
                      { num: '02', title: 'Automated Evidence Auditing', desc: 'Verify claims against verified repo, project, and institutional records.' },
                      { num: '03', title: 'Consent & Verification Trails', desc: 'Track candidate validation facts cryptographically with SHA-256 fingerprints.' }
                    ].map((item) => (
                      <div key={item.num} className="flex items-start gap-4 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
                        <div className="text-xs font-extrabold text-violet-700 bg-violet-50 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-violet-200">
                          {item.num}
                        </div>
                        <div className="pt-0.5">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/recruiter" className="inline-block pt-2">
                      <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-950 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all">
                        <span>Open Recruiter Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </motion.div>
                </div>

                <div className="lg:col-span-7 relative">
                  <div className="section-ambient-pulse absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-3xl opacity-50 rounded-[3rem]" />
                  <div className="rounded-2xl border border-slate-200 bg-white/80 overflow-hidden relative z-10 flex min-h-[420px] flex-col backdrop-blur-md shadow-lg">
                    <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 text-center text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md py-1 mx-4">recruiter.hiringwallah.com</div>
                    </div>
                    <div className="flex-1 p-6 sm:p-8 bg-slate-50/50 overflow-hidden relative">
                      <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-lg">
                              LG
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-900">Lakshya Gupta</h4>
                              <p className="text-xs text-slate-500 font-medium">Lead Product Designer & Architect</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="idle-breathe text-3xl font-extrabold text-violet-700 tracking-tight">91%</div>
                            <div className="mt-0.5 text-[10px] font-bold tracking-wide text-slate-400">Match score</div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-5">
                          <div>
                            <div className="mb-3 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Verified evidence (6 agents consensus)</div>
                            <div className="space-y-3">
                              {[
                                { text: "Built autonomous multi-agent hiring OS", sub: "Verified in project portfolio (Page 2)" },
                                { text: "Led recruiter onboarding & explainability", sub: "Verified via role history & GitHub proofs (Page 1)" }
                              ].map((ev, i) => (
                                <div key={i} className="flex gap-3">
                                  <div className="mt-0.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-900">{ev.text}</div>
                                    <div className="text-xs text-slate-500">{ev.sub}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Consensus verdict</span>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">STRONG HIRE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {workspaceTab === 'candidate' && (
              <motion.div
                key="candidate"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={appleTransition(0.4)}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
                      Know your score before recruiters do.
                    </h3>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">
                      Upload your resume, analyze fit against target roles, identify critical skill gaps, and optimize your application strategy before applying.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {candidatesData.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCandidateIdx(idx)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                          activeCandidateIdx === idx
                            ? 'bg-violet-700 text-white shadow-sm hover:-translate-y-0.5'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5'
                        }`}
                      >
                        {c.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{candidate.name}</h4>
                        <p className="text-xs font-bold text-violet-700 mt-0.5">{candidate.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {candidate.description}
                    </p>
                    {candidate.gaps.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-rose-600">Gaps:</span>
                        {candidate.gaps.map((g, i) => (
                          <span key={i} className="text-[11px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-0.5 rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold pt-1">
                        <CheckCircle2 className="w-4 h-4" /> Zero Skill Gaps Detected
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900">Experience Weight: {expWeight}%</span>
                      <span className="text-slate-500">Skills Weight: {skillWeight}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={expWeight}
                      onChange={(e) => setExpWeight(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-700"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-10 md:p-12 flex flex-col items-center justify-center text-center shadow-md">
                  <span className="mb-8 text-xs font-extrabold uppercase tracking-wider text-slate-400">Match score gauge</span>
                  
                  <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="112" cy="112" r={radius} className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                      <motion.circle
                        cx="112"
                        cy="112"
                        r={radius}
                        className="stroke-violet-600"
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-7xl font-display font-extrabold text-slate-950 leading-none">
                        <AnimatedScore value={suitabilityScore} />
                      </span>
                    </div>
                  </div>

                  <div className="w-full max-w-xs mx-auto">
                    {suitabilityScore >= 85 ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 rounded-xl text-sm font-bold shadow-xs">
                        <CheckCircle2 className="w-5 h-5" /> Excellent Match
                      </div>
                    ) : suitabilityScore >= 70 ? (
                      <div className="flex items-center justify-center gap-2 text-violet-700 bg-violet-50 border border-violet-200 py-2.5 rounded-xl text-sm font-bold shadow-xs">
                        <Check className="w-5 h-5" /> Strong Match
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 py-2.5 rounded-xl text-sm font-bold shadow-xs">
                        <AlertOctagon className="w-5 h-5" /> Marginal Fit
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {workspaceTab === 'sectors' && (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={appleTransition(0.4)}
                className="space-y-8"
              >
                {/* Sector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SECTOR_SHOWCASE.map((sec, idx) => {
                    const Icon = sec.icon
                    const isSelected = activeSectorIdx === idx
                    return (
                      <motion.button
                        key={sec.id}
                        onClick={() => setActiveSectorIdx(idx)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-white border-violet-400 shadow-md ring-2 ring-violet-500/20'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 rounded-xl border ${sec.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${sec.color}`}>
                            {sec.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{sec.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{sec.title}</p>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Selected Sector Detail Card */}
                {(() => {
                  const currentSec = SECTOR_SHOWCASE[activeSectorIdx]
                  const Icon = currentSec.icon
                  return (
                    <motion.div
                      key={currentSec.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border border-slate-200 bg-white p-7 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${currentSec.color}`}>
                            {currentSec.name}
                          </span>
                          <span className="text-xs font-bold text-slate-400">• {currentSec.branch}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-950">{currentSec.title}</h3>
                        <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-violet-600" />
                          {currentSec.org}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {currentSec.skills.map((skill) => (
                            <span key={skill} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 space-y-3">
                        <div className="text-xs font-extrabold uppercase text-slate-400">Package / Stipend</div>
                        <div className="text-2xl font-black text-emerald-600">{currentSec.package}</div>
                        <Link
                          href="/auth?mode=signup"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-700 text-white font-bold rounded-xl shadow-md hover:bg-violet-800 transition-all hover:-translate-y-0.5 text-xs"
                        >
                          <span>Apply & Evaluate Fit</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section id="how-it-works" className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center py-16 lg:py-20 relative overflow-hidden bg-white scroll-mt-16 section-divider">
        <div className="section-glow-seam pointer-events-none absolute left-1/2 top-12 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        <FloatingIcons count={4} />

        <SectionReveal className="max-w-7xl mx-auto px-6 w-full relative z-10 space-y-8 lg:space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="section-kicker-glow inline-flex bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-xs">
              Decision Protocol
            </div>
            <h2 className="section-title-glow text-4xl md:text-5xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
              How We Reach Decisions
            </h2>
            <p className="section-copy-drift text-base text-slate-500 leading-relaxed font-medium">
              We replace black-box models with a multi-stage consensus pipeline. Hover a stage to inspect the underlying reasoning logic.
            </p>
          </div>

          <SectionReveal variant="stagger" className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(124,58,237,0.12)] overflow-hidden" delay={80}>
            {[
              { num: '01', title: 'Requirement Analysis', role: 'Deconstructs natural language JDs into deterministic assessment parameters.', icon: Search, colorClass: 'text-violet-600', bgClass: 'bg-violet-50' },
              { num: '02', title: 'Rubric Strategy', role: 'Sets weight distributions for experience, skills, proof quality, and role level.', icon: Sliders, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50' },
              { num: '03', title: 'Evidence Extraction', role: 'Maps resume timelines, projects, claims, and ownership signals into reviewable evidence.', icon: Cpu, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
              { num: '04', title: 'Score Evaluation', role: 'Scores candidates directly against the rubric instead of keyword density.', icon: Award, colorClass: 'text-amber-600', bgClass: 'bg-amber-50' },
              { num: '05', title: 'Self-Critique', role: 'Challenges inflated claims, missing proofs, timeline gaps, and unsupported assumptions.', icon: ShieldAlert, colorClass: 'text-rose-600', bgClass: 'bg-rose-50' },
              { num: '06', title: 'Consensus Verdict', role: 'Publishes a tamper-evident recommendation with disagreements and confidence visible.', icon: Users, colorClass: 'text-slate-700', bgClass: 'bg-slate-50' },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="group grid gap-4 border-b border-slate-200/80 px-5 py-5 transition-all duration-300 hover:translate-x-1.5 hover:bg-violet-50/40 last:border-b-0 md:grid-cols-[72px_1fr_52px] md:items-center md:px-7"
                >
                  <div className="text-sm font-black tracking-tight text-slate-400 group-hover:text-violet-600 transition-colors">{step.num}</div>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-950 group-hover:text-violet-950 transition-colors">{step.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{step.role}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 ${step.bgClass} shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon className={`h-5 w-5 ${step.colorClass}`} />
                  </div>
                </div>
              )
            })}
          </SectionReveal>
        </SectionReveal>
      </section>

      {/* SECTION 5: CTA */}
      <section id="cta" className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center py-16 lg:py-20 relative overflow-hidden bg-white scroll-mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08),transparent_70%)]" />

        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col justify-center relative z-10 space-y-8 lg:space-y-10">
          <SectionReveal className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-tight text-slate-950">
              Ready to transform your hiring?
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              Create a free account or sign in to access your workspace. No credit card required.
            </p>
          </SectionReveal>

          <SectionReveal className="flex flex-col sm:flex-row items-center justify-center gap-4" delay={120}>
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/auth?mode=signup" className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-violet-900 text-white font-bold rounded-xl hover:bg-violet-800 shadow-[0_12px_24px_rgba(124,58,237,0.22)] hover:shadow-[0_16px_32px_rgba(124,58,237,0.28)] transition-all duration-300">
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/auth?mode=signin" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold rounded-xl shadow-sm transition-all duration-300">
                <span>Sign In</span>
              </Link>
            </motion.div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            delay={240}
          >
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/80 rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-violet-300"
            >
              <div className="w-12 h-12 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-violet-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">Recruiter Workspace</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Define evaluation rubrics, upload multiple resumes, inspect security hashes, and download forensic reports.</p>
              <Link href="/recruiter" className="text-violet-700 font-bold text-sm flex items-center gap-2 group">
                Enter Recruiter Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/80 rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-violet-300"
            >
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center mb-6">
                <User className="w-6 h-6 text-indigo-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">Candidate Workspace</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Identify alignment leaks, formatting blocks, verify skill matches, and optimize credentials before applying.</p>
              <Link href="/candidate" className="text-indigo-700 font-bold text-sm flex items-center gap-2 group">
                Enter Candidate Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </SectionReveal>
        </div>
      </section>
    </div>
  )
}
