# YouTube Thumbnail Generator Module

A production-ready thumbnail generation module for the Video Copilot application. This module generates eye-catching YouTube thumbnails using HuggingFace's text-to-image models with automatic fallback, caching, and resilience patterns.

## Features

- ✅ **Clean Architecture**: Domain, Application, and Infrastructure layers following SOLID principles
- ✅ **Automatic Fallback**: Seamless switch between specialized and fallback models
- ✅ **Fast Caching**: In-memory cache to avoid regenerating identical thumbnails
- ✅ **Circuit Breaker**: Prevents cascading failures with automatic recovery
- ✅ **Retry Logic**: Exponential backoff for transient failures
- ✅ **Security**: Input validation, PII filtering, and prompt redaction
- ✅ **Structured Logging**: Comprehensive logging with sensitive data redaction
- ✅ **Type Safety**: Full TypeScript support with Zod validation schemas

## Architecture

### Layer Structure

```
src/lib/thumbnail/
├── domain/                    # Core business logic and types
│   ├── entities.ts           # Domain entities (ThumbnailRequest, etc.)
│   ├── value-objects.ts      # Value objects (ThumbnailStyle, BrandOptions)
│   ├── ports.ts              # Interface contracts (Dependency Inversion)
│   ├── errors.ts             # Domain-specific error types
│   └── index.ts              # Domain exports
├── application/              # Use cases and orchestration
│   ├── thumbnail-service.ts  # Main service (singleton)
│   ├── prompt-builder.ts     # Style-specific prompt construction
│   ├── input-validator.ts    # Zod schemas + content filtering
│   ├── style-configs.ts      # Style configurations
│   └── index.ts              # Application exports
├── infrastructure/           # External dependencies
│   ├── huggingface-adapter.ts # HF API client with retry/timeout
│   ├── circuit-breaker.ts    # Circuit breaker pattern
│   ├── cache.ts              # In-memory cache implementation
│   └── index.ts              # Infrastructure exports
└── index.ts                  # Module exports
```

### Key Patterns

1. **Singleton Service**: `ThumbnailService` follows the same pattern as `GeminiService`
2. **Port/Adapter Pattern**: Clean separation of interfaces and implementations
3. **Strategy Pattern**: Specialized vs. Fallback generation strategies
4. **Circuit Breaker**: Resilience against provider failures
5. **Factory Pattern**: Centralized creation of adapters and circuit breakers

## Usage

### Server-Side Usage

```typescript
import { thumbnailService, createThumbnailRequest } from '@/lib/thumbnail';

// Initialize service (usually done at startup)
thumbnailService.initialize(process.env.HUGGINGFACE_API_TOKEN);

// Generate a thumbnail
const request = createThumbnailRequest({
  titleText: "Epic News",
  topic: "gaming news",
  style: "GAMING",
  brandOptions: {
    primaryColor: "#7B2CBF",
    accentColor: "#E500A4",
    fontStyle: "playful",
  },
  guidanceScale: 7.5,
  numInferenceSteps: 30,
  seed: 42,
});

const result = await thumbnailService.generateThumbnail(request);

console.log(`Generated: ${result.id}`);
console.log(`Model: ${result.model} (${result.strategy})`);
console.log(`Latency: ${result.latencyMs}ms`);
```

### Client-Side Usage (React Hook)

```typescript
import { useThumbnailGeneration } from '@/hooks/useThumbnailGeneration';

function ThumbnailGenerator() {
  const { status, result, error, generate } = useThumbnailGeneration();

  const handleGenerate = async () => {
    await generate({
      titleText: "Amazing Discovery",
      topic: "science",
      style: "HIGH_ENERGY",
    });
  };

  return (
    <div>
      <button onClick={handleGenerate}>
        {status === 'generating' ? 'Generating...' : 'Generate Thumbnail'}
      </button>

      {status === 'error' && <p>Error: {error}</p>}

      {status === 'success' && result && (
        <img src={result.imageData} alt="Generated thumbnail" />
      )}
    </div>
  );
}
```

### API Usage

```bash
# Generate thumbnail
curl -X POST http://localhost:3000/api/thumbnails/generate \
  -H "Content-Type: application/json" \
  -d '{
    "titleText": "Epic News",
    "topic": "gaming",
    "style": "GAMING",
    "brandOptions": {
      "primaryColor": "#7B2CBF",
      "accentColor": "#E500A4"
    }
  }'

# Get thumbnail history
curl http://localhost:3000/api/thumbnails/history?limit=20
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
HUGGINGFACE_API_TOKEN=hf_your_token_here
```

### Style Options

Four preset styles are available:

- **HIGH_ENERGY**: Vibrant, bold, high-contrast colors with dynamic poses
- **MINIMAL_TECH**: Clean, minimalist, modern aesthetic
- **FINANCE**: Professional, authoritative, data-focused
- **GAMING**: Neon glow effects, action-packed, energetic

### Brand Options

Customize thumbnails with brand colors:

```typescript
{
  primaryColor: "#FF0000",    // Primary brand color (hex)
  accentColor: "#FFFF00",     // Accent brand color (hex)
  fontStyle: "bold"           // Font style: bold | modern | playful | professional
}
```

## HuggingFace Models

### Specialized Model

- **Model**: `black-forest-labs/FLUX.1-Kontext-dev`
- **LoRA**: `fal/Youtube-Thumbnails-Kontext-Dev-LoRA`
- **Trigger Phrase**: `Generate youtube thumbnails using text "{title}"`
- **Use Case**: Primary choice for YouTube-optimized thumbnails

### Fallback Model

- **Model**: `black-forest-labs/FLUX.1-schnell`
- **LoRA**: None
- **Use Case**: Backup when specialized model fails or is rate-limited

## Security

### Input Validation

- **Title Length**: 2-7 words, 2-100 characters
- **Topic Length**: 1-200 characters
- **PII Detection**: Automatically blocks emails, phone numbers, SSNs
- **Content Filtering**: Blocks inappropriate words/phrases
- **URL Validation**: Validates face image URLs

### Prompt Redaction

Prompts are automatically redacted in logs to prevent sensitive data leakage:

```typescript
// Original prompt: "Generate youtube thumbnails using text 'My Secret Title' vibrant colors"
// Logged as: "Generate youtube thumbnails using text 'My Secret'...[REDACTED]"
```

### Error Handling

All errors are sanitized before being returned to users:

```typescript
try {
  await thumbnailService.generateThumbnail(request);
} catch (error) {
  // Returns user-friendly message, never exposes internal details
  console.error(error); // Logs full error for debugging
}
```

## Resilience Patterns

### Circuit Breaker

Prevents cascading failures by stopping calls to failing providers:

- **Failure Threshold**: 5 consecutive failures
- **Reset Timeout**: 60 seconds
- **Half-Open State**: Trial requests after timeout

### Retry Logic

Automatic retry with exponential backoff:

- **Max Retries**: 3
- **Base Delay**: 1000ms
- **Backoff Multiplier**: 2x
- **Max Delay**: 10000ms
- **Retryable Status Codes**: 429, 503, 504

### Caching

In-memory cache to avoid regenerating identical thumbnails:

- **Max Cache Size**: 100 entries
- **Default TTL**: 1 hour
- **Eviction Policy**: Oldest-first

## Performance

### Typical Performance

- **Generation Time**: 5-15 seconds (varies by model and complexity)
- **Cache Hit**: < 1ms (instant return)
- **Fallback Time**: 8-20 seconds (if specialized fails)

### Optimization Tips

1. **Use Caching**: Same prompts return cached results
2. **Specify Seed**: For reproducible results (useful for testing)
3. **Adjust Steps**: Lower `numInferenceSteps` for faster generation
4. **Monitor Circuit Breaker**: Avoid hammering failing providers

## Testing

### Unit Tests

```typescript
// Test prompt builder
import { buildPrompt } from '@/lib/thumbnail/application/prompt-builder';

const prompt = buildPrompt("Test", "HIGH_ENERGY", "gaming");
expect(prompt).toContain('Generate youtube thumbnails using text "Test"');
```

### Mock Tests

```typescript
// Mock HuggingFace adapter
vi.mock('@/lib/thumbnail/infrastructure/huggingface-adapter', () => ({
  HuggingFaceAdapterFactory: {
    getSpecialized: vi.fn(() => mockAdapter),
  },
}));
```

## Troubleshooting

### Common Issues

**Error: "HUGGINGFACE_API_TOKEN is required"**

- Solution: Add `HUGGINGFACE_API_TOKEN` to your `.env` file

**Error: "Circuit breaker is open"**

- Solution: Wait 60 seconds for automatic reset, or restart the service

**Slow generation times**

- Solution: Reduce `numInferenceSteps` parameter (try 20 instead of 30)

**Poor image quality**

- Solution: Increase `numInferenceSteps` or `guidanceScale` parameters

## Future Enhancements

- [ ] Image-to-image generation (face URL integration)
- [ ] Batch thumbnail generation
- [ ] A/B testing with click-through rate tracking
- [ ] Custom style templates
- [ ] Video frame extraction for thumbnail background
- [ ] Advanced text overlay options
- [ ] Persistent cache (Redis/Database)

## Contributing

When extending this module:

1. Follow the established layer structure
2. Use the singleton pattern for services
3. Add comprehensive error handling
4. Include prompt redaction for all logs
5. Write unit tests for new features
6. Update this README

## License

Part of the Video Copilot project. See main project LICENSE file.
