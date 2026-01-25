/**
 * Video Copilot - Path Validation Utility
 *
 * Centralized path validation to prevent path traversal attacks.
 * Used by all API routes that handle file paths.
 *
 * @module path-validator
 */

import * as fs from "fs/promises";
import * as path from "path";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Allowed base directories for file operations
 */
const ALLOWED_DIRECTORIES = [
  path.join(process.cwd(), "uploads"),
  path.join(process.cwd(), "public"),
  // Temp directories
  "/tmp",
  "/var/folders", // macOS temp
];

/**
 * Patterns that indicate path traversal attempts
 */
const DANGEROUS_PATTERNS = [
  /\.\./g, // Parent directory traversal
  /\0/g, // Null byte injection
  /%2e%2e/gi, // URL encoded ..
  /%252e%252e/gi, // Double URL encoded ..
  /\.\.%2f/gi, // Mixed traversal
  /%2f\.\./gi, // Mixed traversal
];

/**
 * Characters that should not appear in filenames
 */
// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"|?*\x00-\x1f]/g;

// ============================================================================
// Validation Results
// ============================================================================

export interface PathValidationResult {
  valid: boolean;
  sanitizedPath?: string;
  error?: string;
}

// ============================================================================
// Path Validation Functions
// ============================================================================

/**
 * Validate that a path is safe and within allowed directories
 *
 * @param inputPath - The path to validate
 * @param allowedDirs - Optional override of allowed directories
 * @returns Validation result with sanitized path or error
 */
export function validatePath(
  inputPath: string,
  allowedDirs: string[] = ALLOWED_DIRECTORIES
): PathValidationResult {
  // Check for empty or non-string input
  if (!inputPath || typeof inputPath !== "string") {
    return { valid: false, error: "Path is required and must be a string" };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(inputPath)) {
      return { valid: false, error: "Path contains invalid characters" };
    }
  }

  // Normalize and resolve the path
  const normalizedPath = path.normalize(inputPath);
  const resolvedPath = path.resolve(normalizedPath);

  // Check if the resolved path is within an allowed directory
  const isAllowed = allowedDirs.some((dir) => {
    const resolvedDir = path.resolve(dir);
    return resolvedPath.startsWith(resolvedDir + path.sep) || resolvedPath === resolvedDir;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: "Path is outside allowed directories",
    };
  }

  return { valid: true, sanitizedPath: resolvedPath };
}

/**
 * Validate and sanitize a filename (not a full path)
 *
 * @param filename - The filename to validate
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Validation result with sanitized filename or error
 */
export function validateFilename(
  filename: string,
  maxLength: number = 255
): PathValidationResult {
  // Check for empty input
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "Filename is required" };
  }

  // Check for path separators (indicating a path, not a filename)
  if (filename.includes("/") || filename.includes("\\")) {
    return { valid: false, error: "Filename cannot contain path separators" };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filename)) {
      return { valid: false, error: "Filename contains invalid characters" };
    }
  }

  // Remove invalid characters
  let sanitized = filename.replace(INVALID_FILENAME_CHARS, "_");

  // Trim whitespace and dots from start/end
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Check length
  if (sanitized.length === 0) {
    return { valid: false, error: "Filename is empty after sanitization" };
  }

  if (sanitized.length > maxLength) {
    // Truncate preserving extension
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const maxNameLength = maxLength - ext.length - 1;
    if (maxNameLength <= 0) {
      return { valid: false, error: "Filename is too long" };
    }
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  return { valid: true, sanitizedPath: sanitized };
}

/**
 * Safely join paths, ensuring the result stays within a base directory
 *
 * @param baseDir - The base directory (must be in allowed directories)
 * @param segments - Path segments to join
 * @returns Validation result with joined path or error
 */
export function safeJoinPath(
  baseDir: string,
  ...segments: string[]
): PathValidationResult {
  // Validate each segment first
  for (const segment of segments) {
    if (!segment || typeof segment !== "string") {
      continue; // Skip empty segments
    }

    // Check for dangerous patterns in segment
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(segment)) {
        return { valid: false, error: "Path segment contains invalid characters" };
      }
    }
  }

  // Join the paths
  const joinedPath = path.join(baseDir, ...segments);
  const resolvedPath = path.resolve(joinedPath);
  const resolvedBase = path.resolve(baseDir);

  // Ensure result is within base directory
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    return { valid: false, error: "Resulting path is outside base directory" };
  }

  return { valid: true, sanitizedPath: resolvedPath };
}

/**
 * Check if a path exists and is accessible
 *
 * @param filePath - Path to check
 * @returns True if file exists and is readable
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a video path is safe to process
 * Specific validation for video file paths with allowed extensions
 *
 * @param videoPath - Path to the video file
 * @returns Validation result
 */
export function validateVideoPath(videoPath: string): PathValidationResult {
  // First do general path validation
  const pathResult = validatePath(videoPath);
  if (!pathResult.valid) {
    return pathResult;
  }

  // Check file extension
  const ext = path.extname(videoPath).toLowerCase();
  const allowedExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogg"];

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid video file extension: ${ext}. Allowed: ${allowedExtensions.join(", ")}`,
    };
  }

  return pathResult;
}

// ============================================================================
// Exports
// ============================================================================

export const pathValidator = {
  validatePath,
  validateFilename,
  safeJoinPath,
  pathExists,
  validateVideoPath,
  ALLOWED_DIRECTORIES,
};
