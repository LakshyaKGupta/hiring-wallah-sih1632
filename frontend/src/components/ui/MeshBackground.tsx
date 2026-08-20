'use client'

import React from 'react'

interface MeshBackgroundProps {
  opacity?: number
  className?: string
  fixed?: boolean
  mode?: 'full' | 'grid-only'
  showGrid?: boolean
}

export default function MeshBackground({
  opacity = 0.2,
  className = '',
  fixed = false,
  mode = 'full',
  showGrid = false,
}: MeshBackgroundProps) {
  const positionClass = fixed ? 'fixed inset-0' : 'absolute inset-0'

  if (mode === 'grid-only') {
    return (
      <div
        className={`${positionClass} overflow-hidden pointer-events-none z-0 ${className}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 grid-bg pointer-events-none"
          style={{ opacity }}
        />
      </div>
    )
  }

  return (
    <div
      className={`${positionClass} overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden
    >
      {/* Ultra-lightweight, hardware-accelerated CSS ambient mesh gradient (0 CPU overhead) */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.06)_0%,transparent_70%)] blur-2xl transform-gpu pointer-events-none"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)] blur-2xl transform-gpu pointer-events-none"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_70%)] blur-2xl transform-gpu pointer-events-none"
        style={{ willChange: 'transform' }}
      />

      {/* Optional subtle grid overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 grid-bg pointer-events-none"
          style={{ opacity }}
        />
      )}
    </div>
  )
}
