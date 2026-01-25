# Video Analysis History - Local Database Module

## Quick Start

```typescript
import { historyService } from '@/lib/database/history-service';

// 1. Initialize on app startup
historyService.initialize();

// 2. Save data after each stage
historyService.saveVideo(metadata);
historyService.saveTranscription(transcription);
historyService.saveAnalysis(videoId, transcriptionId, analysis);

// 3. Retrieve from UI
const { items, total } = historyService.getHistory({ search: 'my video' });
const detail = historyService.getHistoryDetail(sessionId);

// 4. Cleanup on shutdown
historyService.shutdown();
```

## What This Module Does

This module provides **offline persistence** for video analysis results using a local SQLite database. It automatically saves all analysis data as you upload, transcribe, and analyze videos, allowing you to:

- Browse past analyses without re-uploading videos
- Search and filter by filename, date, or score
- View detailed analysis results including issues and recommendations
- Export analysis data as JSON
- Delete analyses you no longer need

## Database Location

- **Development**: `/.videocopilot/data/history.db` (project root)
- **Production**: `~/.videocopilot/data/history.db` (user home directory)

## Key Features

✅ **Automatic Persistence** - Data saved automatically after each stage  
✅ **Search & Filter** - Find analyses by filename, date, score, status  
✅ **Detailed Views** - See full category results, issues, transcriptions  
✅ **Export & Delete** - Download JSON or remove unwanted analyses  
✅ **Type-Safe** - Full TypeScript support with autocompletion  
✅ **Transactions** - Atomic operations prevent partial saves  
✅ **Performance** - Indexed queries with WAL mode for speed

## API Reference

### Initialization

```typescript
historyService.initialize()           // Initialize database connection
historyService.isInitialized()         // Check if initialized
historyService.getDatabasePath()       // Get database file path
historyService.shutdown()              // Close connection
```

### Saving Data

```typescript
historyService.saveVideo(metadata)                    // Returns video ID
historyService.saveTranscription(transcription)       // Returns transcription ID
historyService.saveAnalysis(videoId, transcriptionId, analysis) // Returns session ID
```

### Retrieving Data

```typescript
// Get paginated list
historyService.getHistory({
  search?: string,           // Filter by filename
  sortBy?: 'date' | 'score' | 'filename',
  sortOrder?: 'asc' | 'desc',
  limit?: number,            // Default: 20
  offset?: number,           // For pagination
  status?: 'completed' | 'error' | 'all'
})
// Returns: { items: HistoryListItem[], total: number }

// Get full detail
historyService.getHistoryDetail(sessionId)
// Returns: HistoryDetail | null

// Get statistics
historyService.getStats()
// Returns: { totalVideos, totalAnalyses, averageScore, recentAnalyses }

// Search analyses
historyService.searchAnalyses(searchTerm, limit?)
// Returns: HistoryListItem[]
```

### Managing Data

```typescript
historyService.deleteAnalysis(sessionId)           // Delete analysis and related data
historyService.exportAnalysis(sessionId)           // Get JSON string for export
```

## Data Model

### HistoryListItem

```typescript
{
  id: string;               // Session ID
  videoId: string;
  filename: string;
  duration: number | null;  // seconds
  uploadedAt: string;       // ISO 8601
  analyzedAt: string;       // ISO 8601
  overallScore: number | null;  // 0-1
  status: 'completed' | 'error' | 'processing' | 'pending';
  issuesCritical: number;
  issuesMajor: number;
  issuesMinor: number;
  issuesSuggestion: number;
}
```

### HistoryDetail

```typescript
{
  // All HistoryListItem fields...
  transcription: string | null;
  categoryResults: Array<{
    category: string;
    score: number | null;
    response: unknown;  // Parsed JSON from Gemini
  }>;
  issues: Array<{
    id: number;
    session_id: string;
    category: string;
    severity: 'critical' | 'major' | 'minor' | 'suggestion';
    timestamp_start: number | null;
    timestamp_end: number | null;
    title: string;
    description: string;
    suggested_fix: string | null;
  }>;
}
```

## Usage Examples

### Example 1: Basic Integration

```typescript
import { useEffect } from 'react';
import { historyService } from '@/lib/database/history-service';

export default function App() {
  useEffect(() => {
    // Initialize database when app starts
    historyService.initialize();

    // Cleanup when app unmounts
    return () => historyService.shutdown();
  }, []);

  const handleUpload = async (file: File) => {
    const session = await uploadVideo(file);

    // Save to database
    historyService.saveVideo(session.metadata);

    return session;
  };

  const handleAnalyze = async (videoId: string) => {
    const result = await analyzeVideo(videoId);

    // Save to database
    historyService.saveAnalysis(videoId, transcriptionId, result);

    return result;
  };
}
```

### Example 2: Displaying History

```typescript
import { HistoryPage } from '@/components/history';

export default function HistoryTab() {
  return <HistoryPage />;
}
```

### Example 3: Custom History List

```typescript
import { historyService } from '@/lib/database/history-service';

export function MyHistoryList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const { items } = historyService.getHistory({
      sortBy: 'date',
      sortOrder: 'desc',
      limit: 10
    });
    setItems(items);
  }, []);

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.filename} - {item.overallScore ? Math.round(item.overallScore * 100) : 0}%
        </li>
      ))}
    </ul>
  );
}
```

### Example 4: Search and Filter

```typescript
export function HistorySearch() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const { items } = historyService.getHistory({
      search,
      sortBy: 'score',
      sortOrder: 'desc',
      status: 'completed'
    });
    setItems(items);
  }, [search]);

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul>{items.map(item => <li key={item.id}>{item.filename}</li>)}</ul>
    </>
  );
}
```

### Example 5: Export Analysis

```typescript
export function ExportButton({ sessionId }) {
  const handleExport = () => {
    const json = historyService.exportAnalysis(sessionId);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>Export JSON</button>;
}
```

## Error Handling

Always wrap database operations in try-catch:

```typescript
try {
  historyService.saveAnalysis(videoId, transcriptionId, analysis);
} catch (error) {
  console.error('Failed to save analysis:', error);
  // Continue without blocking main flow
  alert('Could not save analysis to history');
}
```

## Performance Tips

1. **Use Pagination**: Don't load all history at once

   ```typescript
   // Good
   const { items } = historyService.getHistory({ limit: 20, offset: page * 20 });

   // Avoid
   const { items } = historyService.getHistory({ limit: 10000 });
   ```

2. **Check Initialization**: Ensure database is ready

   ```typescript
   if (!historyService.isInitialized()) {
     historyService.initialize();
   }
   ```

3. **Close Connections**: Cleanup on unmount
   ```typescript
   useEffect(() => {
     return () => historyService.shutdown();
   }, []);
   ```

## Troubleshooting

### Database Locked

- Ensure you're calling `shutdown()` when the component unmounts
- Check for long-running transactions

### Missing Data

- Verify `historyService.isInitialized()` returns true
- Check console for initialization errors

### Type Errors

- Import types from `@/lib/database/schema`
- Ensure you're using the correct API method

### Performance Issues

- Use pagination instead of loading all data
- Check if indexes are created (should be automatic)

## Testing

```typescript
// Example Jest test
import { historyService } from '@/lib/database/history-service';

describe('History Service', () => {
  beforeEach(() => {
    historyService.initialize();
  });

  afterEach(() => {
    historyService.shutdown();
  });

  it('should save and retrieve analysis', () => {
    const videoId = historyService.saveVideo(metadata);
    const sessionId = historyService.saveAnalysis(videoId, null, analysis);

    const detail = historyService.getHistoryDetail(sessionId);
    expect(detail).toBeTruthy();
    expect(detail?.filename).toBe(metadata.filename);
  });
});
```

## Migration Notes

This module uses SQL migrations stored in `migrations/001_initial.sql`. To add schema changes:

1. Create a new migration file: `migrations/002_add_feature.sql`
2. Add your SQL changes
3. migrations run automatically on database initialization

## See Also

- [Full Implementation Guide](../../../docs/HISTORY_FEATURE_IMPLEMENTATION.md)
- [Database Schema](./schema.ts)
- [History Service API](./history-service.ts)
- [UI Components](../../components/history/)

## Support

For issues or questions:

1. Check the implementation guide for detailed examples
2. Review the API reference above
3. Look at the UI components for usage patterns
4. Check console for error messages
