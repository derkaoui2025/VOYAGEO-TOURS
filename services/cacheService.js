/**
 * Cache Service
 * 
 * Provides caching functionality with support for multiple providers:
 * - Memory (default in-memory cache)
 * - Redis (for production distributed caching)
 * 
 * Usage:
 * 1. Direct cache operations:
 *    await cacheService.set('key', data, ttl);
 *    const data = await cacheService.get('key');
 * 
 * 2. Cached function wrapper:
 *    const result = await cacheService.wrap(
 *      'cache-key', 
 *      () => expensiveOperation(), 
 *      3600
 *    );
 */

const config = require('../config');
const NodeCache = require('node-cache');

// Default in-memory cache provider
const memoryCache = new NodeCache({
  stdTTL: config.cache?.ttl || 3600, // Default TTL: 1 hour
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // For better performance with large objects
});

// Redis client setup if needed
let redisClient;
if (config.cache?.provider === 'redis') {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(config.cache.redisUrl || 'redis://localhost:6379');
    
    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
      console.warn('Falling back to in-memory cache');
      config.cache.provider = 'memory';
    });
    
    console.log('Redis cache initialized');
  } catch (error) {
    console.error('Error initializing Redis:', error);
    console.warn('Falling back to in-memory cache');
    config.cache.provider = 'memory';
  }
}

class CacheService {
  constructor() {
    this.provider = config.cache?.provider || 'memory';
    this.defaultTTL = config.cache?.ttl || 3600; // Default TTL: 1 hour
    this.enabled = config.cache?.enabled !== false;
    
    if (!this.enabled) {
      console.log('Cache is disabled');
    } else {
      console.log(`Cache initialized with ${this.provider} provider`);
    }
  }
  
  /**
   * Set a value in the cache
   * 
   * @param {String} key Cache key
   * @param {*} value Value to cache (must be JSON serializable for Redis)
   * @param {Number} ttl Time to live in seconds
   * @returns {Promise<Boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return false;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        // Serialize value for Redis
        const serialized = JSON.stringify(value);
        await redisClient.set(key, serialized, 'EX', ttl);
      } else {
        // Use in-memory cache
        memoryCache.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  /**
   * Get a value from the cache
   * 
   * @param {String} key Cache key
   * @returns {Promise<*>} Cached value or undefined if not found
   */
  async get(key) {
    if (!this.enabled) return undefined;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        const value = await redisClient.get(key);
        if (value === null) return undefined;
        return JSON.parse(value);
      } else {
        // Use in-memory cache
        return memoryCache.get(key);
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return undefined;
    }
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param {String} key Cache key
   * @returns {Promise<Boolean>} Success status
   */
  async del(key) {
    if (!this.enabled) return false;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        await redisClient.del(key);
      } else {
        // Use in-memory cache
        memoryCache.del(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * 
   * @param {String} key Cache key
   * @returns {Promise<Boolean>} True if key exists
   */
  async has(key) {
    if (!this.enabled) return false;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        const exists = await redisClient.exists(key);
        return exists === 1;
      } else {
        // Use in-memory cache
        return memoryCache.has(key);
      }
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }
  
  /**
   * Clear all cache entries
   * 
   * @returns {Promise<Boolean>} Success status
   */
  async clear() {
    if (!this.enabled) return false;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        await redisClient.flushall();
      } else {
        // Use in-memory cache
        memoryCache.flushAll();
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
  
  /**
   * Clear cache entries by pattern
   * 
   * @param {String} pattern Key pattern to match (e.g., 'blog:*')
   * @returns {Promise<Boolean>} Success status
   */
  async clearPattern(pattern) {
    if (!this.enabled) return false;
    
    try {
      if (this.provider === 'redis' && redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // For in-memory cache, iterate and check each key
        const keys = memoryCache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        
        for (const key of keys) {
          if (regex.test(key)) {
            memoryCache.del(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Cache clearPattern error:', error);
      return false;
    }
  }
  
  /**
   * Get cache stats
   * 
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.enabled) return { enabled: false };
    
    try {
      if (this.provider === 'redis' && redisClient) {
        const info = await redisClient.info();
        const keyCount = await redisClient.dbsize();
        
        // Parse Redis info
        const stats = { provider: 'redis', keyCount };
        const infoLines = info.split('\r\n');
        
        for (const line of infoLines) {
          if (line.includes('used_memory_human')) {
            stats.memoryUsage = line.split(':')[1];
          }
          if (line.includes('connected_clients')) {
            stats.clients = line.split(':')[1];
          }
        }
        
        return stats;
      } else {
        // Use in-memory cache stats
        return {
          provider: 'memory',
          ...memoryCache.getStats(),
          keyCount: memoryCache.keys().length
        };
      }
    } catch (error) {
      console.error('Cache getStats error:', error);
      return { error: 'Failed to get cache stats' };
    }
  }
  
  /**
   * Wrap a function with caching
   * 
   * @param {String} key Cache key
   * @param {Function} fn Function to execute if cache misses
   * @param {Number} ttl Time to live in seconds
   * @returns {Promise<*>} Result from cache or function
   */
  async wrap(key, fn, ttl = this.defaultTTL) {
    if (!this.enabled) return fn();
    
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      
      if (cached !== undefined) {
        return cached;
      }
      
      // Cache miss, execute function
      const result = await fn();
      
      // Cache the result
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      console.error('Cache wrap error:', error);
      // If cache fails, just execute the function
      return fn();
    }
  }
  
  /**
   * Create a wrapper function that will cache results
   * 
   * @param {Function} fn Function to wrap with caching
   * @param {Function} keyFn Function to generate cache key from arguments
   * @param {Number} ttl Time to live in seconds
   * @returns {Function} Wrapped function with caching
   */
  createCachedFunction(fn, keyFn, ttl = this.defaultTTL) {
    return async (...args) => {
      if (!this.enabled) return fn(...args);
      
      try {
        // Generate cache key from arguments
        const key = keyFn(...args);
        
        // Use wrap method to handle caching
        return this.wrap(
          key,
          () => fn(...args),
          ttl
        );
      } catch (error) {
        console.error('Cached function error:', error);
        // If cache fails, just execute the function
        return fn(...args);
      }
    };
  }
}

module.exports = new CacheService(); 