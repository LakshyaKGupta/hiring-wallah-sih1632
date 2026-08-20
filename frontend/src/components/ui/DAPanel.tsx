'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldCheck, ChevronDown, Scale, FileWarning } from 'lucide-react'
import { appleTransition } from '@/lib/motion'
interface Claim {
  original_claim: string
  counter: string
  severity: 'low' | 'medium' | 'high' | string
}

interface DAPanelProps {
  claims: Claim[]
  riskFactors: string[]
  confidenceAdjustment: number
  recommendation: string
}

export default function DAPanel({ claims, riskFactors, confidenceAdjustment, recommendation }: DAPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-rose-600 border-rose-200 bg-rose-50'
      case 'medium': return 'text-amber-600 border-amber-200 bg-amber-50'
      default: return 'text-slate-500 border-slate-200 bg-slate-50'
    }
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={appleTransition(0.3)}
      className="border border-slate-200 bg-white rounded-xl p-5 relative overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 tracking-tight">
              Risk Analysis
            </h3>
            {claims.length > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {claims.length} risks detected
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-mono font-semibold text-slate-700">{confidenceAdjustment} pts</span>
          <span className="text-xs text-slate-500 block">Confidence Adj.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Adjusted Recommendation</span>
          </div>
          <span className={`text-sm font-semibold ${recommendation.toLowerCase() === 'approve' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {recommendation}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <FileWarning className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Contested Claims</span>
          </div>
          <span className="text-sm font-semibold text-slate-700">{claims.length} detected</span>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-semibold text-slate-900 block">
          Challenged Evidence
        </span>

        {claims.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 border border-emerald-200 bg-emerald-50 p-3 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>No risks detected. Claims are fully evidence-backed.</span>
          </div>
        ) : (
          claims.map((claim, idx) => {
            const isExpanded = expandedIndex === idx
            return (
              <div
                key={idx}
                className={`border rounded-lg bg-white transition-all duration-200 ${isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}
              >
                <div
                  onClick={() => toggleExpand(idx)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(claim.severity)}`}>
                      {claim.severity}
                    </span>
                    <p className="text-sm font-medium text-slate-800 truncate">{claim.original_claim}</p>
                  </div>
                  <div className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-slate-100 bg-slate-50 text-sm space-y-3">
                        <div>
                          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Original Claim</span>
                          <p className="text-slate-700">{claim.original_claim}</p>
                        </div>
                        <div>
                          <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block mb-1">Risk Counter-Evidence</span>
                          <p className="text-slate-900 font-medium">{claim.counter}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>

      {riskFactors.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <span className="text-sm font-semibold text-slate-900 block mb-3">
            Critical Risk Factors
          </span>
          <ul className="space-y-2">
            {riskFactors.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
