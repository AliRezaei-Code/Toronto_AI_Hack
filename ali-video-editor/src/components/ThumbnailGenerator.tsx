/**
 * Video Copilot - YouTube Thumbnail Generator Component
 * Generates YouTube thumbnails using HuggingFace AI models
 */

"use client";

import { ThumbnailGenerationRequest, useThumbnailGeneration } from "@/hooks/useThumbnailGeneration";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { useState } from "react";

/** Available thumbnail styles with descriptions */
const STYLE_OPTIONS = [
  {
    value: "HIGH_ENERGY",
    label: "High Energy",
    description: "Bold, colorful, expressive reactions",
  },
  { value: "MINIMAL_TECH", label: "Minimal Tech", description: "Clean, modern, professional" },
  { value: "FINANCE", label: "Finance", description: "Charts, money, authority" },
  { value: "GAMING", label: "Gaming", description: "Neon, action, high energy" },
] as const;

type ThumbnailStyle = (typeof STYLE_OPTIONS)[number]["value"];

interface ThumbnailGeneratorProps {
  /** Video ID for linking thumbnail to analysis */
  videoId?: string;
  /** Suggested title from video analysis */
  suggestedTitle?: string;
  /** Suggested topic from video analysis */
  suggestedTopic?: string;
  /** HuggingFace API key for thumbnail generation */
  huggingfaceApiKey?: string;
  /** Callback when thumbnail is generated */
  onGenerated?: (result: { id: string; imageData: string }) => void;
}

export function ThumbnailGenerator({
  videoId,
  suggestedTitle = "",
  suggestedTopic = "",
  huggingfaceApiKey,
  onGenerated,
}: ThumbnailGeneratorProps) {
  const {
    status,
    result,
    error,
    history,
    generate,
    saveToHistory,
    restoreFromHistory,
    deleteFromHistory,
    reset,
  } = useThumbnailGeneration();

  // Form state
  const [titleText, setTitleText] = useState(suggestedTitle);
  const [topic, setTopic] = useState(suggestedTopic);
  const [style, setStyle] = useState<ThumbnailStyle>("HIGH_ENERGY");

  // Advanced options (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(30);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  // Brand options
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");

  // UI state
  const [showHistory, setShowHistory] = useState(false);

  /**
   * Handle thumbnail generation
   */
  const handleGenerate = async () => {
    if (!titleText.trim() || !topic.trim()) {
      return;
    }

    const request: ThumbnailGenerationRequest = {
      titleText: titleText.trim(),
      topic: topic.trim(),
      style,
      videoId,
      guidanceScale,
      numInferenceSteps,
      seed,
      huggingfaceApiKey,
    };

    // Add brand options if provided
    if (primaryColor || accentColor) {
      request.brandOptions = {};
      if (primaryColor) {
        request.brandOptions.primaryColor = primaryColor;
      }
      if (accentColor) {
        request.brandOptions.accentColor = accentColor;
      }
    }

    await generate(request);
  };

  /**
   * Download thumbnail as PNG
   */
  const handleDownload = () => {
    if (!result) {
      return;
    }

    const link = document.createElement("a");
    link.href = result.imageData;
    link.download = `thumbnail-${result.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Save to history
   */
  const handleSave = async () => {
    await saveToHistory(videoId);
    if (result && onGenerated) {
      onGenerated({ id: result.id, imageData: result.imageData });
    }
  };

  /**
   * Regenerate with new seed
   */
  const handleRegenerate = async () => {
    setSeed(undefined); // Will get new random seed
    await handleGenerate();
  };

  /**
   * Calculate word count for validation feedback
   */
  const wordCount = titleText.trim().split(/\s+/).filter(Boolean).length;
  const isValidTitle = wordCount >= 2 && wordCount <= 7 && titleText.length <= 100;
  const isValidForm = isValidTitle && topic.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <span className="text-3xl">🎨</span>
            YouTube Thumbnail Generator
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            AI-powered thumbnails using HuggingFace FLUX models
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "rounded-lg px-4 py-2 font-medium transition-all",
            showHistory ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          )}
        >
          {showHistory ? "Hide History" : `History (${history.length})`}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Recent Thumbnails</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {history.slice(0, 8).map((thumb) => (
              <div
                key={thumb.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-600 transition-all hover:border-purple-500"
                onClick={() => restoreFromHistory(thumb.id)}
              >
                <Image
                  src={thumb.imageData}
                  alt={thumb.titleText}
                  className="aspect-video w-full object-cover"
                  width={320}
                  height={180}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-sm font-medium text-white">Restore</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFromHistory(thumb.id);
                  }}
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="mb-6 space-y-4">
        {/* Title Text */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Title Text <span className="text-gray-500">(2-7 words, max 100 chars)</span>
          </label>
          <input
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            placeholder="e.g., Epic Gaming Moments"
            maxLength={100}
            className={cn(
              "w-full rounded-lg border bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500",
              isValidTitle || !titleText ? "border-gray-600" : "border-red-500"
            )}
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className={cn(wordCount < 2 || wordCount > 7 ? "text-red-400" : "text-gray-500")}>
              {wordCount} / 7 words
            </span>
            <span className={cn(titleText.length > 100 ? "text-red-400" : "text-gray-500")}>
              {titleText.length} / 100 chars
            </span>
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Topic / Context</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Minecraft speedrun, tech review, finance tips"
            maxLength={200}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Thumbnail Style</label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStyle(opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  style === opt.value
                    ? "border-purple-500 bg-purple-600/20 text-white"
                    : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500 hover:bg-gray-700"
                )}
              >
                <span className="block font-semibold">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <span className={cn("transition-transform", showAdvanced ? "rotate-90" : "")}>▶</span>
          Advanced Options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Guidance Scale ({guidanceScale})
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Higher = more prompt adherence</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Inference Steps ({numInferenceSteps})
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Higher = more detail, slower</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Seed (optional)
              </label>
              <input
                type="number"
                value={seed ?? ""}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Fixed seed for reproducibility</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={primaryColor || "#FF0000"}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Accent Color</label>
                <input
                  type="color"
                  value={accentColor || "#FFFF00"}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={status === "generating" || !isValidForm}
        className={cn(
          "w-full rounded-lg py-4 text-lg font-bold transition-all",
          status === "generating"
            ? "cursor-wait bg-purple-700 text-white"
            : isValidForm
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-500/25"
              : "cursor-not-allowed bg-gray-700 text-gray-400"
        )}
      >
        {status === "generating" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Generating... This may take 10-30 seconds
          </span>
        ) : (
          "✨ Generate Thumbnail"
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-700 bg-red-900/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={reset}
            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && status === "success" && (
        <div className="mt-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <p className="text-xl font-bold text-purple-400">
                {result.width}×{result.height}
              </p>
              <p className="text-xs text-gray-500">Resolution</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <p className="text-xl font-bold text-purple-400">{result.strategy}</p>
              <p className="text-xs text-gray-500">Strategy</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <p className="text-xl font-bold text-purple-400">
                {(result.latencyMs / 1000).toFixed(1)}s
              </p>
              <p className="text-xs text-gray-500">Generation Time</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <p className="truncate text-xl font-bold text-purple-400" title={String(result.seed)}>
                {result.seed}
              </p>
              <p className="text-xs text-gray-500">Seed</p>
            </div>
          </div>

          {/* Thumbnail Preview */}
          <div className="relative overflow-hidden rounded-lg border border-gray-600">
            <Image
              src={result.imageData}
              alt="Generated thumbnail"
              className="aspect-video w-full bg-black object-contain"
              width={640}
              height={360}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDownload}
              className="rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              📥 Download
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700"
            >
              💾 Save to History
            </button>
            <button
              onClick={handleRegenerate}
              className="rounded-lg bg-gray-600 py-3 font-medium text-white transition-colors hover:bg-gray-500"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
