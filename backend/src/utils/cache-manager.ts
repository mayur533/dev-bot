/**
 * Cache Manager Utility
 * Simple in-memory caching with TTL support
 */

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxSize: number = 1000;
  private hits: number = 0;
  private misses: number = 0;

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public set<T>(key: string, value: T, ttl: number = 300000): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, item);
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = CacheManager.getInstance();
