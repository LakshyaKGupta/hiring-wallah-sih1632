'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Target } from 'lucide-react'

interface VerdictRevealProps {
  verdict: 'Strong Hire' | 'Consider' | 'Reject' | string
  confidence: number
  explanation: string
  jobTitle?: string
}

export default function VerdictReveal({ verdict, confidence, explanation, jobTitle }: VerdictRevealProps) {
  const config = {
    'Strong Hire': {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    'Consider': {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
    },
    'Reject': {
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: XCircle,
    },
  }[verdict] || {
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Sparkles,
  }

  const VerdictIcon = config.icon

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl w-full p-5 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Recommendation {jobTitle ? `for ${jobTitle}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${config.bg} ${config.border} ${config.color}`}>
              <VerdictIcon className="w-5 h-5" />
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${config.color}`}>
              {verdict}
            </h2>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-2xl font-bold text-slate-900">{confidence}</span>
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </div>
          <span className="text-xs font-medium text-slate-500">Confidence</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-2">
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {explanation}
        </p>
      </div>
    </div>
  )
}
