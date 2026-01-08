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

module.exports = {
  get,
  set,
  del,
  flush,
  getStats
};
