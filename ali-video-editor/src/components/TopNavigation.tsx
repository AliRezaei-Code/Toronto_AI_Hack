"use client";

import { cn } from "@/utils/cn";
import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useMemo } from "react";

export interface TopNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: number;
  completed?: boolean;
}

interface TopNavigationProps {
  items: TopNavItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}

export function TopNavigation({
  items,
  activeItem,
  onItemClick,
  className,
}: TopNavigationProps) {
  const reduceMotion = useReducedMotion();
  const activeIndex = useMemo(
    () => items.findIndex((item) => item.id === activeItem),
    [items, activeItem]
  );

  return (
    <motion.div
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-2xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <nav className="flex h-16" role="tablist">
        {items.map((item, index) => {
          const isActive = activeItem === item.id;
          const isCompleted = (item.completed ?? false) || index < activeIndex;
          const Icon = item.icon;
          const zIndex = isActive ? items.length + 1 : items.length - index;

          return (
            <motion.button
              key={item.id}
              onClick={() => !item.disabled && onItemClick(item.id)}
              disabled={item.disabled}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 overflow-hidden text-xs font-medium text-white/80",
                "border border-white/10 backdrop-blur-xl transition-colors",
                index > 0 && "-ml-3 pl-6",
                "pr-6",
                item.disabled && "cursor-not-allowed opacity-50",
                !item.disabled &&
                  (isActive
                    ? "border-white/30 bg-white/20 text-white shadow-[0_0_18px_rgba(132,204,22,0.35)]"
                    : isCompleted
                      ? "bg-white/12 border-white/20 text-white/90"
                      : "bg-white/5 text-white/60")
              )}
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, rotateX: isActive ? 0 : 4 }}
              transition={{ delay: index * 0.05 }}
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                zIndex,
                transformPerspective: 900,
              }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: isActive && !item.disabled ? 1 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3 }}
              >
                <motion.div
                  className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={
                    reduceMotion || !isActive || item.disabled
                      ? { x: "-60%" }
                      : { x: ["-60%", "140%"] }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                  }
                />
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={cn(isActive && "drop-shadow-lg")}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <motion.span
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center bg-white text-[10px] font-bold text-blue-600"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
}
