const NodeCache = require('node-cache');
// Cache items for 5 minutes by default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

const apiCache = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  // Use URL + query params as cache key
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);
  
  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cachedResponse);
  } else {
    res.setHeader('X-Cache', 'MISS');
    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body);
      }
      originalJson.call(this, body);
    };
    next();
  }
};

const clearCache = (req, res, next) => {
  cache.flushAll();
  next();
};

module.exports = { apiCache, clearCache };
