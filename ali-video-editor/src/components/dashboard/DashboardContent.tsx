"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, BarChart3, Lightbulb, Settings } from "lucide-react";
import { variants, easeOutMed } from "@/lib/motion";

type ViewId = "upload" | "analysis" | "insights" | "settings";

interface DashboardContentProps {
  activeView: ViewId;
}

export function DashboardContent({ activeView }: DashboardContentProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <AnimatePresence mode="wait">
        {activeView === "upload" && <UploadView key="upload" />}
        {activeView === "analysis" && <AnalysisView key="analysis" />}
        {activeView === "insights" && <InsightsView key="insights" />}
        {activeView === "settings" && <SettingsView key="settings" />}
      </AnimatePresence>
    </div>
  );
}

function UploadView() {
  return (
    <motion.div
      variants={variants.fadeInLeft}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOutMed}
    >
      <motion.div
        variants={variants.fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Upload Video</h1>
        <p className="text-gray-400">Upload your video for AI-powered analysis</p>
      </motion.div>

      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="flex h-96 items-center justify-center rounded-none border-2 border-dashed border-gray-700 bg-gray-800/50">
          <div className="text-center">
            <motion.div
              className="mx-auto h-12 w-12 text-gray-600"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Upload />
            </motion.div>
            <p className="mt-4 text-gray-400">Upload view content will be here</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnalysisView() {
  return (
    <motion.div
      variants={variants.fadeInLeft}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOutMed}
    >
      <motion.div
        variants={variants.fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Retention Analysis</h1>
        <p className="text-gray-400">View AI-powered retention insights and predictions</p>
      </motion.div>

      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="flex h-96 items-center justify-center rounded-none border border-gray-700 bg-gray-800/50">
          <div className="text-center">
            <motion.div
              className="mx-auto h-12 w-12 text-gray-600"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <BarChart3 />
            </motion.div>
            <p className="mt-4 text-gray-400">Analysis view content will be here</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InsightsView() {
  return (
    <motion.div
      variants={variants.fadeInLeft}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOutMed}
    >
      <motion.div
        variants={variants.fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">AI Insights</h1>
        <p className="text-gray-400">AI-generated suggestions and recommendations</p>
      </motion.div>

      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="flex h-96 items-center justify-center rounded-none border border-gray-700 bg-gray-800/50">
          <div className="text-center">
            <motion.div
              className="mx-auto h-12 w-12 text-gray-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lightbulb />
            </motion.div>
            <p className="mt-4 text-gray-400">Insights view content will be here</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsView() {
  return (
    <motion.div
      variants={variants.fadeInLeft}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOutMed}
    >
      <motion.div
        variants={variants.fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Configure API keys and analysis preferences</p>
      </motion.div>

      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="flex h-96 items-center justify-center rounded-none border border-gray-700 bg-gray-800/50">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-600" />
            <p className="mt-4 text-gray-400">Settings view content will be here</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
