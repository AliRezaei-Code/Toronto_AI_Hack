/**
 * Logging utility for Video Copilot
 * Uses Winston for production-grade logging
 */

import path from 'path';
import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format,
  }),
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format,
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: string): winston.Logger {
  return logger.child({ context });
}

/**
 * Log an error with context
 */
export function logError(error: Error, context?: string): void {
  const childLogger = context ? createChildLogger(context) : logger;
  childLogger.error(error.message, { stack: error.stack });
}

/**
 * Log a warning with context
 */
export function logWarning(message: string, context?: string, meta?: unknown): void {
  const childLogger = context ? createChildLogger(context) : logger;
  childLogger.warn(message, meta);
}

/**
 * Log info with context
 */
export function logInfo(message: string, context?: string, meta?: unknown): void {
  const childLogger = context ? createChildLogger(context) : logger;
  childLogger.info(message, meta);
}

/**
 * Log debug information with context
 */
export function logDebug(message: string, context?: string, meta?: unknown): void {
  const childLogger = context ? createChildLogger(context) : logger;
  childLogger.debug(message, meta);
}

export default logger;
