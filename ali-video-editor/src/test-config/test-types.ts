/**
 * Video Copilot - Test Types
 * Global type declarations for testing
 */

declare global {
  let __TEST__: boolean;
  let __MOCKED_SERVICES__: {
    gemini?: boolean;
    deepgram?: boolean;
    database?: boolean;
  };
}

export interface MockOptions {
  shouldReject?: boolean;
  rejectWith?: Error;
  delay?: number;
}

export interface TestSuiteConfig {
  timeout?: number;
  retries?: number;
  skip?: boolean;
  only?: boolean;
}

export interface TestContext {
  testLogger: any;
  mockServices: Record<string, any>;
  testData: Record<string, any>;
}
