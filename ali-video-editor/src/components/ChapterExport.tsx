"use client";

import {
  copyToClipboard,
  downloadFile,
  exportChapters,
  generateExportFilename,
  validateForYouTube,
  type ChapterExportFormat,
} from "@/lib/export/chapter-exporter";
import { ChapterMarker } from "@/types";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileJson,
  FileText,
} from "lucide-react";
import { useCallback, useState } from "react";

interface ChapterExportProps {
  chapters: ChapterMarker[];
  videoTitle?: string;
  className?: string;
}

const formatLabels: Record<ChapterExportFormat, string> = {
  youtube: "YouTube Format",
  "youtube-bulk": "YouTube Bulk Upload",
  "plain-text": "Plain Text",
  json: "JSON Export",
};

const formatDescriptions: Record<ChapterExportFormat, string> = {
  youtube: "Ready to paste in YouTube description",
  "youtube-bulk": "CSV format for YouTube Studio bulk upload",
  "plain-text": "Simple text with timestamps",
  json: "Structured data for developers",
};

export function ChapterExport({ chapters, videoTitle, className }: ChapterExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<ChapterExportFormat>("youtube");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const validation = validateForYouTube(chapters);
  const exportResult = exportChapters(chapters, selectedFormat);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(exportResult.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [exportResult.content]);

  const handleDownload = useCallback(() => {
    const filename = generateExportFilename(selectedFormat, videoTitle);
    downloadFile(exportResult.content, filename, exportResult.mimeType);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [exportResult, videoTitle, selectedFormat]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Export Chapters</h3>
            <p className="text-sm text-gray-400">
              {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>

        {/* YouTube Validation Status */}
        <button
          onClick={() => setShowValidation(!showValidation)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            validation.isValid
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
          )}
        >
          {validation.isValid ? (
            <>
              <Check className="h-4 w-4" />
              <span>YouTube Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Needs Review</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Warnings/Errors */}
      <AnimatePresence>
        {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {validation.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">{warning}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format Selection */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(formatLabels) as ChapterExportFormat[]).map((format) => (
          <motion.button
            key={format}
            onClick={() => setSelectedFormat(format)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative overflow-hidden rounded-lg border p-4 text-left transition-all",
              selectedFormat === format
                ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                : "border-gray-700/50 bg-gray-800/50 hover:border-gray-600/50 hover:bg-gray-800/80"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    selectedFormat === format
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  {format === "youtube" && <FileText className="h-4 w-4" />}
                  {format === "youtube-bulk" && <FileText className="h-4 w-4" />}
                  {format === "plain-text" && <FileText className="h-4 w-4" />}
                  {format === "json" && <FileJson className="h-4 w-4" />}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      selectedFormat === format ? "text-white" : "text-gray-300"
                    )}
                  >
                    {formatLabels[format]}
                  </p>
                  <p className="text-xs text-gray-500">{formatDescriptions[format]}</p>
                </div>
              </div>
              {selectedFormat === format && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Preview Section */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50">
        <button
          onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
          className="flex w-full items-center justify-between p-3 text-left"
        >
          <span className="text-sm font-medium text-gray-300">Preview</span>
          {isPreviewExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <AnimatePresence>
          {isPreviewExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-700/50"
            >
              <pre className="max-h-64 overflow-auto bg-gray-900/50 p-4 text-xs text-gray-300">
                {exportResult.content}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          disabled={chapters.length === 0}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all",
            "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
            "hover:from-blue-500 hover:to-purple-500",
            "disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500",
            copied && "from-emerald-600 to-teal-600"
          )}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          disabled={chapters.length === 0}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all",
            "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
            "hover:from-emerald-500 hover:to-teal-500",
            "disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500",
            downloaded && "from-blue-600 to-purple-600"
          )}
        >
          {downloaded ? (
            <>
              <Check className="h-5 w-5" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Download .{exportResult.fileExtension}</span>
            </>
          )}
        </button>
      </div>

      {/* Export Stats */}
      <div className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/30 px-4 py-3">
        <span className="text-sm text-gray-400">
          Exporting <span className="font-semibold text-white">{exportResult.chapterCount}</span>{" "}
          chapters
        </span>
        {!validation.isValid && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="h-3 w-3" />
            <span>
              {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
