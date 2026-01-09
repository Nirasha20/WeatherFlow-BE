const NodeCache = require('node-cache');

// Initialize cache with TTL from environment or default 5 minutes
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 60,
  useClones: false
});

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
const get = (key) => {
  try {
    return cache.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return undefined;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success status
 */
const set = (key, value, ttl) => {
  try {
    return cache.set(key, value, ttl);
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
const del = (key) => {
  try {
    return cache.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
    return 0;
  }
};

/**
 * Flush all cache entries
 */
const flush = () => {
  try {
    cache.flushAll();
    console.log('Cache flushed successfully');
  } catch (error) {
    console.error('Cache flush error:', error);
  }
};

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
const getStats = () => {
  return cache.getStats();
};

/**
 * Get all cache keys
 * @returns {array} Array of cache keys
 */
const getKeys = () => {
  try {
    return cache.keys();
  } catch (error) {
    console.error('Cache getKeys error:', error);
    return [];
  }
};

/**
 * Get detailed cache status for debugging
 * @returns {object} Detailed cache information
 */
const getDebugInfo = () => {
  try {
    const stats = cache.getStats();
    const keys = cache.keys();
    
    return {
      stats: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.keys > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%',
        ksize: stats.ksize,
        vsize: stats.vsize
      },
      config: {
        stdTTL: cache.options.stdTTL,
        checkperiod: cache.options.checkperiod,
        useClones: cache.options.useClones
      },
      keys: keys.map(key => ({
        key,
        ttl: cache.getTtl(key),
        expiresIn: cache.getTtl(key) ? Math.floor((cache.getTtl(key) - Date.now()) / 1000) + 's' : 'N/A'
      }))
    };
  } catch (error) {
    console.error('Cache getDebugInfo error:', error);
    return null;
  }
};

module.exports = {
  get,
  set,
  del,
  flush,
  getStats,
  getKeys,
  getDebugInfo
};
