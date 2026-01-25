'use client'

import { Canvas } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { ParticleField } from './ParticleField'

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

export function ParticleBackground() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const starCount = useMemo(() => (prefersReducedMotion ? 320 : 1600), [prefersReducedMotion])
  const sparkleCount = useMemo(() => (prefersReducedMotion ? 20 : 180), [prefersReducedMotion])
  const sparkleSpeed = prefersReducedMotion ? 0.2 : 0.7

  if (!isMounted) {
    return null
  }

  return (
    <div className="particle-background">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#0b1020', 6, 24]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[6, 4, 8]} intensity={0.5} color="#93c5fd" />
        <pointLight position={[-6, -4, 6]} intensity={0.35} color="#f472b6" />
        <Stars
          radius={100}
          depth={60}
          count={starCount}
          factor={4}
          saturation={0}
          fade
          speed={0.35}
        />
        <ParticleField
          count={prefersReducedMotion ? 320 : 1400}
          radius={14}
          size={prefersReducedMotion ? 0.05 : 0.08}
          speed={0.08}
          drift={0.5}
          colorStart="#60a5fa"
          colorEnd="#f472b6"
          opacity={0.45}
        />
        <ParticleField
          count={prefersReducedMotion ? 120 : 600}
          radius={9}
          size={prefersReducedMotion ? 0.06 : 0.11}
          speed={0.16}
          drift={0.4}
          colorStart="#38bdf8"
          colorEnd="#818cf8"
          opacity={0.7}
        />
        <Sparkles
          count={sparkleCount}
          speed={sparkleSpeed}
          opacity={0.6}
          color="#7dd3fc"
          size={prefersReducedMotion ? 1 : 1.4}
          scale={[10, 10, 10]}
          noise={[1, 2, 1]}
        />
      </Canvas>
      <div className="particle-vignette" />
      <div className="particle-glow" />
    </div>
  )
}
