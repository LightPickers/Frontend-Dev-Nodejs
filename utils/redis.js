const { createClient } = require("redis");
const config = require("../config/index");
const logger = require("./logger")("Redis");

const redis = createClient({
  url: config.get("redisSecret.redisUrl"),
});

redis.on("error", (err) => logger.error("Redis Client Error", err));

async function connectRedis() {
  await redis.connect();
  logger.info("Redis connected!");
}

connectRedis();

module.exports = redis;
