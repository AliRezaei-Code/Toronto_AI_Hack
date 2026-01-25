/**
 * History Empty Component
 *
 * Displays empty state when no analyses are found
 */

export function HistoryEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none bg-gray-800">
        <svg
          className="h-8 w-8 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-white">No analyses yet</h3>
      <p className="text-sm text-gray-400">
        Upload and analyze a video to get started. Your analysis history will appear here.
      </p>
    </div>
  );
}
