"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Undo2, Trash2, Type } from "lucide-react";
import { LucideIcon } from "@/lib/lucide-icon";
import { EditableWord } from "../hooks/useEditor";

interface ScriptEditorProps {
  words: EditableWord[];
  currentTime: number;
  isLoading: boolean;
  onToggleWord: (wordId: string) => void;
  onDeleteWords: (wordIds: string[]) => void;
  onRestoreAll: () => void;
  onWordClick: (time: number) => void;
  onApplyChanges: () => void;
  hasChanges: boolean;
}

export function ScriptEditor({
  words,
  currentTime,
  isLoading,
  onToggleWord,
  onDeleteWords,
  onRestoreAll,
  onWordClick,
  onApplyChanges,
  hasChanges,
}: ScriptEditorProps) {
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current word based on playback time
  const currentWordIndex = words.findIndex(
    (w) => !w.isDeleted && currentTime >= w.start && currentTime <= w.end
  );

  // Handle word click
  const handleWordClick = useCallback(
    (word: EditableWord, e: React.MouseEvent) => {
      e.preventDefault();

      if (e.shiftKey && selectionStart) {
        // Shift-click: select range
        const startIndex = words.findIndex((w) => w.id === selectionStart);
        const endIndex = words.findIndex((w) => w.id === word.id);

        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] = startIndex < endIndex
            ? [startIndex, endIndex]
            : [endIndex, startIndex];

          const rangeIds = words.slice(from, to + 1).map((w) => w.id);
          setSelectedWordIds(new Set(rangeIds));
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd-click: toggle selection
        setSelectedWordIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(word.id)) {
            newSet.delete(word.id);
          } else {
            newSet.add(word.id);
          }
          return newSet;
        });
        setSelectionStart(word.id);
      } else {
        // Regular click: seek to word time
        onWordClick(word.start);
        setSelectedWordIds(new Set([word.id]));
        setSelectionStart(word.id);
      }
    },
    [words, selectionStart, onWordClick]
  );

  // Handle word double-click to toggle deletion
  const handleWordDoubleClick = useCallback(
    (word: EditableWord) => {
      onToggleWord(word.id);
    },
    [onToggleWord]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace: mark selected words as deleted
      if ((e.key === "Delete" || e.key === "Backspace") && selectedWordIds.size > 0) {
        e.preventDefault();
        onDeleteWords(Array.from(selectedWordIds));
        setSelectedWordIds(new Set());
      }

      // Escape: clear selection
      if (e.key === "Escape") {
        setSelectedWordIds(new Set());
      }

      // Ctrl/Cmd + A: select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedWordIds(new Set(words.filter((w) => !w.isDeleted).map((w) => w.id)));
      }

      // Ctrl/Cmd + Z: restore all (undo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        onRestoreAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWordIds, words, onDeleteWords, onRestoreAll]);

  // Count deleted words
  const deletedCount = words.filter((w) => w.isDeleted).length;
  const totalWords = words.length;

  if (words.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Type size={20} className="text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Script Editor</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-center">
            {isLoading
              ? "Loading transcript..."
              : "Upload a video to see the transcript"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LucideIcon Icon={Type} size={20} className="text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Script Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          {deletedCount > 0 && (
            <button
              onClick={onRestoreAll}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
              title="Restore all (Ctrl+Z)"
            >
              <Undo2 size={14} />
              Restore ({deletedCount})
            </button>
          )}
          {selectedWordIds.size > 0 && (
            <button
              onClick={() => {
                onDeleteWords(Array.from(selectedWordIds));
                setSelectedWordIds(new Set());
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
              title="Delete selected (Delete key)"
            >
              <LucideIcon Icon={Trash2} size={14} />
              Cut ({selectedWordIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-3 px-3 py-2 bg-slate-700/50 rounded-lg">
        <p className="text-slate-400 text-xs">
          <span className="text-slate-300">Click</span> word to seek {" | "}
          <span className="text-slate-300">Double-click</span> to cut/restore {" | "}
          <span className="text-slate-300">Shift+click</span> to select range {" | "}
          <span className="text-slate-300">Delete</span> key to cut selected
        </p>
      </div>

      {/* Transcript */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 bg-slate-900/50 rounded-lg leading-relaxed select-none"
      >
        {words.map((word, index) => {
          const isCurrentWord = index === currentWordIndex;
          const isSelected = selectedWordIds.has(word.id);

          return (
            <span
              key={word.id}
              onClick={(e) => handleWordClick(word, e)}
              onDoubleClick={() => handleWordDoubleClick(word)}
              className={`
                inline cursor-pointer transition-all duration-150 px-0.5 py-0.5 rounded
                ${word.isDeleted
                  ? "line-through text-slate-600 bg-red-500/10 hover:bg-red-500/20"
                  : isCurrentWord
                    ? "text-purple-400 bg-purple-500/20 font-medium"
                    : isSelected
                      ? "text-white bg-blue-500/30"
                      : "text-slate-300 hover:bg-slate-700/50"
                }
              `}
            >
              {word.word}
              {index < words.length - 1 && " "}
            </span>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
        <div className="text-slate-500 text-xs">
          {deletedCount > 0 ? (
            <span className="text-red-400">
              {deletedCount} words cut ({((deletedCount / totalWords) * 100).toFixed(1)}%)
            </span>
          ) : (
            <span>{totalWords} words</span>
          )}
        </div>

        {hasChanges && (
          <button
            onClick={onApplyChanges}
            disabled={isLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              "Apply Changes"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
