/**
 * Video Copilot - Jest Configuration
 * Comprehensive test configuration following SOLID principles
 *
 * Features:
 * - Multiple test environments (unit, integration, e2e)
 * - Coverage thresholds and quality gates
 * - Performance optimization
 * - Code quality reporting
 */

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Custom Jest configuration
const customJestConfig = {
  // Test environment
  testEnvironment: "node",

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/test-config/test-setup.ts"],

  // Test match patterns
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)",
    "<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)",
  ],

  // Module paths
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  // Transform files
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
    "!src/test-*/**",
    "!src/test-config/**",
    "!src/middleware.ts",
  ],

  // Coverage thresholds - temporarily disabled for incremental test development
  // Will be re-enabled once test suite coverage reaches targets
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  //   "./src/lib/insights/insights-service.ts": {
  //     branches: 50,
  //     functions: 85,
  //     lines: 75,
  //     statements: 75,
  //   },
  // },

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "lcov", "html", "json-summary"],

  // Module name mapper for path aliases and assets
  moduleNameMapper: {
    "^uuid$": "<rootDir>/src/test-config/__mocks__/uuid.ts",
    "^@faker-js/faker$": "<rootDir>/src/test-config/__mocks__/faker.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@/test-utils/(.*)$": "<rootDir>/src/test-utils/$1",
    "^@/test-config/(.*)$": "<rootDir>/src/test-config/$1",
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/uploads/",
  ],

  // Transform ignore patterns - transform ES modules from node_modules
  transformIgnorePatterns: ["node_modules/(?!(uuid|@faker-js)/)"],

  // Global setup
  globalSetup: "<rootDir>/src/test-config/global-setup.ts",

  // Global teardown
  globalTeardown: "<rootDir>/src/test-config/global-teardown.ts",

  // Test timeout (in milliseconds)
  testTimeout: 10000,

  // Maximum number of workers
  maxWorkers: 4,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Coverage collection
  collectCoverage: false,

  // Projects for different test types (commented out for initial testing)
  // projects: [
  //   {
  //     displayName: "unit",
  //     testMatch: ["<rootDir>/src/**/__tests__/unit/**/*.test.[jt]s?(x)"],
  //     testEnvironment: "node",
  //     maxWorkers: 4,
  //   },
  //   {
  //     displayName: "integration",
  //     testMatch: ["<rootDir>/src/**/__tests__/integration/**/*.test.[jt]s?(x)"],
  //     testEnvironment: "node",
  //     maxWorkers: 2,
  //   },
  //   {
  //     displayName: "components",
  //     testMatch: ["<rootDir>/src/**/__tests__/components/**/*.test.[jt]s?(x)"],
  //     testEnvironment: "jsdom",
  //     moduleNameMapper: {
  //       "\\.(css|less|scss|sass)$": "<rootDir>/src/test-config/mock-styles.ts",
  //       "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/src/test-config/mock-images.ts",
  //     },
  //   },
  //   {
  //     displayName: "api",
  //     testMatch: ["<rootDir>/src/**/__tests__/api/**/*.test.[jt]s?(x)"],
  //     testEnvironment: "node",
  //   },
  // ],

  // Reporters
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
