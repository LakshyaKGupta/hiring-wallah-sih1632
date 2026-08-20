'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Building2,
  Briefcase,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Compass,
  Users,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface SummaryKPIs {
  total_opportunities: number
  govt_opportunities: number
  private_opportunities: number
  overseas_opportunities: number
  internships_and_trainings: number
  total_student_applications: number
  active_counselors: number
  active_industry_mentors: number
  counseling_sessions_held: number
}

interface BranchDemandItem {
  branch: string
  active_openings: number
  demand_index: number
  top_demanded_skills: string[]
}

interface SectorDistributionItem {
  sector_key: string
  sector_name: string
  openings_count: number
  percentage: number
}

interface MissingSkillItem {
  skill_name: string
  frequency_in_demand: number
  impact_factor: string
}

interface SupplyDemandGapItem {
  branch: string
  demand_openings: number
  training_capacity_openings: number
  supply_status: string
  policy_recommendation: string
}

interface MetricDefinition {
  metric_name: string
  data_source: string
  calculation_formula: string
  time_period: string
  limitations: string
}

interface AnalyticsData {
  department: string
  dataset_metadata: {
    dataset_label: string
    coverage: string
    source: string
    last_synced: string
  }
  summary_kpis: SummaryKPIs
  branch_demand: BranchDemandItem[]
  sector_distribution: SectorDistributionItem[]
  top_missing_skills: MissingSkillItem[]
  supply_demand_gaps: SupplyDemandGapItem[]
  institutional_readiness_status: string
  metric_definitions: MetricDefinition[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function GovernmentAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/analytics/technical-education`)
      if (!res.ok) throw new Error('Failed to load government analytics')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Error fetching analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Technical Education Department • Govt. of Rajasthan
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                SIH1632 Decision Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Statewide Technical Education & Skill Demand Observatory
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Live database-computed demand signals, polytechnic supply metrics, and workforce deployment analytics for Rajasthan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-bg-surface hover:border-accent-primary/30 text-text-secondary hover:text-text-primary transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Observatory
            </button>
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-lg shadow-accent-primary/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              SIH Demo Mode
            </Link>
          </div>
        </div>

        {/* Dataset Transparency Notice */}
        {data?.dataset_metadata && (
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Dataset Status:</strong> {data.dataset_metadata.dataset_label} • Computed dynamically from active platform database records.
              </span>
            </div>
            <div className="text-text-tertiary text-[11px]">
              Coverage: {data.dataset_metadata.coverage}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-bg-surface border border-border-subtle" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-surface relative overflow-hidden">
                <div className="flex items-center justify-between text-text-tertiary mb-2">
                  <span className="text-xs font-medium">Total Opportunities</span>
                  <Briefcase className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {data.summary_kpis.total_opportunities}
                </div>
                <div className="text-[11px] text-text-tertiary mt-1">
                  Active across Rajasthan portals
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-surface relative overflow-hidden">
                <div className="flex items-center justify-between text-text-tertiary mb-2">
                  <span className="text-xs font-medium">Govt & PSU Roles</span>
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  {data.summary_kpis.govt_opportunities}
                </div>
                <div className="text-[11px] text-text-tertiary mt-1">
                  RVUNL, RPSC, State Infra
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-surface relative overflow-hidden">
                <div className="flex items-center justify-between text-text-tertiary mb-2">
                  <span className="text-xs font-medium">Training & Internships</span>
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">
                  {data.summary_kpis.internships_and_trainings}
                </div>
                <div className="text-[11px] text-text-tertiary mt-1">
                  Polytechnic apprenticeships
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-surface relative overflow-hidden">
                <div className="flex items-center justify-between text-text-tertiary mb-2">
                  <span className="text-xs font-medium">Student Applications</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {data.summary_kpis.total_student_applications}
                </div>
                <div className="text-[11px] text-text-tertiary mt-1">
                  Verified candidate submissions
                </div>
              </div>
            </div>

            {/* Grid Row 2: Branch Demand & Sector Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Branch Demand Index (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-border-subtle bg-bg-surface space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent-primary" />
                      Technical Branch Demand Matrix
                    </h2>
                    <p className="text-xs text-text-tertiary">
                      Calculated from active Rajasthan vacancies and employer specifications.
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-bg-deep border border-border-subtle text-text-tertiary">
                    Relative Index 0–100
                  </span>
                </div>

                <div className="space-y-4">
                  {data.branch_demand.map((item, idx) => (
                    <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-bg-deep/60 border border-border-subtle/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-primary">{item.branch}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-text-tertiary">{item.active_openings} openings</span>
                          <span className="font-mono font-bold text-accent-primary">{item.demand_index}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-bg-surface overflow-hidden border border-border-subtle/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.demand_index}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-accent-primary/80 to-accent-primary rounded-full"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.top_demanded_skills.map((skill, sIdx) => (
                          <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-text-secondary">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Distribution (1 Col) */}
              <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Opportunity Sector Share
                  </h2>
                  <p className="text-xs text-text-tertiary">
                    Distribution of active openings across state governance tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  {data.sector_distribution.map((sec, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-bg-deep/60 border border-border-subtle/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-primary">{sec.sector_name}</span>
                        <span className="font-mono font-bold text-text-primary">{sec.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-bg-surface overflow-hidden">
                        <div
                          style={{ width: `${sec.percentage}%` }}
                          className="h-full bg-emerald-400 rounded-full"
                        />
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        {sec.openings_count} active vacancies
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Grid Row 3: Missing Skills Frequency & Supply-Demand Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top In-Demand Skills in Rajasthan */}
              <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Top Skill Demands in Rajasthan
                  </h2>
                  <p className="text-xs text-text-tertiary">
                    Most frequently required technical competencies across active opportunities.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.top_missing_skills.map((sk, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-bg-deep/60 border border-border-subtle/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">{sk.skill_name}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                          {sk.frequency_in_demand} jobs
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary">{sk.impact_factor}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supply vs Demand Policy Signals */}
              <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Supply-Demand Deficit & Policy Recommendations
                  </h2>
                  <p className="text-xs text-text-tertiary">
                    Actionable capacity signals for Rajasthan Technical Education planning.
                  </p>
                </div>

                <div className="space-y-3">
                  {data.supply_demand_gaps.map((gap, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-bg-deep/60 border border-border-subtle/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-primary">{gap.branch}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          gap.supply_status.includes('High Deficit')
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : gap.supply_status.includes('Moderate')
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {gap.supply_status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {gap.policy_recommendation}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary pt-1 border-t border-border-subtle/30">
                        <span>Active Demand: {gap.demand_openings}</span>
                        <span>Training Capacity: {gap.training_capacity_openings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Metric Definitions & Methodology Transparency (SIH1632 Rigor) */}
            <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-text-tertiary" />
                    Documented Metric Methodology & Governance
                  </h2>
                  <p className="text-xs text-text-tertiary">
                    Every metric on Hiring Wallah has an explicit mathematical definition and limitation boundary.
                  </p>
                </div>
                <span className="text-xs text-text-tertiary font-mono">No Black-Box Numbers</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.metric_definitions.map((def, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-bg-deep/60 border border-border-subtle/50 space-y-2 text-xs">
                    <div className="font-semibold text-text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary" />
                      {def.metric_name}
                    </div>
                    <div className="space-y-1 text-text-secondary text-[11px]">
                      <div><strong>Formula:</strong> <code className="text-accent-primary">{def.calculation_formula}</code></div>
                      <div><strong>Source:</strong> {def.data_source}</div>
                      <div><strong>Period:</strong> {def.time_period}</div>
                      <div className="text-text-tertiary"><strong>Limitations:</strong> {def.limitations}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        ) : null}

      </div>
    </div>
  )
}
