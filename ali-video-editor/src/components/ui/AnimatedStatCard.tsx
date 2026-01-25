"use client";

import { motion } from "framer-motion";
import { spring, delays } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  delay?: number;
}

export function AnimatedStatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  delay = delays.instant,
}: AnimatedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn("rounded-none border border-gray-700 bg-gray-800 p-6", className)}
    >
      <div className="flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.1 }}
          className="flex-1"
        >
          <p className="text-sm text-gray-400">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="mt-2 text-2xl font-bold text-white"
          >
            {value}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.15, type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          <Icon className="h-5 w-5 text-gray-600" />
        </motion.div>
      </div>

      {trend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
          // exit={{ opacity: 0, y: -10 }}
          className="mt-4 flex items-center text-sm"
        >
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.35, type: "spring", stiffness: 400 }}
            className={cn("font-medium", trend.isPositive ? "text-green-400" : "text-red-400")}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </motion.span>
          <span className="ml-2 text-gray-500">vs. average</span>
        </motion.div>
      )}
    </motion.div>
  );
}
