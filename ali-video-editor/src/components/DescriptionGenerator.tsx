/**
 * Video Copilot - YouTube Description Generator Component
 * Generates and displays SEO-optimized YouTube descriptions
 */

"use client";

import {
  DescriptionLength,
  DescriptionOptions,
  DescriptionTone,
  GeneratedDescription,
} from "@/types/description";
import { cn } from "@/utils/cn";
import { useState } from "react";

interface DescriptionGeneratorProps {
  videoId: string;
  transcription: string;
  title?: string;
  chapters?: Array<{ title: string; start: number; end: number }>;
  onGenerated?: (description: GeneratedDescription) => void;
}

export function DescriptionGenerator({
  videoId,
  transcription,
  title,
  chapters,
  onGenerated,
}: DescriptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<GeneratedDescription | null>(null);
  const [copied, setCopied] = useState(false);

  // Description options
  const [options, setOptions] = useState<DescriptionOptions>({
    length: "medium",
    tone: "engaging",
    includeHashtags: true,
    includeChapters: true,
    customKeywords: [],
    channelName: "",
    socialLinks: {},
  });

  const [customKeywordsInput, setCustomKeywordsInput] = useState("");

  /**
   * Generate description
   */
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setDescription(null);

    try {
      // Parse custom keywords
      const customKeywords = customKeywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const requestOptions = {
        ...options,
        customKeywords,
      };

      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          transcription,
          title,
          chapters,
          options: requestOptions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate description");
      }

      setDescription(data.data);
      onGenerated?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy description to clipboard
   */
  const handleCopy = async () => {
    if (!description) {
      return;
    }

    try {
      await navigator.clipboard.writeText(description.fullDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  /**
   * Export description to text file
   */
  const handleExport = () => {
    if (!description) {
      return;
    }

    const blob = new Blob([description.fullDescription], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${videoId}-description.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Update option
   */
  const updateOption = <K extends keyof DescriptionOptions>(
    key: K,
    value: DescriptionOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Update social link
   */
  const updateSocialLink = (
    platform: "twitter" | "instagram" | "tiktok" | "website",
    value: string
  ) => {
    setOptions((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        YouTube Description Generator
      </h2>

      {/* Options */}
      <div className="mb-6 space-y-4">
        {/* Length */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description Length
          </label>
          <div className="flex gap-2">
            {(["short", "medium", "long"] as DescriptionLength[]).map((length) => (
              <button
                key={length}
                onClick={() => updateOption("length", length)}
                className={cn(
                  "rounded-md px-4 py-2 font-medium transition-colors",
                  options.length === length
                    ? "bg-lime-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                )}
              >
                {length.charAt(0).toUpperCase() + length.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tone
          </label>
          <select
            value={options.tone}
            onChange={(e) => updateOption("tone", e.target.value as DescriptionTone)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="engaging">Engaging</option>
          </select>
        </div>

        {/* Include Chapters */}
        {chapters && chapters.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeChapters"
              checked={options.includeChapters}
              onChange={(e) => updateOption("includeChapters", e.target.checked)}
              className="h-4 w-4 rounded text-lime-500 focus:ring-lime-500"
            />
            <label htmlFor="includeChapters" className="text-sm text-gray-700 dark:text-gray-300">
              Include timestamps/chapters ({chapters.length} available)
            </label>
          </div>
        )}

        {/* Include Hashtags */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeHashtags"
            checked={options.includeHashtags}
            onChange={(e) => updateOption("includeHashtags", e.target.checked)}
            className="h-4 w-4 rounded text-lime-500 focus:ring-lime-500"
          />
          <label htmlFor="includeHashtags" className="text-sm text-gray-700 dark:text-gray-300">
            Include hashtags
          </label>
        </div>

        {/* Custom Keywords */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={customKeywordsInput}
            onChange={(e) => setCustomKeywordsInput(e.target.value)}
            placeholder="e.g., marketing, SEO, tutorial"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Channel Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Channel Name (for call-to-action)
          </label>
          <input
            type="text"
            value={options.channelName}
            onChange={(e) => updateOption("channelName", e.target.value)}
            placeholder="Your channel name"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Social Media Links
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Twitter handle"
              value={options.socialLinks?.twitter || ""}
              onChange={(e) => updateSocialLink("twitter", e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Instagram handle"
              value={options.socialLinks?.instagram || ""}
              onChange={(e) => updateSocialLink("instagram", e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="TikTok handle"
              value={options.socialLinks?.tiktok || ""}
              onChange={(e) => updateSocialLink("tiktok", e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Website URL"
              value={options.socialLinks?.website || ""}
              onChange={(e) => updateSocialLink("website", e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full rounded-md bg-lime-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-lime-600 disabled:bg-gray-400"
      >
        {isLoading ? "Generating..." : "Generate Description"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Generated Description */}
      {description && (
        <div className="mt-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-500">{description.wordCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Words</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-500">{description.characterCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Characters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-500">
                {Math.round(description.seoScore * 100)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">SEO Score</p>
            </div>
          </div>

          {/* Description Preview */}
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated Description
            </label>
            <textarea
              value={description.fullDescription}
              readOnly
              className="h-64 w-full resize-none rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Generated Hashtags */}
          {description.hashtags.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Generated Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {description.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-lime-100 px-3 py-1 text-sm text-lime-700 dark:bg-lime-900/30 dark:text-lime-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleExport}
              className="flex-1 rounded-md bg-gray-500 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
            >
              Export to File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
