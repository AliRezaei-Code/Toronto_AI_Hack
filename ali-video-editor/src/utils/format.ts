/**
 * Formatting utilities for Video Copilot
 */

import { formatDistanceToNow } from 'date-fns';

/**
 * Format seconds to human-readable duration
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:30", "2:45:30")
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB", "2.3 GB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format percentage with optional decimals
 * @param value - Value between 0 and 100
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format frame rate
 * @param fps - Frames per second
 * @returns Formatted frame rate string
 */
export function formatFrameRate(fps: number): string {
  return `${fps} fps`;
}

/**
 * Format resolution
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns Formatted resolution string
 */
export function formatResolution(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Format bitrate
 * @param bitrate - Bitrate in bits per second
 * @returns Formatted bitrate string
 */
export function formatBitrate(bitrate: number): string {
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  let value = bitrate;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format date to relative time
 * @param date - Date to format
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format codec name
 * @param codec - Codec identifier
 * @returns Formatted codec name
 */
export function formatCodec(codec: string): string {
  const codecMap: Record<string, string> = {
    h264: 'H.264',
    h265: 'H.265 (HEVC)',
    vp9: 'VP9',
    aac: 'AAC',
    mp3: 'MP3',
    opus: 'Opus',
  };

  return codecMap[codec.toLowerCase()] || codec.toUpperCase();
}
