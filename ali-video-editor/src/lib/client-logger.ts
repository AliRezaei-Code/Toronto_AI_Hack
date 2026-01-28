/**
 * Client-side logging utility for Video Copilot
 * Simple console-based logging for browser environment
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: unknown;
}

class ClientLogger {
  private context: string;

  constructor(context?: string) {
    this.context = context || 'Video Copilot';
  }

  private formatMessage(message: string, meta?: LogContext): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.context}] ${message}${metaStr}`;
  }

  error(message: string, error?: Error | unknown, meta?: LogContext): void {
    const errorMeta = error instanceof Error ? { error: error.message, stack: error.stack, ...meta } : meta;
    console.error(this.formatMessage(message, errorMeta));
  }

  warn(message: string, meta?: LogContext): void {
    console.warn(this.formatMessage(message, meta));
  }

  info(message: string, meta?: LogContext): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage(message, meta));
    }
  }

  child(context: string): ClientLogger {
    return new ClientLogger(`${this.context}:${context}`);
  }
}

// Create default logger instance
export const clientLogger = new ClientLogger();

// Export convenience functions
export function logError(error: Error, context?: string): void {
  const logger = context ? clientLogger.child(context) : clientLogger;
  logger.error(error.message, error);
}

export function logWarning(message: string, context?: string, meta?: LogContext): void {
  const logger = context ? clientLogger.child(context) : clientLogger;
  logger.warn(message, meta);
}

export function logInfo(message: string, context?: string, meta?: LogContext): void {
  const logger = context ? clientLogger.child(context) : clientLogger;
  logger.info(message, meta);
}

export function logDebug(message: string, context?: string, meta?: LogContext): void {
  const logger = context ? clientLogger.child(context) : clientLogger;
  logger.debug(message, meta);
}

export default clientLogger;
