/**
 * Simple In-Memory Cache for Thumbnail Results
 *
 * Provides request deduplication to avoid regenerating identical thumbnails.
 */

import type { ThumbnailCachePort, ThumbnailResult } from "../domain";
import { CACHE_CONFIG } from "../domain";

// ============================================================================
// Cache Entry
// ============================================================================

/**
 * Cache entry with expiration tracking
 */
interface CacheEntry {
  /** Cached result */
  result: ThumbnailResult;
  /** Expiration timestamp */
  expiresAt: number;
  /** Creation timestamp */
  createdAt: number;
}

// ============================================================================
// Cache Implementation
// ============================================================================

/**
 * Simple in-memory cache with TTL support
 */
export class SimpleCache implements ThumbnailCachePort {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  /**
   * Get cached result
   */
  async get(cacheKey: string): Promise<ThumbnailResult | null> {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.result;
  }

  /**
   * Set cache entry with TTL
   */
  async set(cacheKey: string, result: ThumbnailResult, ttlMs: number): Promise<void> {
    // Enforce max cache size
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      result,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    };

    this.cache.set(cacheKey, entry);
    this.stats.sets++;
  }

  /**
   * Invalidate specific cache entry
   */
  async invalidate(cacheKey: string): Promise<void> {
    if (this.cache.delete(cacheKey)) {
      this.stats.deletes++;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate,
    };
  }

  /**
   * Evict oldest entry from cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
    }
  }
}

// ============================================================================
// Cache Factory
// ============================================================================

/**
 * Factory for getting cache instance
 */
export class CacheFactory {
  private static instance: SimpleCache | null = null;

  /**
   * Get or create cache instance
   */
  static getInstance(): SimpleCache {
    if (!this.instance) {
      this.instance = new SimpleCache();
    }
    return this.instance;
  }

  /**
   * Reset cache (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
