'use client';

/**
 * ANIMATED CSS BACKGROUND
 *
 * Pure CSS alternative to Three.js for guaranteed compatibility
 * Creates floating golden orbs with blur effects
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Animated floating orbs - larger and more visible */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-luxury-gold/25 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-pale-gold/20 rounded-full blur-[100px] animate-float-slower" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-dark-gold/15 rounded-full blur-[90px] animate-float-medium" />

      {/* Additional smaller floating orbs for depth */}
      <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-luxury-gold/30 rounded-full blur-[80px] animate-float-fast" />
      <div className="absolute top-1/3 right-1/2 w-56 h-56 bg-pale-gold/25 rounded-full blur-[70px] animate-float-medium-alt" />

      {/* Pulsing central glow - more dramatic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-luxury-gold/10 rounded-full blur-[140px] animate-pulse-slow" />

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 40px) scale(1.15);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25px, -35px) scale(0.95);
          }
          66% {
            transform: translate(35px, 25px) scale(1.05);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(50px, -50px) scale(1.2);
          }
        }

        @keyframes float-medium-alt {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30px, 30px) scale(0.9);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 18s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 15s ease-in-out infinite;
        }

        .animate-float-medium-alt {
          animation: float-medium-alt 22s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
