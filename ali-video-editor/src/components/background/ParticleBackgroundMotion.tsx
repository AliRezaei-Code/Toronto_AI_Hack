"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};

const particleCount = 64;

// Seeded random function for consistent server/client rendering
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function ParticleBackgroundMotion() {
  const reduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    // Use a fixed seed for server-side rendering to prevent hydration mismatch
    const seed = isClient ? Date.now() : 12345;

    return Array.from({ length: particleCount }, (_, index) => {
      const baseSeed = seed + index;
      return {
        id: index,
        x: seededRandom(baseSeed) * 100,
        y: seededRandom(baseSeed + 1000) * 100,
        size: 1 + seededRandom(baseSeed + 2000) * 3,
        opacity: 0.18 + seededRandom(baseSeed + 3000) * 0.35,
        driftX: (seededRandom(baseSeed + 4000) - 0.5) * 40,
        driftY: (seededRandom(baseSeed + 5000) - 0.5) * 40,
        duration: 10 + seededRandom(baseSeed + 6000) * 12,
        delay: seededRandom(baseSeed + 7000) * 6,
      };
    });
  }, [isClient]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.14),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(163,230,53,0.08),_transparent_45%)]" />
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-lime-400/50 mix-blend-screen"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          initial={{ opacity: particle.opacity, scale: 0.8 }}
          animate={
            reduceMotion
              ? { opacity: particle.opacity, scale: 1 }
              : {
                  opacity: [0, particle.opacity, 0],
                  x: [0, particle.driftX],
                  y: [0, particle.driftY],
                  scale: [0.8, 1.1, 0.8],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
