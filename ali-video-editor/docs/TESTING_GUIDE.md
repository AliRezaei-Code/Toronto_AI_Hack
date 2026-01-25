# Video Copilot - Testing Guide

## Overview

This guide documents the comprehensive, production-grade testing infrastructure for the Video Copilot application. The testing suite follows SOLID principles, is DRY, modular, fast, secure, and includes proper logging throughout.

## Architecture

### Phase 1: Foundation ✅

#### Test Configuration

- **Jest Configuration**: Comprehensive setup with multiple environments
- **Test Environments**: Separate configs for unit, integration, and E2E tests
- **Coverage Thresholds**: Enforced quality gates (80% line, 75% branch)
- **Test Reporters**: Multiple output formats for CI/CD integration

#### Test Utilities Infrastructure

##### Factories (`src/test-utils/factories/`)

Hybrid factory pattern using faker for dynamic data + fixtures for edge cases:

- **TranscriptionFactory**: Generates realistic transcription results
  - `create()`: Standard transcription with overrides
  - `createHighConfidence()`: 95%+ confidence
  - `createLowConfidence()`: 60-80% confidence
  - `createShort()`: 2-5 segments
  - `createLong()`: 100-500 segments

- **RetentionAnalysisFactory**: Generates retention analysis data
  - `create()`: Standard analysis
  - `createHighEngagement()`: High retention scores
  - `createLowEngagement()`: Low retention scores

- **AIInsightsFactory**: Generates AI insights
  - `create()`: Complete insights with all fields
  - `createHighImpact()`: 60-80% improvement potential
  - `createLowImpact()`: 10-30% improvement potential

##### Mocks (`src/test-utils/mocks/`)

Interface-based mocking with configurable behavior:

- **MockGeminiService**: Typed mock for AI service
  - Configurable responses per category
  - Simulated delays for performance testing
  - Error simulation capabilities
  - Custom response injection

- **MockLogger**: Typed mock for logging service
  - Log capture and inspection
  - Log filtering by level
  - Error simulation

##### Helpers (`src/test-utils/helpers/`)

Reusable test utilities:

- **PerformanceTracker**: Measure and assert test execution times
- **AsyncHelper**: Retry, polling, and waiting utilities
- **AssertionHelper**: Custom assertions for complex validations
- **MockSetupHelper**: Centralized mock management
- **TestContext**: Setup/teardown orchestration
- **ValidationHelper**: Data validation utilities

#### Logging System

- **TestLogger**: Singleton logger for test execution tracking
- **Structured Logging**: Correlation IDs, performance metrics
- **Log Aggregation**: Ready for CI analysis

### Phase 2: Core Service Testing ✅

#### InsightsService Tests (`src/__tests__/unit/services/insights-service.test.ts`)

Comprehensive unit tests covering:

**Test Suites:**

1. **Singleton Pattern** (2 tests)
   - Instance consistency
   - Single instance enforcement

2. **generateInsights** (8 tests)
   - Successful generation
   - Progress callbacks
   - Keyframe handling
   - Original metadata support
   - Error handling
   - Edge cases (empty, long, short transcriptions)
   - Logging verification

3. **generateScriptSuggestions** (3 tests)
   - Generation from Gemini
   - Category filtering
   - Error handling

4. **generateVisualRecommendations** (2 tests)
   - Generation from Gemini
   - Category filtering

5. **generatePacingSuggestions** (2 tests)
   - Generation from Gemini
   - Category filtering

6. **generateSEOMetadata** (7 tests)
   - Complete metadata generation
   - Keyword extraction
   - Tag generation
   - Thumbnail suggestions
   - SEO score calculation
   - Error handling

7. **calculateComprehensiveImprovement** (2 tests)
   - Breakdown calculation
   - Factor inclusion validation

8. **generateTopInsights** (3 tests)
   - Exact count validation
   - Prioritization
   - Priority inclusion

9. **Performance** (1 test)
   - Execution time validation (< 1s for mocks)

10. **Edge Cases** (3 tests)
    - Long transcriptions
    - Short transcriptions
    - Low confidence

**Total: 33 comprehensive tests**

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test insights-service.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test Suite

```bash
npm test -- --testNamePattern="Singleton Pattern"
```

## Test Structure

```
src/
├── __tests__/
│   ├── unit/              # Pure unit tests
│   │   ├── services/      # Service layer tests
│   │   ├── components/    # React component tests
│   │   └── hooks/         # Custom hook tests
│   ├── integration/       # Service integration tests
│   ├── api/              # API endpoint tests
│   └── e2e/              # End-to-end tests
├── test-utils/
│   ├── factories/        # Test data factories
│   ├── mocks/           # Mock implementations
│   ├── fixtures/        # Test fixtures
│   ├── helpers/         # Test helper functions
│   └── setup/           # Global test setup
└── test-config/
    ├── jest.config.js   # Jest configuration
    ├── test-setup.ts    # Global test setup
    └── test-types.ts    # Test-specific types
```

## Writing Tests

### Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { TranscriptionFactory } from "@/test-utils";
import { createMockGeminiService } from "@/test-utils/mocks";

describe("ServiceName", () => {
  let mockGeminiService: MockGeminiService;

  beforeEach(() => {
    mockGeminiService = createMockGeminiService();
    // Setup mocks
  });

  afterEach(() => {
    mockGeminiService.reset();
    // Cleanup
  });

  describe("methodName", () => {
    it("should do something", async () => {
      // Arrange
      const testData = TranscriptionFactory.create();

      // Act
      const result = await service.methodName(testData);

      // Assert
      expect(result).toBeDefined();
      expect(result.property).toBe(expectedValue);
    });
  });
});
```

### Using Factories

```typescript
import { TranscriptionFactory, RetentionAnalysisFactory } from "@/test-utils";

// Create standard data
const transcription = TranscriptionFactory.create();

// Create with overrides
const customTranscription = TranscriptionFactory.create({
  confidence: 0.95,
  language: "es",
});

// Use specialized factories
const highConfidence = TranscriptionFactory.createHighConfidence();
const longVideo = TranscriptionFactory.createLong();
```

### Using Mocks

```typescript
import { createMockGeminiService } from "@/test-utils/mocks";

// Create and configure mock
const mockService = createMockGeminiService({
  shouldReject: false,
  delay: 100,
  customResponses: {
    "scripting-video123": { issues: [...] },
  },
});

// Use in tests
jest.mock("@/lib/ai/gemini-service", () => ({
  geminiService: mockService,
}));
```

### Using Helpers

```typescript
import {
  PerformanceTracker,
  AssertionHelper,
  ValidationHelper,
} from "@/test-utils";

// Track performance
const tracker = new PerformanceTracker();
tracker.start();
// ... run test
tracker.stop();
tracker.assertDurationBelow(1000); // Assert < 1s

// Custom assertions
AssertionHelper.hasRequiredProperties(obj, ["id", "name"]);
AssertionHelper.arrayLengthInRange(arr, 1, 10);
AssertionHelper.numberInRange(value, 0, 1);

// Validation
ValidationHelper.isValidUUID(uuid);
ValidationHelper.isPastDate(date);
```

## Coverage Requirements

### Unit Tests

- **Line Coverage**: 90% minimum
- **Branch Coverage**: 85% minimum

### Integration Tests

- **Line Coverage**: 75% minimum
- **Branch Coverage**: 70% minimum

### Overall

- **Line Coverage**: 80% minimum
- **Branch Coverage**: 75% minimum
- **Critical Paths**: 95% coverage mandatory

## Performance Standards

- **Unit Tests**: < 2 seconds total
- **Integration Tests**: < 30 seconds total
- **Full Test Suite**: < 5 minutes in CI
- **Individual Test**: < 100ms average

## Security Requirements

### API Key Management

- All API keys must use test-specific values
- Never use production keys in tests
- Mock all external services

### Data Sanitization

- Use faker for dynamic data generation
- No real user information in fixtures
- Sanitize test logs

### Environment Isolation

- Tests must not affect production
- Separate test databases
- Isolated test environments

## CI/CD Integration

### GitHub Actions Workflow

The testing suite is integrated into `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

### Quality Gates

- **Coverage Thresholds**: Enforced via Jest
- **Test Execution**: All tests must pass
- **Linting**: No linting errors allowed
- **Type Safety**: No TypeScript errors

## Best Practices

### SOLID Principles

1. **Single Responsibility**
   - Each test file tests one unit
   - Each test validates one behavior

2. **Open/Closed**
   - Test utilities are extensible
   - Factories support overrides

3. **Liskov Substitution**
   - Mocks can replace real implementations
   - Interface-based mocking

4. **Interface Segregation**
   - Focused test interfaces
   - Segregated mock functionality

5. **Dependency Inversion**
   - High-level tests depend on abstractions
   - Mock implementations

### DRY Principles

- **Reuse Test Utilities**: Use factories, helpers, mocks
- **Shared Setup/Teardown**: Use beforeEach/afterEach
- **Centralized Configuration**: jest.config.js
- **Reusable Assertions**: AssertionHelper methods

### Security

- **No Real API Keys**: Use mock services
- **Sanitized Logs**: Remove sensitive data
- **Isolated Environments**: Test-specific databases
- **Secure Defaults**: Mock services return safe defaults

### Performance

- **Fast Execution**: Mock external services
- **Parallel Tests**: Jest runs tests in parallel
- **Efficient Data**: Use factory pattern
- **Smart Selection**: Run only relevant tests

## Troubleshooting

### Tests Failing

1. Check if mocks are properly configured
2. Verify factory data is valid
3. Review error messages in Jest output
4. Check logs in test output

### Coverage Issues

1. Identify uncovered lines in coverage report
2. Add tests for uncovered paths
3. Review edge cases
4. Check error handling paths

### Performance Issues

1. Check for unnecessary delays in tests
2. Verify mocks are fast
3. Review test data size
4. Optimize factory generation

## Future Enhancements

### Phase 3: Component Testing

- React component tests with RTL
- User interaction testing
- Accessibility testing
- Visual regression testing

### Phase 4: API Testing

- API endpoint tests
- Request/response validation
- Authentication testing
- Rate limiting tests

### Phase 5: E2E Testing

- Playwright configuration
- Critical workflow tests
- Cross-browser testing
- Performance testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Support

For questions or issues with the testing suite:

1. Review this guide
2. Check test file examples
3. Review jest.config.js
4. Contact the development team

---

**Last Updated**: January 24, 2026
**Version**: 1.0.0
