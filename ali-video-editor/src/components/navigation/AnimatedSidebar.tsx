"use client";

import { spring } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { LayoutGroup, motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SidebarProps {
  items: NavigationItem[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  className?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function AnimatedSidebar({ items, activeView, onViewChange, className }: SidebarProps) {
  return (
    <LayoutGroup>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900",
          className
        )}
      >
        <div className="flex h-16 items-center border-b border-gray-800 px-6">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-xl font-bold text-white"
          >
            Video Copilot
          </motion.h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <LayoutGroup>
            {items.map((item, index) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  layout
                  onClick={() => onViewChange(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                  className={cn(
                    "group relative flex w-full items-center rounded-none px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      initial={false}
                      className="absolute inset-0 rounded-none bg-blue-600"
                      transition={spring}
                      style={{ zIndex: -1 }}
                    />
                  )}

                  <motion.div
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      rotate: isActive ? [0, -5, 5, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                      )}
                    />
                  </motion.div>

                  <motion.span
                    className="flex-1 text-left"
                    initial={false}
                    animate={{ opacity: 1 }}
                  >
                    {item.label}
                  </motion.span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                      className={cn(
                        "ml-auto inline-flex items-center justify-center rounded-none px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 group-hover:bg-gray-600"
                      )}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </LayoutGroup>
        </nav>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="border-t border-gray-800 p-4"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>v1.0.0</span>
            <span>AI-Powered</span>
          </div>
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}
