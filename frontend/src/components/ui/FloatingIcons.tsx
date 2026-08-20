'use client'

import React, { useMemo } from 'react'
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Award,
  Compass,
  Binary,
  Target,
  Zap,
} from 'lucide-react'

const iconsList = [
  ShieldCheck,
  Cpu,
  Award,
  Target,
  CheckCircle2,
  Binary,
  Compass,
  Zap,
  Sparkles,
  FileText,
]

interface FloatingNodeConfig {
  id: number
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  x: string
  y: string
  scale: number
  opacity: number
  delay: number
  duration: number
  xDrift: number[]
  yDrift: number[]
  rotateDrift: number[]
}

function seededValue(seed: number) {
  const value = Math.sin(seed * 9301 + 49297) * 233280
  return value - Math.floor(value)
}

function rounded(value: number, precision = 3) {
  return Number(value.toFixed(precision))
}

function createConfig(index: number): FloatingNodeConfig {
  const Icon = iconsList[index % iconsList.length]
  const xPercent = rounded(seededValue(index * 7 + 1) * 92 + 4)
  const yPercent = rounded(seededValue(index * 13 + 11) * 88 + 6)
  const xSign = seededValue(index + 21) > 0.5 ? 1 : -1
  const ySign = seededValue(index + 31) > 0.5 ? 1 : -1
  const rotateSign = seededValue(index + 41) > 0.5 ? 1 : -1

  return {
    id: index,
    Icon,
    x: `${Math.max(4, Math.min(94, xPercent))}%`,
    y: `${Math.max(5, Math.min(92, yPercent))}%`,
    scale: rounded(0.7 + seededValue(index + 51) * 0.35),
    opacity: rounded(0.08 + seededValue(index + 61) * 0.12),
    delay: rounded(seededValue(index + 71) * 6),
    duration: rounded(16 + seededValue(index + 81) * 12),
    xDrift: [0, rounded(xSign * (14 + seededValue(index + 91) * 20)), 0],
    yDrift: [0, rounded(ySign * (18 + seededValue(index + 101) * 24)), 0],
    rotateDrift: [0, rounded(rotateSign * (10 + seededValue(index + 111) * 14)), 0],
  }
}

export default function FloatingIcons({
  count = 6,
  className = '',
}: {
  count?: number
  className?: string
}) {
  const configs = useMemo(
    () => Array.from({ length: count }).map((_, index) => createConfig(index)),
    [count],
  )

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 select-none ${className}`}>
      {configs.map((config) => {
        const { Icon } = config

        return (
          <div
            key={config.id}
            className="floating-icon-drift absolute text-slate-400 will-change-transform"
            style={{
              left: config.x,
              top: config.y,
              opacity: config.opacity,
              '--float-scale': config.scale,
              '--float-x': `${config.xDrift[1]}px`,
              '--float-y': `${config.yDrift[1]}px`,
              '--float-rotate': `${config.rotateDrift[1]}deg`,
              animationDelay: `${config.delay * -1}s`,
              animationDuration: `${config.duration * 1.3}s`,
            } as React.CSSProperties}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-slate-500" strokeWidth={1.5} />
          </div>
        )
      })}
    </div>
  )
}
