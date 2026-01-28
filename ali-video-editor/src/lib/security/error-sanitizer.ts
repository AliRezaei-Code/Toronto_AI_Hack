/**
 * Video Copilot - Error Sanitization Utility
 *
 * Sanitizes error messages before sending to clients to prevent
 * information disclosure. Full errors are logged server-side.
 *
 * @module error-sanitizer
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Patterns that may indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  // File system paths
  /\/Users\/[^/\s]+/gi,
  /\/home\/[^/\s]+/gi,
  /C:\\Users\\[^\\]+/gi,
  /\/var\/[^\s]+/gi,
  /\/tmp\/[^\s]+/gi,
  /\/etc\/[^\s]+/gi,

  // API keys and tokens
  /api[_-]?key[=:]\s*\S+/gi,
  /token[=:]\s*\S+/gi,
  /secret[=:]\s*\S+/gi,
  /password[=:]\s*\S+/gi,
  /Bearer\s+\S+/gi,

  // Database connection strings
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /postgres(ql)?:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,

  // IP addresses and hosts
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g,
  /localhost:\d+/gi,

  // Stack traces (Node.js specific)
  /at\s+\S+\s+\([^)]+\)/g,
  /at\s+\S+\s+\([^)]+:[0-9]+:[0-9]+\)/g,

  // Environment variables
  /process\.env\.\w+/gi,
];

/**
 * Map of internal error types to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  ENOENT: "The requested file was not found",
  EACCES: "Access denied to the requested resource",
  EPERM: "Operation not permitted",
  ECONNREFUSED: "Unable to connect to the service",
  ETIMEDOUT: "The operation timed out",
  ENOMEM: "Server is temporarily unavailable",
  ENOSPC: "Server storage is full",
  EMFILE: "Server is too busy, please try again",
  ECONNRESET: "Connection was lost, please try again",
};

// ============================================================================
// Types
// ============================================================================

export interface SanitizedError {
  /** User-safe error message */
  message: string;
  /** Error code if available */
  code?: string;
  /** Whether this is a client error (4xx) vs server error (5xx) */
  isClientError: boolean;
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize an error for client response
 *
 * @param error - The error to sanitize
 * @param fallbackMessage - Message to use if sanitization removes everything
 * @returns Sanitized error safe for client response
 */
export function sanitizeError(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
): SanitizedError {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return {
      message: fallbackMessage,
      isClientError: false,
    };
  }

  // Extract error information
  let message: string;
  let code: string | undefined;
  let isClientError = false;

  if (error instanceof Error) {
    message = error.message;
    code = (error as NodeJS.ErrnoException).code;

    // Check for common client errors
    if (
      message.includes("validation") ||
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("missing")
    ) {
      isClientError = true;
    }
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message);
    if ("code" in error) {
      code = String((error as { code: unknown }).code);
    }
  } else {
    message = fallbackMessage;
  }

  // Check for known error codes
  if (code && code in ERROR_MESSAGE_MAP) {
    const message = ERROR_MESSAGE_MAP[code];
    if (!message) {
      // Fallback to unknown error if no specific message exists
      return {
        message: "An unknown error occurred",
        code,
        isClientError: false,
      };
    }
    return {
      message,
      code,
      isClientError: false,
    };
  }

  // Sanitize the message
  let sanitizedMessage = message;

  // Remove sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitizedMessage = sanitizedMessage.replace(pattern, "[REDACTED]");
  }

  // If the message is now mostly redacted or empty, use fallback
  const redactedCount = (sanitizedMessage.match(/\[REDACTED\]/g) || []).length;
  const wordCount = sanitizedMessage.split(/\s+/).length;

  if (redactedCount > wordCount / 2 || sanitizedMessage.trim().length < 10) {
    sanitizedMessage = fallbackMessage;
  }

  // Truncate very long messages
  if (sanitizedMessage.length > 500) {
    sanitizedMessage = sanitizedMessage.substring(0, 497) + "...";
  }

  return {
    message: sanitizedMessage,
    code,
    isClientError,
  };
}

/**
 * Create a sanitized error response for Next.js API routes
 *
 * @param error - The error to handle
 * @param operation - Description of what operation failed
 * @returns Object suitable for NextResponse.json()
 */
export function createErrorResponse(
  error: unknown,
  operation: string = "process request"
): { error: string; code?: string } {
  const sanitized = sanitizeError(
    error,
    `Failed to ${operation}. Please try again later.`
  );

  return {
    error: sanitized.message,
    ...(sanitized.code && { code: sanitized.code }),
  };
}

/**
 * Get appropriate HTTP status code for an error
 *
 * @param error - The error to analyze
 * @returns HTTP status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error === null || error === undefined) {
    return 500;
  }

  // Check for error code
  let code: string | undefined;
  if (error instanceof Error) {
    code = (error as NodeJS.ErrnoException).code;
  } else if (typeof error === "object" && error !== null && "code" in error) {
    code = String((error as { code: unknown }).code);
  }

  // Map error codes to status codes
  if (code === "ENOENT") {
    return 404;
  }
  if (code === "EACCES" || code === "EPERM") {
    return 403;
  }
  if (code === "ETIMEDOUT") {
    return 504;
  }

  // Check error message for clues
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();

  if (
    message.includes("not found") ||
    message.includes("does not exist")
  ) {
    return 404;
  }

  if (
    message.includes("unauthorized") ||
    message.includes("authentication")
  ) {
    return 401;
  }

  if (
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("access denied")
  ) {
    return 403;
  }

  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("missing")
  ) {
    return 400;
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return 429;
  }

  // Default to 500 for server errors
  return 500;
}

// ============================================================================
// Exports
// ============================================================================

export const errorSanitizer = {
  sanitizeError,
  createErrorResponse,
  getErrorStatusCode,
};
