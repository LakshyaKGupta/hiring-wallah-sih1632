'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Building2,
  GraduationCap,
  Briefcase,
  Compass,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart3,
  Flame,
  FileText,
  ExternalLink,
  ChevronRight,
  Terminal
} from 'lucide-react'

interface DemoStep {
  stepNumber: number
  title: string
  subtitle: string
  badge: string
  description: string
  highlights: string[]
  narrativePersona: {
    name: string
    role: string
    college: string
    goal: string
  }
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Candidate Profile & Education Grounding',
    subtitle: 'From Diploma in Jodhpur to State Technical Workforce',
    badge: 'Step 1: Student Foundation',
    description:
      'Meet Lakshya Sharma, a 3rd-year Electrical Engineering Polytechnic Diploma student at Govt. Polytechnic College Jodhpur. Rather than getting filtered out by keyword-only ATS systems, his practical solar microgrid simulation and laboratory coursework are extracted as structured evidence.',
    highlights: [
      'Polytechnic Diploma in Electrical Engineering (Jodhpur, Rajasthan)',
      'Verified coursework: Power Systems, MATLAB, Circuit Design',
      'Laboratory project: Solar Microgrid Simulation & Grid Telemetry',
      'Zero keyword stuffing — verified evidence ingestion'
    ],
    narrativePersona: {
      name: 'Lakshya Sharma',
      role: 'Electrical Diploma Graduate',
      college: 'Govt. Polytechnic College, Jodhpur',
      goal: 'Assistant Engineer / Renewable Grid Specialist'
    },
    primaryAction: {
      label: 'Explore Unified Opportunities',
      href: '/opportunities?branch=Electrical'
    },
    secondaryAction: {
      label: 'View Candidate Dashboard',
      href: '/candidate'
    }
  },
  {
    stepNumber: 2,
    title: 'Unified Opportunity Discovery (SIH1632 Core)',
    subtitle: 'Eliminating Fragmentation Across Rajasthan State Ecosystems',
    badge: 'Step 2: Unified Discovery',
    description:
      'Instead of checking 10 separate portals, Lakshya discovers private tech jobs, Rajasthan State PSUs (RVUNL, RPSC), Bhadla Solar Park operations, AICTE state internships, and overseas training in Japan TITP in one verified hub.',
    highlights: [
      'Rajasthan State Govt (RVUNL Junior Engineer Electrical)',
      'Private Industry (Larsen & Toubro Solar Infrastructure)',
      'Industrial Training (Kota Substation Automation Training)',
      'Overseas Mobility (Japan TITP Electrical Apprenticeship)'
    ],
    narrativePersona: {
      name: 'Lakshya Sharma',
      role: 'Applicant',
      college: 'Govt. Polytechnic College, Jodhpur',
      goal: 'Discovering verified state vacancies'
    },
    primaryAction: {
      label: 'Open Opportunities Hub',
      href: '/opportunities'
    },
    secondaryAction: {
      label: 'Check Expired Deadline Rules',
      href: '/opportunities'
    }
  },
  {
    stepNumber: 3,
    title: 'Explainable Matchmaking & Next Best Action',
    subtitle: 'Transparent Scoring Formula & Dynamic Opportunity Unlocks',
    badge: 'Step 3: Explainable Intelligence',
    description:
      'Lakshya receives an explainable fit score derived from the documented formula: Overall = (Skills × 40%) + (Branch × 20%) + (Qualification × 20%) + (Location × 10%) + (Career Goal × 10%). The system flags that mastering SCADA & PLC unlocks 3 additional state power grid roles.',
    highlights: [
      'Multi-factor transparent match formula (zero opaque black-box weights)',
      'Positive matching signals: Polytechnic qualification matched (100%)',
      'Dynamic Next Best Action: Bridge SCADA/PLC missing skill',
      'Database-computed opportunity unlock impact'
    ],
    narrativePersona: {
      name: 'Lakshya Sharma',
      role: 'Matched Candidate',
      college: 'Govt. Polytechnic College, Jodhpur',
      goal: 'Skill Gap & Career Roadmap'
    },
    primaryAction: {
      label: 'View Candidate Roadmap',
      href: '/candidate?tab=skillgap'
    },
    secondaryAction: {
      label: 'Explore AI Copilot',
      href: '/counseling?tab=copilot'
    }
  },
  {
    stepNumber: 4,
    title: 'State Counseling & Industry Mentorship',
    subtitle: 'Human Guidance & AI Career Copilot for Rajasthan Students',
    badge: 'Step 4: Counseling & Mentorship',
    description:
      'Lakshya connects with certified Rajasthan Technical Education career counselors for LEET lateral entry advice, and books an industry mentorship session with a Senior Renewable Grid Consultant at Bhadla Solar Park.',
    highlights: [
      'Official Rajasthan state counselors for polytechnic pathways',
      'Industry mentors from RVUNL, Tata Power, and Solar Parks',
      'AI Career Copilot trained on Rajasthan technical curriculum',
      'State department guidance handbooks and LEET roadmaps'
    ],
    narrativePersona: {
      name: 'Lakshya Sharma',
      role: 'Mentee',
      college: 'Govt. Polytechnic College, Jodhpur',
      goal: 'Securing State Grid Guidance'
    },
    primaryAction: {
      label: 'Open Counseling Hub',
      href: '/counseling'
    },
    secondaryAction: {
      label: 'Connect with Mentors',
      href: '/mentorship'
    }
  },
  {
    stepNumber: 5,
    title: '6-Agent Multi-Agent Forensic Recruiter Evaluation',
    subtitle: 'From Requirement Analyst to Hiring Committee & Devil\'s Advocate',
    badge: 'Step 5: 6-Agent AI Evaluation',
    description:
      'When RVUNL recruiters review Lakshya\'s application, 6 specialized AI agents evaluate his evidence. Agent 5 (Devil\'s Advocate) challenges unverified claims, while Agent 6 (Hiring Committee) computes calibrated consensus. If AI is offline, deterministic fallback engages without crashing.',
    highlights: [
      'Agent 1 (Requirement Analyst) & Agent 2 (Hiring Strategist) build rubric',
      'Agent 3 (Forensic Investigator) extracts structured claim graph',
      'Agent 4 (Evaluator) scores evidence against criteria',
      'Agent 5 (Devil\'s Advocate) stress-tests tenure & unsupported claims',
      'Agent 6 (Committee) delivers calibrated hire recommendation'
    ],
    narrativePersona: {
      name: 'RVUNL Hiring Panel',
      role: 'Recruiter Workspace',
      college: 'Rajasthan State Power Authority',
      goal: 'Evidence-Based Candidate Decision'
    },
    primaryAction: {
      label: 'Explore Recruiter Workspace',
      href: '/recruiter/dashboard'
    },
    secondaryAction: {
      label: 'View Candidate Compare Mode',
      href: '/recruiter/jobs'
    }
  },
  {
    stepNumber: 6,
    title: 'SHA-256 Tamper-Proof Audit & State Governance Observatory',
    subtitle: 'Cryptographic Integrity & Policy-Level Capacity Planning',
    badge: 'Step 6: Integrity & Governance',
    description:
      'Every hiring audit report generates a canonical SHA-256 integrity fingerprint that instantly flags manual tampering. Meanwhile, the Technical Education Department Observatory tracks statewide branch demand, missing skills, and supply-demand deficits.',
    highlights: [
      'SHA-256 cryptographic audit fingerprint on all decision reports',
      'Tamper-evident verification against backend canonical hash',
      'Live Observatory computing branch demand & sector distribution',
      'Supply-demand deficit signals guiding polytechnic seat allocations'
    ],
    narrativePersona: {
      name: 'Director of Technical Education',
      role: 'State Governance',
      college: 'Govt. of Rajasthan',
      goal: 'Workforce Planning & Observability'
    },
    primaryAction: {
      label: 'Open Government Observatory',
      href: '/analytics'
    },
    secondaryAction: {
      label: 'Back to Home',
      href: '/'
    }
  }
]

export default function DemoPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const currentStep = DEMO_STEPS[activeStepIndex]

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Smart India Hackathon • Problem Statement SIH1632
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            End-to-End Rajasthan Technical Education Demo
          </h1>
          <p className="text-sm text-text-secondary">
            Follow the complete intelligence loop from student education to opportunity discovery, explainable matchmaking, state counseling, 6-agent AI evaluation, and government analytics.
          </p>
        </div>

        {/* Step Progression Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-border-subtle pb-4">
          {DEMO_STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex
            const isCompleted = idx < activeStepIndex
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary shadow-sm'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                    : 'border-border-subtle bg-bg-surface text-text-tertiary hover:border-border-subtle/80 hover:text-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase">
                    Step 0{step.stepNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  ) : null}
                </div>
                <div className="text-xs font-bold truncate">
                  {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Step Presentation Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.stepNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-border-subtle bg-bg-surface p-6 sm:p-8 shadow-sm space-y-8"
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border-subtle pb-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold text-xs">
                  {currentStep.badge}
                </span>
                <h2 className="text-2xl font-bold text-text-primary">
                  {currentStep.title}
                </h2>
                <p className="text-sm font-semibold text-text-secondary">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Persona Pill */}
              <div className="p-3 rounded-2xl border border-border-subtle bg-bg-deep/80 text-xs space-y-1 sm:text-right shrink-0">
                <div className="font-bold text-text-primary">{currentStep.narrativePersona.name}</div>
                <div className="text-[11px] text-text-tertiary">{currentStep.narrativePersona.role}</div>
                <div className="text-[11px] text-accent-primary">{currentStep.narrativePersona.college}</div>
              </div>
            </div>

            {/* Step Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Narrative Text & Highlights */}
              <div className="space-y-6">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {currentStep.description}
                </p>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Key Features in this Step:
                  </span>
                  <ul className="space-y-2">
                    {currentStep.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interactive Action Hub */}
              <div className="p-6 rounded-2xl border border-accent-primary/20 bg-accent-primary/5 space-y-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent-primary uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" /> Live Platform Interaction
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Experience this workflow live in the product
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Every step in this walkthrough is fully implemented and backed by real database data and verified endpoints.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Link
                    href={currentStep.primaryAction.href}
                    className="w-full py-3 rounded-xl bg-accent-primary text-black font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20"
                  >
                    <span>{currentStep.primaryAction.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {currentStep.secondaryAction && (
                    <Link
                      href={currentStep.secondaryAction.href}
                      className="w-full py-2.5 rounded-xl border border-border-subtle bg-bg-surface hover:bg-bg-deep text-text-secondary text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      <span>{currentStep.secondaryAction.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-text-tertiary" />
                    </Link>
                  )}
                </div>
              </div>

            </div>

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
              <button
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
              </button>

              <div className="text-xs text-text-tertiary font-mono">
                Step {currentStep.stepNumber} of {DEMO_STEPS.length}
              </div>

              <button
                onClick={() => setActiveStepIndex((prev) => Math.min(DEMO_STEPS.length - 1, prev + 1))}
                disabled={activeStepIndex === DEMO_STEPS.length - 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-black hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  )
}
