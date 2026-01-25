/**
 * History Search Component
 *
 * Provides search and filtering controls for the history list
 */

interface HistorySearchProps {
  value: string;
  onChange: (value: string) => void;
  sortBy: "date" | "score" | "filename";
  onSortChange: (value: "date" | "score" | "filename") => void;
}

export function HistorySearch({ value, onChange, sortBy, onSortChange }: HistorySearchProps) {
  return (
    <div className="space-y-3 border-b border-gray-700 p-4">
      <input
        type="text"
        placeholder="Search videos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-none border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
      />

      <div className="flex items-center gap-2">
        <label className="whitespace-nowrap text-sm text-gray-400">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "date" | "score" | "filename")}
          className="flex-1 rounded-none border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="date">Date (newest)</option>
          <option value="score">Score (highest)</option>
          <option value="filename">Filename (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
