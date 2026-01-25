/**
 * History Page Component
 *
 * Main view for browsing video analysis history
 * Displays list of analyses with search, filtering, and detail view
 */

"use client";

import { browserHistoryService, type HistoryDetail as BrowserHistoryDetail, type HistoryItem } from "@/lib/database/browser-history-service";
import type { HistoryListItem } from "@/lib/database/schema";
import { useSessionStore } from "@/lib/stores/session-store";
import { useEffect, useState } from "react";
import { HistoryDetail } from "./HistoryDetail";
import { HistoryEmpty } from "./HistoryEmpty";
import { HistoryList } from "./HistoryList";
import { HistorySearch } from "./HistorySearch";

// Convert browser history item to HistoryListItem format
function toHistoryListItem(item: HistoryItem): HistoryListItem {
  // Handle createdAt being either Date or string
  const createdAtStr = item.createdAt instanceof Date 
    ? item.createdAt.toISOString() 
    : String(item.createdAt);
    
  return {
    id: item.id,
    videoId: item.videoId,
    filename: item.filename,
    duration: item.duration,
    uploadedAt: createdAtStr,
    analyzedAt: createdAtStr,
    overallScore: item.overallScore,
    status: "completed" as const,
    issuesCritical: 0,
    issuesMajor: 0,
    issuesMinor: 0,
    issuesSuggestion: 0,
  };
}

export function HistoryPage() {
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BrowserHistoryDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "filename">("date");

  const loadHistory = async () => {
    setLoading(true);
    try {
      await browserHistoryService.initialize();
      const result = await browserHistoryService.getHistory();
      
      // Convert to HistoryListItem format and apply client-side filtering/sorting
      let historyItems = result.items.map(toHistoryListItem);
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        historyItems = historyItems.filter(item => 
          item.filename.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      historyItems.sort((a, b) => {
        switch (sortBy) {
          case "score":
            return (b.overallScore || 0) - (a.overallScore || 0);
          case "filename":
            return a.filename.localeCompare(b.filename);
          case "date":
          default:
            return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
        }
      });
      
      setItems(historyItems);
      setTotal(historyItems.length);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    try {
      const detail = await browserHistoryService.getHistoryDetail(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error("Failed to load detail:", error);
      setSelectedDetail(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await browserHistoryService.deleteAnalysis(id);
      loadHistory();
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedDetail(null);
      }
    } catch (error) {
      console.error("Failed to delete analysis:", error);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const detail = await browserHistoryService.getHistoryDetail(id);
      if (!detail) {
        throw new Error("Analysis not found");
      }
      const json = JSON.stringify(detail, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export analysis:", error);
      alert("Failed to export analysis");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const detail = await browserHistoryService.getHistoryDetail(id);
      if (!detail) {
        throw new Error("Analysis not found");
      }

      // Use the session store to restore the session
      const { restoreFromHistory } = useSessionStore.getState();
      await restoreFromHistory(detail);
      
      // The restoreFromHistory function now automatically sets the correct tab based on available data
      // If we have retention/insights, it goes to retention tab, otherwise transcription or upload
      
      // Determine appropriate message based on what was restored
      const hasFullAnalysis = !!(detail.retentionAnalysis || detail.aiInsights || detail.analysisResult);
      const message = hasFullAnalysis 
        ? "Session restored! Your analysis results have been loaded."
        : detail.hasTranscription 
          ? "Session restored! Transcription loaded. Note: Video file is not available, but you can view the saved results."
          : "Session restored with available data.";
      
      alert(message);
    } catch (error) {
      console.error("Failed to restore session:", error);
      alert("Failed to restore session");
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: List */}
      <div className="flex w-96 flex-col border-r border-gray-700 bg-gray-900">
        <HistorySearch
          value={searchQuery}
          onChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <HistoryEmpty />
        ) : (
          <HistoryList
            items={items}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        )}

        <div className="border-t border-gray-700 p-4 text-sm text-gray-400">
          {total} analysis{total !== 1 ? "es" : ""} found
        </div>
      </div>

      {/* Main: Detail View */}
      <div className="flex-1 overflow-auto bg-gray-800">
        {selectedDetail ? (
          <HistoryDetail
            detail={selectedDetail}
            onExport={() => selectedId && handleExport(selectedId)}
            onDelete={() => selectedId && handleDelete(selectedId)}
            onRestore={() => selectedId && handleRestore(selectedId)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select an analysis to view details
          </div>
        )}
      </div>
    </div>
  );
}
