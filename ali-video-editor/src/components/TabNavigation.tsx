"use client";

import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: number;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({ tabs, activeTab, onTabChange, className }: TabNavigationProps) {
  return (
    <div className={cn("border-b border-gray-700 bg-gray-800", className)}>
      <nav className="flex gap-1 overflow-x-auto px-4" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300",
                tab.disabled && "cursor-not-allowed opacity-50"
              )}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-none px-1.5 text-xs font-medium",
                    isActive ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
