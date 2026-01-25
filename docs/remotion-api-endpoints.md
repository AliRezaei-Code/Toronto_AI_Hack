# Remotion API Documentation

This document details the server-side rendering API endpoints that enable programmatic video generation and manipulation in our Remotion integration.

---

## Overview

The Remotion API provides three main endpoints for video processing:

1. **`POST /api/render`** - Render videos to MP4 format
2. **`GET /api/compositions`** - List available video compositions
3. **`POST /api/thumbnail`** - Generate still frames from videos

All endpoints handle JSON requests/responses and include proper error handling and validation.

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Authentication

Currently, the API does not require authentication. Add authentication middleware as needed for production deployments.

---

## 1. Render Video Endpoint

**Endpoint**: `POST /api/render`

Renders a video composition to MP4 format using server-side Remotion rendering.

### Request Body

```json
{
  "compositionId": "VideoEditor",
  "outputPath": "out/video.mp4",
  "inputProps": {
    "custom": "data",
    "title": "My Video",
    "userCount": 1000
  }
}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `compositionId` | `string` | Yes | ID of composition to render (must exist in Root.tsx) |
| `outputPath` | `string` | No | Output file path for rendered video |
| `inputProps` | `object` | No | Custom props to pass to the composition |

#### Composition IDs

Available compositions are defined in `src/remotion/Root.tsx`:

- **`VideoEditor`** - Landscape video (1920×1080, 300 frames)
- **`ShortForm`** - Vertical video (1080×1920, 180 frames)

### Request Example

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "VideoEditor",
    "outputPath": "rendered/my-video.mp4",
    "inputProps": {
      "title": "Custom Title",
      "subtitle": "Dynamic Content"
    }
  }'
```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "outputPath": "out/video.mp4",
  "result": {
    "size": 5242880,
    "durationInFrames": 300,
    "fps": 30
  },
  "message": "Video rendered successfully to out/video.mp4"
}
```

#### Error (400 Bad Request)

```json
{
  "error": "Composition ID is required",
  "details": "Missing required parameter: compositionId"
}
```

#### Error (500 Server Error)

```json
{
  "error": "Failed to render video",
  "details": "Composition 'InvalidId' not found"
}
```

### Implementation Details

```typescript
// Server-side rendering process
const bundled = await bundle(
  path.join(process.cwd(), 'src', 'remotion', 'index.ts')
);

const result = await renderMedia({
  composition: {
    id: compositionId,
    fps: 30,
    height: 1080,
    width: 1920,
    durationInFrames: 300,
    ...inputProps,
  },
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: outputPath,
  inputProps,
});

// Cleanup temporary bundle
fs.rmSync(bundled, { recursive: true });
```

---

## 2. List Compositions Endpoint

**Endpoint**: `GET /api/compositions`

Lists all available video compositions with their metadata and specifications.

### Request

```bash
curl http://localhost:3000/api/compositions
```

No parameters required.

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "compositions": [
    {
      "id": "VideoEditor",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "durationInFrames": 300,
      "durationInSeconds": 10,
      "defaultProps": {}
    },
    {
      "id": "ShortForm", 
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "durationInFrames": 180,
      "durationInSeconds": 6,
      "defaultProps": {}
    }
  ]
}
```

#### Error (500 Server Error)

```json
{
  "error": "Failed to get compositions",
  "details": "Could not bundle Remotion project"
}
```

### Implementation Details

```typescript
const compositions = await getCompositions(bundled);

return NextResponse.json({
  success: true,
  compositions: compositions.map(comp => ({
    id: comp.id,
    width: comp.width,
    height: comp.height,
    fps: comp.fps,
    durationInFrames: comp.durationInFrames,
    durationInSeconds: comp.durationInFrames / comp.fps,
    defaultProps: comp.defaultProps,
  })),
});
```

---

## 3. Generate Thumbnail Endpoint

**Endpoint**: `POST /api/thumbnail`

Generates a still image (thumbnail) from a specific frame of a video composition.

### Request Body

```json
{
  "compositionId": "VideoEditor",
  "frame": 150,
  "outputPath": "out/thumbnail.png",
  "inputProps": {
    "title": "Thumbnail Title"
  }
}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `compositionId` | `string` | Yes | ID of composition to capture frame from |
| `frame` | `number` | No | Frame number to capture (default: 0) |
| `outputPath` | `string` | No | Output file path for thumbnail image |
| `inputProps` | `object` | No | Custom props to pass to composition |

### Request Example

```bash
curl -X POST http://localhost:3000/api/thumbnail \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "VideoEditor",
    "frame": 75,
    "outputPath": "thumbnails/frame-75.png"
  }'
```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "outputPath": "out/thumbnail.png",
  "frame": 75,
  "message": "Thumbnail rendered successfully to out/thumbnail.png"
}
```

#### Error (400 Bad Request)

```json
{
  "error": "Composition ID is required",
  "details": "Missing required parameter: compositionId"
}
```

### Implementation Details

```typescript
await renderStill({
  composition: {
    id: compositionId,
    fps: 30,
    height: 1080,
    width: 1920,
    durationInFrames: 300,
    ...inputProps,
  },
  serveUrl: bundled,
  output: outputPath,
  inputProps,
});
```

---

## Error Handling

### Common Error Codes

| Status | Error Type | Description |
|---------|------------|-------------|
| 400 | Bad Request | Missing or invalid parameters |
| 500 | Server Error | Rendering failure or system error |

### Error Response Format

All errors follow this consistent format:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details or original error message"
}
```

### Common Scenarios

1. **Invalid Composition ID**: Composition doesn't exist in Root.tsx
2. **Rendering Timeout**: Video too complex or server resources limited
3. **File System Errors**: Invalid output path or permission issues
4. **Memory Issues**: Large video exceeds available memory

---

## Client Integration

### JavaScript/TypeScript Example

```typescript
interface RenderRequest {
  compositionId: string;
  outputPath?: string;
  inputProps?: Record<string, any>;
}

class RemotionAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async renderVideo(request: RenderRequest): Promise<any> {
    const response = await fetch(`${this.baseURL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async getCompositions(): Promise<any> {
    const response = await fetch(`${this.baseURL}/compositions`);
    return response.json();
  }

  async generateThumbnail(
    compositionId: string, 
    frame: number = 0
  ): Promise<any> {
    const response = await fetch(`${this.baseURL}/thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compositionId, frame }),
    });

    return response.json();
  }
}

// Usage
const api = new RemotionAPI('http://localhost:3000/api');

// Get available compositions
const compositions = await api.getCompositions();
console.log('Available:', compositions);

// Render video
const result = await api.renderVideo({
  compositionId: 'VideoEditor',
  outputPath: 'my-render.mp4',
  inputProps: { title: 'My Custom Video' }
});

// Generate thumbnail
const thumbnail = await api.generateThumbnail('VideoEditor', 75);
console.log('Thumbnail:', thumbnail);
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

export const useRemotionAPI = (baseURL: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderVideo = useCallback(async (request: RenderRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseURL}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  return { renderVideo, loading, error };
};

// Usage in component
export const VideoRenderer = () => {
  const { renderVideo, loading, error } = useRemotionAPI('http://localhost:3000/api');

  const handleRender = async () => {
    try {
      await renderVideo({
        compositionId: 'VideoEditor',
        inputProps: { title: 'Dynamic Video' }
      });
      console.log('Render completed!');
    } catch (err) {
      console.error('Render failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleRender} disabled={loading}>
        {loading ? 'Rendering...' : 'Render Video'}
      </button>
      {error && <div className="error">Error: {error}</div>}
    </div>
  );
};
```

---

## Performance Considerations

### Server-Side Optimization

1. **Memory Management**: Large videos require significant RAM
2. **Processing Time**: Rendering is CPU-intensive
3. **Disk Space**: Temporary files and outputs consume storage
4. **Concurrent Requests**: Limit simultaneous renders

### Best Practices

1. **Queue Management**: Implement job queue for multiple requests
2. **Progress Tracking**: Provide render progress updates
3. **Cleanup**: Remove temporary files after completion
4. **Monitoring**: Log performance metrics and errors

### Scaling Strategies

```typescript
// Example: Simple in-memory queue
class RenderQueue {
  private queue: RenderRequest[] = [];
  private processing = false;

  async add(request: RenderRequest): Promise<void> {
    this.queue.push(request);
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await this.renderWithRetry(request);
    }
    
    this.processing = false;
  }

  private async renderWithRetry(request: RenderRequest): Promise<void> {
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.render(request);
        return;
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
      }
    }
  }
}
```

---

## Testing

### Unit Testing

```typescript
import { renderVideo, getCompositions, generateThumbnail } from '../api';

describe('Remotion API', () => {
  it('should list compositions', async () => {
    const result = await getCompositions();
    
    expect(result.success).toBe(true);
    expect(result.compositions).toHaveLength(2);
    expect(result.compositions[0].id).toBe('VideoEditor');
  });

  it('should render video', async () => {
    const result = await renderVideo({
      compositionId: 'VideoEditor',
      outputPath: 'test-output.mp4'
    });
    
    expect(result.success).toBe(true);
    expect(result.outputPath).toBe('test-output.mp4');
  });

  it('should handle errors', async () => {
    await expect(
      renderVideo({ compositionId: 'InvalidId' })
    ).rejects.toThrow('Composition not found');
  });
});
```

### Integration Testing

```bash
# Test render endpoint
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{"compositionId": "VideoEditor"}'

# Test compositions endpoint  
curl http://localhost:3000/api/compositions

# Test thumbnail endpoint
curl -X POST http://localhost:3000/api/thumbnail \
  -H "Content-Type: application/json" \
  -d '{"compositionId": "VideoEditor", "frame": 50}'
```

---

## Security Considerations

### Input Validation

```typescript
// Validate composition ID
const validCompositions = ['VideoEditor', 'ShortForm'];
if (!validCompositions.includes(compositionId)) {
  return NextResponse.json(
    { error: 'Invalid composition ID' },
    { status: 400 }
  );
}

// Sanitize file paths
const safeOutputPath = outputPath.replace(/\.\./g, '').replace(/\.\./g, '');
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/render', limiter);
```

### File System Security

```typescript
// Restrict output directory
const allowedDirectories = ['/tmp/', './out/', './renders/'];
const isPathSafe = allowedDirectories.some(dir => 
  outputPath.startsWith(dir)
);

if (!isPathSafe) {
  return NextResponse.json(
    { error: 'Invalid output path' },
    { status: 400 }
  );
}
```

---

## Deployment

### Environment Variables

```env
# Remotion Configuration
REMOTION_OUTPUT_DIR=/app/renders
REMOTION_TEMP_DIR=/tmp/remotion
REMOTION_MAX_CONCURRENT=2

# Performance
NODE_OPTIONS=--max-old-space-size=4096
RENDER_TIMEOUT=300000
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set environment
ENV NODE_OPTIONS=--max-old-space-size=4096

# Create output directory
RUN mkdir -p /app/renders
ENV REMOTION_OUTPUT_DIR=/app/renders

# Copy application
COPY . /app
WORKDIR /app

# Expose API
EXPOSE 3000

CMD ["npm", "start"]
```

### Monitoring

```typescript
// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Log performance metrics
app.post('/api/render', async (req, res) => {
  const startTime = Date.now();
  
  try {
    await renderVideo(req.body);
    
    console.log(`Render completed in ${Date.now() - startTime}ms`);
    res.json({ success: true });
  } catch (error) {
    console.error(`Render failed:`, error);
    res.status(500).json({ error: error.message });
  }
});
```

---

This API documentation provides complete guidance for integrating Remotion's server-side rendering capabilities into any application.