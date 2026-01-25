"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/utils/cn";

interface FloatingLimeOrbProps {
  className?: string;
  size?: number;
}

export function FloatingLimeOrb({ className, size = 140 }: FloatingLimeOrbProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "pointer-events-none relative [perspective:900px] [transform-style:preserve-3d]",
        className
      )}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 22 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(217,249,157,0.9),_rgba(132,204,22,0.4)_45%,_rgba(15,23,42,0)_70%)] blur-sm"
        animate={
          reduceMotion ? { opacity: 0.85 } : { rotateX: [12, -10, 12], rotateY: [-8, 12, -8] }
        }
        transition={
          reduceMotion ? { duration: 0 } : { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformStyle: "preserve-3d" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-lime-400/40 bg-[radial-gradient(circle_at_70%_20%,_rgba(190,242,100,0.6),_rgba(32,48,20,0.2)_55%,_rgba(9,14,10,0.1)_100%)]"
        animate={reduceMotion ? { opacity: 0.8 } : { rotateZ: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_35%_35%,_rgba(236,252,203,0.9),_rgba(132,204,22,0.4)_50%,_rgba(15,23,42,0)_90%)]"
        animate={reduceMotion ? { opacity: 0.85 } : { y: [0, -6, 0], scale: [0.95, 1, 0.95] }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div className="absolute inset-0 rounded-full border border-lime-200/20 shadow-[0_0_35px_rgba(132,204,22,0.25)]" />
    </motion.div>
  );
}
