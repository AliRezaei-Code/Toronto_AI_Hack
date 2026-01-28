'use client';

/**
 * SPARKLE PARTICLE EFFECT
 *
 * Adds small golden particles that twinkle across the screen
 * Pure CSS for maximum compatibility
 */
export function SparkleEffect() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: `${2 + Math.random() * 3}px`,
  }));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-luxury-gold animate-twinkle"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(1);
          }
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
