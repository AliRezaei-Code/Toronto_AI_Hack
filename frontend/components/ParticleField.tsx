'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferAttribute, Color, Points } from 'three'

interface ParticleFieldProps {
  count?: number
  radius?: number
  size?: number
  speed?: number
  drift?: number
  colorStart?: string
  colorEnd?: string
  opacity?: number
}

export function ParticleField({
  count = 1200,
  radius = 14,
  size = 0.06,
  speed = 0.12,
  drift = 0.45,
  colorStart = '#60a5fa',
  colorEnd = '#f472b6',
  opacity = 0.7,
}: ParticleFieldProps) {
  const pointsRef = useRef<Points>(null)

  const { positions, colors, phases, basePositions } = useMemo(() => {
    const positionsArray = new Float32Array(count * 3)
    const basePositionsArray = new Float32Array(count * 3)
    const colorsArray = new Float32Array(count * 3)
    const phasesArray = new Float32Array(count)

    const startColor = new Color(colorStart)
    const endColor = new Color(colorEnd)

    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const distance = radius * (0.35 + Math.random() * 0.65)

      const x = distance * Math.sin(phi) * Math.cos(theta)
      const y = distance * Math.sin(phi) * Math.sin(theta)
      const z = distance * Math.cos(phi)

      const colorMix = Math.random()
      const mixedColor = startColor.clone().lerp(endColor, colorMix)

      positionsArray[i * 3] = x
      positionsArray[i * 3 + 1] = y
      positionsArray[i * 3 + 2] = z

      basePositionsArray[i * 3] = x
      basePositionsArray[i * 3 + 1] = y
      basePositionsArray[i * 3 + 2] = z

      colorsArray[i * 3] = mixedColor.r
      colorsArray[i * 3 + 1] = mixedColor.g
      colorsArray[i * 3 + 2] = mixedColor.b

      phasesArray[i] = Math.random() * Math.PI * 2
    }

    return {
      positions: positionsArray,
      basePositions: basePositionsArray,
      colors: colorsArray,
      phases: phasesArray,
    }
  }, [colorEnd, colorStart, count, radius])

  useFrame(({ clock }) => {
    const points = pointsRef.current
    if (!points) return

    const time = clock.elapsedTime
    const positionAttribute = points.geometry.getAttribute('position') as BufferAttribute

    for (let i = 0; i < count; i += 1) {
      const baseIndex = i * 3
      const phase = phases[i]
      const wave = Math.sin(time * speed + phase) * drift
      const swirl = Math.cos(time * speed * 0.7 + phase) * drift * 0.35

      positionAttribute.array[baseIndex] = basePositions[baseIndex] + swirl
      positionAttribute.array[baseIndex + 1] = basePositions[baseIndex + 1] + wave
      positionAttribute.array[baseIndex + 2] = basePositions[baseIndex + 2] + wave * 0.6
    }

    positionAttribute.needsUpdate = true
    points.rotation.y = time * speed * 0.35
    points.rotation.x = time * speed * 0.2
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
        size={size}
        transparent
        opacity={opacity}
        vertexColors
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
