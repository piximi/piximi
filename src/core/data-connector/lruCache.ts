import type { CacheStats, ILRUCache } from "./types";

type CacheEntry<T> = {
  key: string;
  value: T;
  byteSize: number;
  lastAccessed: number;
};

/**
 * Simple LRU (Least Recently Used) cache with byte-size tracking
 *
 * Used to keep frequently accessed tensors in memory while respecting
 * memory limits. When limit is exceeded, least recently used items
 * are evicted.
 */

export class LRUCache<T> implements ILRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private currentSize: number = 0;
  private hits: number = 0;
  private misses: number = 0;

  constructor(private maxBytes: number) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update access time (LRU tracking)
      entry.lastAccessed = Date.now();
      this.hits++;
      return entry.value;
    }
    this.misses++;
    return undefined;
  }

  set(key: string, value: T, byteSize: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict until we have space
    while (this.currentSize + byteSize > this.maxBytes && this.cache.size > 0) {
      this.evictLRU();
    }

    // Dont cache if single item exceeds limit
    if (byteSize > this.maxBytes) {
      return;
    }

    this.cache.set(key, {
      key,
      value,
      byteSize,
      lastAccessed: Date.now(),
    });
    this.currentSize += byteSize;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.byteSize;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.currentSize,
      count: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  setMaxBytes(maxBytes: number): void {
    this.maxBytes = maxBytes;
    // Evict if necessary
    while (this.currentSize > this.maxBytes && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  evictLRU(): void {
    let oldest: CacheEntry<T> | null = null;
    for (const entry of this.cache.values()) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry;
      }
    }
    if (oldest) {
      this.delete(oldest.key);
    }
  }
}

/**
 * No-op cache implementation (Null Object pattern)
 *
 * Used when caching should be disabled, e.g. in Web Worker contexts
 * where cached data would be inaccessible from the main thread.
 */

export class NullCache<T> implements ILRUCache<T> {
  constructor() {}

  get(_key: string): T | undefined {
    return undefined;
  }

  set(_key: string, _value: T, _byteSize: number): void {}

  delete(_key: string): boolean {
    return false;
  }

  has(_key: string): boolean {
    return false;
  }

  clear(): void {}

  getStats(): CacheStats {
    return {
      size: 0,
      count: 0,
      hitRate: 0,
    };
  }

  setMaxBytes(_maxBytes: number): void {}

  evictLRU(): void {}
}
