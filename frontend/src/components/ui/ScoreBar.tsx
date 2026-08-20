'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

interface ScoreBarProps {
  label: string
  score: number
  max?: number
  color?: string
  index?: number
}

export default function ScoreBar({ label, score, max = 100, color = 'bg-slate-800' }: ScoreBarProps) {
  const percent = Math.min(100, Math.max(0, (score / max) * 100))

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-slate-400" />
          {label.replace('_', ' ')}
        </span>
        <span className="text-xs font-bold text-slate-900">
          {score} <span className="text-slate-400 font-normal">/ {max}</span>
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}
