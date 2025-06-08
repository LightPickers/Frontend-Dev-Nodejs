const { createClient } = require("redis");
const config = require("../config/index");
const logger = require("./logger")("Redis");

const redis = createClient({
  url: config.get("redisSecret.redisUrl"),
});

let isRedisConnected = false;
let hasLoggedError = false;

// Redis 錯誤事件處理
redis.on("error", (err) => {
  if (!hasLoggedError) {
    logger.error("Redis Client Error，系統將不使用 Redis 快取", err);
    isRedisConnected = false;
    hasLoggedError = true;
  }
});

// Redis 成功連線事件，重置狀態
redis.on("ready", () => {
  isRedisConnected = true;
  hasLoggedError = false;
  logger.info("Redis connected and ready! 使用 Redis 為主的排程策略");
});

// 初始化 Redis 連線
async function connectRedis() {
  try {
    await redis.connect();
  } catch (error) {
    logger.error("Redis 初始連線失敗，系統將不使用 Redis 快取");
  }
}

connectRedis();

module.exports = {
  redis,
  isRedisConnected: () => isRedisConnected,
};
