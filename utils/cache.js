const { redis, isRedisConnected } = require("./redis");
const logger = require("./logger")("Cache");

async function cacheOrFetch(key, fetchFn, ttlInSec = 3600) {
  try {
    if (isRedisConnected()) {
      const cached = await redis.get(key);
      if (cached) {
        logger.info(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      const data = await fetchFn();
      await redis.setEx(key, ttlInSec, JSON.stringify(data));
      logger.info(`Cache set: ${key} (TTL: ${ttlInSec}s)`);
      return data;
    } else {
      logger.warn(`Redis not connected. Bypassing cache for: ${key}`);
      return await fetchFn();
    }
  } catch (err) {
    logger.error(`Cache error for key ${key}`, err);
    return await fetchFn(); // fallback if Redis error
  }
}

module.exports = {
  cacheOrFetch,
};
