'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 3D rotating icon mesh (procedural)
function RotatingIcon3D({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.008
      meshRef.current.rotation.y += 0.012
      meshRef.current.rotation.z += 0.004
    }
  })

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <octahedronGeometry args={[0.5, 2]} />
        <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  )
}

interface Flip3DCardProps {
  title: string
  subtitle: string
  frontIcon: string
  backContent: string
  color: string
  index: number
}

export function Flip3DCard({
  title,
  subtitle,
  backContent,
  color,
  index,
}: Flip3DCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className="h-[400px] cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
        style={{ transformStyle: 'preserve-3d' } as React.CSSProperties}
        className="w-full h-full relative"
      >
        {/* Front side */}
        <div
          style={{ backfaceVisibility: 'hidden', borderColor: color } as React.CSSProperties}
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-blue-50 border-2 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg"
        >
          {/* 3D Icon Canvas */}
          <div className="w-24 h-24 mb-6">
            <Canvas
              camera={{ position: [0, 0, 2.5], fov: 50 }}
              dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
            >
              <ambientLight intensity={0.7} />
              <pointLight position={[5, 5, 5]} intensity={0.8} color={color} />
              <React.Suspense fallback={null}>
                <RotatingIcon3D color={color} />
              </React.Suspense>
            </Canvas>
          </div>

          <h3 className="text-2xl font-bold text-text-primary mb-2 text-center">{title}</h3>
          <p className="text-text-secondary text-center text-sm">{subtitle}</p>
        </div>

        {/* Back side */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderColor: color } as React.CSSProperties}
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border-2 rounded-2xl p-8 flex flex-col justify-center shadow-lg"
        >
          <div className="text-xs font-mono text-green-400 space-y-2 mb-4">
            <div className="text-green-500/70">{'// Reasoning Logic'}</div>
            <div className="text-white/60">→ {backContent}</div>
          </div>
          <div className="flex-1 flex items-center">
            <p className="text-sm text-white/80 italic">
              &quot;Every decision is transparent, verifiable, and backed by evidence.&quot;
            </p>
          </div>
          <div className="text-center text-xs text-white/40 mt-4">
            [Hover to reveal back]
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface Feature3DCardSectionProps {
  title: string
}

export function Feature3DCardSection({ title }: Feature3DCardSectionProps) {
  const features = [
    {
      title: 'Forensic Parsing',
      subtitle: 'Evidence Extraction',
      frontIcon: 'document',
      backContent: 'PARSER: Stripped 3 formatting layers, extracted 5 core skills, verified work dates',
      color: '#0067FF',
    },
    {
      title: 'Transparent Reasoning',
      subtitle: 'Every Step Logged',
      frontIcon: 'reasoning',
      backContent: 'EVALUATOR: Matched 92/100 on React expertise, assessed autonomy level',
      color: '#9D4EDD',
    },
    {
      title: 'Consensus Ledger',
      subtitle: 'Immutable Audit Trail',
      frontIcon: 'ledger',
      backContent: 'COMMITTEE: 6/6 agents voted. Consensus reached. SHA-256 fingerprinted & verified.',
      color: '#10A45E',
    },
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-text-primary mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-text-secondary">
            Hover over each card to reveal the reasoning behind our approach
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Flip3DCard key={idx} {...feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}
