"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Send, Wand2, Loader2, Sparkles } from "lucide-react";

interface PromptBoxProps {
  onSubmit: (prompt: string) => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
  message: string | null;
}

const QUICK_PROMPTS = [
  { label: "Remove fillers", prompt: "Remove all filler words like um, uh, you know, like" },
  { label: "Remove pauses", prompt: "Remove all awkward pauses longer than 1 second" },
  { label: "Under 60s", prompt: "Make this video under 60 seconds by removing less important parts" },
  { label: "Tighten cuts", prompt: "Remove all dead air and make the cuts tighter" },
];

export function PromptBox({
  onSubmit,
  isLoading,
  isDisabled,
  message,
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim() || isLoading || isDisabled) return;

      await onSubmit(prompt.trim());
      setPrompt("");
    },
    [prompt, isLoading, isDisabled, onSubmit]
  );

  const handleQuickPrompt = useCallback(
    async (quickPrompt: string) => {
      setPrompt(quickPrompt);
      setShowSuggestions(false);
      await onSubmit(quickPrompt);
      setPrompt("");
    },
    [onSubmit]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Submit on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isDisabled]);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={20} className="text-blue-500" />
        <h3 className="text-lg font-semibold text-white">AI Edit</h3>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleQuickPrompt(qp.prompt)}
            disabled={isLoading || isDisabled}
            className="px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={12} />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDisabled
              ? "Upload a video first..."
              : 'Type an edit command... (e.g., "Remove all ums and ahs")'
          }
          disabled={isLoading || isDisabled}
          rows={2}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading || isDisabled}
          className="absolute right-3 bottom-3 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-colors"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Status Message */}
      {message && (
        <div className="mt-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">{message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>Processing edit...</span>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 text-slate-500 text-xs">
        <p>Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Enter</kbd> to submit</p>
      </div>
    </div>
  );
}
