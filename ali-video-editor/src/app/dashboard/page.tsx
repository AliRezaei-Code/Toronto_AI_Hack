"use client";

import { useState } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AnimatedSidebar, NavigationItem } from "@/components/navigation/AnimatedSidebar";
import { Upload, BarChart3, Lightbulb, Settings } from "lucide-react";
import { AnimatePresence } from "framer-motion";

type ViewId = "upload" | "analysis" | "insights" | "settings";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewId>("upload");

  const navItems: NavigationItem[] = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "analysis", label: "Analysis", icon: BarChart3 },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      <AnimatedSidebar
        items={navItems}
        activeView={activeView}
        onViewChange={(id) => setActiveView(id as ViewId)}
      />
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <DashboardContent key={activeView} activeView={activeView} />
        </AnimatePresence>
      </main>
    </div>
  );
}
