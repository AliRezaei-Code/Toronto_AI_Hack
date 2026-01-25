'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, Color, Points, Vector3 } from 'three'

interface ParticleBurstProps {
  position: Vector3
  color?: string
  intensity?: number
  onComplete: () => void
}

export function ParticleBurst({
  position,
  color = '#60a5fa',
  intensity = 1,
  onComplete,
}: ParticleBurstProps) {
  const pointsRef = useRef<Points>(null)
  const lifespan = 1.2
  const particleCount = Math.round(70 + intensity * 60)

  const { positions, velocities, colors } = useMemo(() => {
    const positionsArray = new Float32Array(particleCount * 3)
    const velocitiesArray = new Float32Array(particleCount * 3)
    const colorsArray = new Float32Array(particleCount * 3)
    const baseColor = new Color(color)

    for (let i = 0; i < particleCount; i += 1) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.random() * 0.8
      const speed = 0.6 + Math.random() * 1.6

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positionsArray[i * 3] = position.x + x * 0.4
      positionsArray[i * 3 + 1] = position.y + y * 0.4
      positionsArray[i * 3 + 2] = position.z + z * 0.4

      velocitiesArray[i * 3] = x * speed
      velocitiesArray[i * 3 + 1] = y * speed
      velocitiesArray[i * 3 + 2] = z * speed

      const intensityShift = 0.75 + Math.random() * 0.5
      const mixedColor = baseColor.clone().multiplyScalar(intensityShift)
      colorsArray[i * 3] = mixedColor.r
      colorsArray[i * 3 + 1] = mixedColor.g
      colorsArray[i * 3 + 2] = mixedColor.b
    }

    return {
      positions: positionsArray,
      velocities: velocitiesArray,
      colors: colorsArray,
    }
  }, [color, particleCount, position])

  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    elapsedRef.current += delta
    const progress = elapsedRef.current / lifespan

    const positionAttribute = points.geometry.getAttribute('position') as BufferAttribute
    const drag = 1 - Math.min(progress, 1) * 0.6

    for (let i = 0; i < particleCount; i += 1) {
      const index = i * 3
      positionAttribute.array[index] += velocities[index] * delta * drag
      positionAttribute.array[index + 1] += velocities[index + 1] * delta * drag
      positionAttribute.array[index + 2] += velocities[index + 2] * delta * drag
    }

    positionAttribute.needsUpdate = true

    if (points.material && 'opacity' in points.material) {
      points.material.opacity = Math.max(0, 1 - progress) * 0.85
    }

    if (progress >= 1) {
      onComplete()
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12 + intensity * 0.08}
        transparent
        opacity={0.9}
        vertexColors
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
