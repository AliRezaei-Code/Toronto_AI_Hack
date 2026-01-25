"use client";

import { motion } from "framer-motion";
import { variants, easeOut } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={variants.fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOut}
      className={className}
    >
      {children}
    </motion.div>
  );
}
