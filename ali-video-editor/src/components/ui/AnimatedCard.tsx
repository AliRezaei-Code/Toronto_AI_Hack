"use client";

import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { cn } from "@/utils/cn";

interface AnimatedCardProps {
  variant?: "default" | "bordered";
  className?: string;
  children: React.ReactNode;
}

export function AnimatedCard({ className, variant = "default", children }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring}
      className={cn(
        "rounded-none",
        {
          "bg-gray-800": variant === "default",
          "rounded-none border border-gray-700 bg-gray-800": variant === "bordered",
        },
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)}>
      {children}
    </h3>
  );
}

export function AnimatedCardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className={cn("text-sm text-gray-400", className)}
    >
      {children}
    </motion.p>
  );
}

export function AnimatedCardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className={cn("p-6 pt-0", className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      className={cn("flex items-center p-6 pt-0", className)}
    >
      {children}
    </motion.div>
  );
}
