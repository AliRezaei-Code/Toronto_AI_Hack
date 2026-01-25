'use client'

import { Canvas } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'

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

  const starCount = useMemo(() => (prefersReducedMotion ? 320 : 1200), [prefersReducedMotion])
  const sparkleCount = useMemo(() => (prefersReducedMotion ? 20 : 140), [prefersReducedMotion])
  const sparkleSpeed = prefersReducedMotion ? 0.2 : 0.6

  if (!isMounted) {
    return null
  }

  return (
    <div className="particle-background">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.35} />
        <Stars
          radius={100}
          depth={60}
          count={starCount}
          factor={4}
          saturation={0}
          fade
          speed={0.35}
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
    </div>
  )
}
