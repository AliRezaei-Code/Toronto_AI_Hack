"use client";

import { Check, HelpCircle, Loader2, Settings as SettingsIcon, X } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deepgramApiKey: string;
  geminiApiKey: string;
  huggingfaceApiKey: string;
  onDeepgramKeyChange: (key: string) => void;
  onGeminiKeyChange: (key: string) => void;
  onHuggingfaceKeyChange: (key: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  deepgramApiKey,
  geminiApiKey,
  huggingfaceApiKey,
  onDeepgramKeyChange,
  onGeminiKeyChange,
  onHuggingfaceKeyChange,
}: SettingsModalProps) {
  const [testingDeepgram, setTestingDeepgram] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingHuggingface, setTestingHuggingface] = useState(false);
  const [deepgramStatus, setDeepgramStatus] = useState<"idle" | "success" | "error">("idle");
  const [geminiStatus, setGeminiStatus] = useState<"idle" | "success" | "error">("idle");
  const [huggingfaceStatus, setHuggingfaceStatus] = useState<"idle" | "success" | "error">("idle");
  const [deepgramError, setDeepgramError] = useState("");
  const [geminiError, setGeminiError] = useState("");
  const [huggingfaceError, setHuggingfaceError] = useState("");

  const testDeepgramKey = async () => {
    if (!deepgramApiKey) {
      setDeepgramError("Please enter an API key first");
      return;
    }

    setTestingDeepgram(true);
    setDeepgramStatus("idle");
    setDeepgramError("");

    try {
      const response = await fetch("/api/deepgram/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: deepgramApiKey }),
      });

      const data = (await response.json()) as { valid?: boolean; error?: string };

      if (response.ok && data.valid) {
        setDeepgramStatus("success");
      } else {
        setDeepgramError(data.error || "Invalid API key");
        setDeepgramStatus("error");
      }
    } catch (err) {
      setDeepgramError("Failed to validate API key");
      setDeepgramStatus("error");
    } finally {
      setTestingDeepgram(false);
    }
  };

  const testGeminiKey = async () => {
    if (!geminiApiKey) {
      setGeminiError("Please enter an API key first");
      return;
    }

    setTestingGemini(true);
    setGeminiStatus("idle");
    setGeminiError("");

    try {
      const response = await fetch("/api/gemini/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: geminiApiKey }),
      });

      const data = (await response.json()) as { valid?: boolean; error?: string };

      if (response.ok && data.valid) {
        setGeminiStatus("success");
      } else {
        setGeminiError(data.error || "Invalid API key");
        setGeminiStatus("error");
      }
    } catch (err) {
      setGeminiError("Failed to validate API key");
      setGeminiStatus("error");
    } finally {
      setTestingGemini(false);
    }
  };

  const testHuggingfaceKey = async () => {
    if (!huggingfaceApiKey) {
      setHuggingfaceError("Please enter an API token first");
      return;
    }

    setTestingHuggingface(true);
    setHuggingfaceStatus("idle");
    setHuggingfaceError("");

    try {
      const response = await fetch("/api/huggingface/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: huggingfaceApiKey }),
      });

      const data = (await response.json()) as { valid?: boolean; error?: string };

      if (response.ok && data.valid) {
        setHuggingfaceStatus("success");
      } else {
        setHuggingfaceError(data.error || "Invalid API token");
        setHuggingfaceStatus("error");
      }
    } catch (err) {
      setHuggingfaceError("Failed to validate API token");
      setHuggingfaceStatus("error");
    } finally {
      setTestingHuggingface(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
              <SettingsIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">API Settings</h2>
              <p className="text-sm text-gray-400">Configure your API keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Deepgram API Key */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">Deepgram API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={deepgramApiKey}
              onChange={(e) => {
                onDeepgramKeyChange(e.target.value);
                setDeepgramStatus("idle");
                setDeepgramError("");
              }}
              placeholder="Enter your Deepgram API key"
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testDeepgramKey}
              disabled={!deepgramApiKey || testingDeepgram}
              className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-gray-300 transition-all hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testingDeepgram ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : deepgramStatus === "success" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                "Test"
              )}
            </button>
          </div>
          {deepgramError && <p className="mt-2 text-xs text-red-400">{deepgramError}</p>}
          {deepgramStatus === "success" && (
            <p className="mt-2 text-xs text-green-400">API key is valid!</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Required for video transcription. Get your key from{" "}
            <a
              href="https://console.deepgram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Deepgram Console
            </a>
          </p>
        </div>

        {/* Gemini API Key */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">Gemini API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                onGeminiKeyChange(e.target.value);
                setGeminiStatus("idle");
                setGeminiError("");
              }}
              placeholder="Enter your Gemini API key"
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={testGeminiKey}
              disabled={!geminiApiKey || testingGemini}
              className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-gray-300 transition-all hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testingGemini ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : geminiStatus === "success" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                "Test"
              )}
            </button>
          </div>
          {geminiError && <p className="mt-2 text-xs text-red-400">{geminiError}</p>}
          {geminiStatus === "success" && (
            <p className="mt-2 text-xs text-green-400">API key is valid!</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Required for video analysis and insights. Get your key from{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* HuggingFace API Key */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            HuggingFace API Token
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={huggingfaceApiKey}
              onChange={(e) => {
                onHuggingfaceKeyChange(e.target.value);
                setHuggingfaceStatus("idle");
                setHuggingfaceError("");
              }}
              placeholder="Enter your HuggingFace API token"
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={testHuggingfaceKey}
              disabled={!huggingfaceApiKey || testingHuggingface}
              className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-gray-300 transition-all hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testingHuggingface ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : huggingfaceStatus === "success" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                "Test"
              )}
            </button>
          </div>
          {huggingfaceError && <p className="mt-2 text-xs text-red-400">{huggingfaceError}</p>}
          {huggingfaceStatus === "success" && (
            <p className="mt-2 text-xs text-green-400">API token is valid!</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Required for thumbnail generation. Get your token from{" "}
            <a
              href="https://huggingface.co/settings/tokens?newKind=fine_grained&name=Video%20Copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 font-medium hover:text-orange-300 underline underline-offset-4 decoration-orange-400/30 transition-colors"
            >
              HuggingFace Settings
            </a>
          </p>
          <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-orange-400">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Required Permissions</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-400/50" />
                <span>
                  <strong className="text-gray-300">Token Type:</strong> Use &quot;Fine-grained&quot; for better security.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-400/50" />
                <span>
                  <strong className="text-gray-300">Repositories:</strong> Read access to contents of all repos under your personal namespace and public gated repos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-400/50" />
                <span>
                  <strong className="text-gray-300">Inference:</strong> &quot;Make calls to Inference Providers&quot; and &quot;Make calls to your Inference Endpoints&quot;.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
            <span className="text-sm text-gray-300">Deepgram</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  deepgramStatus === "success"
                    ? "bg-green-500"
                    : deepgramStatus === "error"
                      ? "bg-red-500"
                      : deepgramApiKey
                        ? "bg-green-500"
                        : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {deepgramStatus === "success"
                  ? "Valid"
                  : deepgramStatus === "error"
                    ? "Invalid"
                    : deepgramApiKey
                      ? "Configured"
                      : "Not set"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
            <span className="text-sm text-gray-300">Gemini</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  geminiStatus === "success"
                    ? "bg-green-500"
                    : geminiStatus === "error"
                      ? "bg-red-500"
                      : geminiApiKey
                        ? "bg-green-500"
                        : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {geminiStatus === "success"
                  ? "Valid"
                  : geminiStatus === "error"
                    ? "Invalid"
                    : geminiApiKey
                      ? "Configured"
                      : "Not set"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
            <span className="text-sm text-gray-300">HuggingFace</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  huggingfaceStatus === "success"
                    ? "bg-green-500"
                    : huggingfaceStatus === "error"
                      ? "bg-red-500"
                      : huggingfaceApiKey
                        ? "bg-green-500"
                        : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {huggingfaceStatus === "success"
                  ? "Valid"
                  : huggingfaceStatus === "error"
                    ? "Invalid"
                    : huggingfaceApiKey
                      ? "Configured"
                      : "Not set"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
