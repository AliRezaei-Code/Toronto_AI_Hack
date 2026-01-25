/**
 * Framer Motion Animation Configuration
 * Centralized animation constants for Video Copilot
 */

import { Transition, Variants } from "framer-motion";

export const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const springStiff = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

export const springBouncy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 20,
};

export const easeOut: Transition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const easeOutMed: Transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const easeOutSlow: Transition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const variants: {
  fadeIn: Variants;
  fadeInUp: Variants;
  fadeInDown: Variants;
  fadeInLeft: Variants;
  fadeInRight: Variants;
  scaleIn: Variants;
  scaleOut: Variants;
  slideUp: Variants;
  slideDown: Variants;
} = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 16 },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  scaleOut: {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },

  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },

  slideDown: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
  },
};

export const delays = {
  instant: 0,
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
} as const;
