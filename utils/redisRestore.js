/*
const { dataSource } = require("../db/data-source");
const { MoreThan } = require("typeorm");
const { redis } = require("./redis");
const logger = require("./logger")("RedisRestore");

// 重新儲存未滿 30 分鐘的待付款訂單
async function restorePendingOrdersToRedis() {
  try {
    const orderRepo = dataSource.getRepository("Orders");

    // 找出尚未過期的 pending 訂單（建立時間 < 30 分鐘內）
    const now = new Date();
    const threshold = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    const orders = await orderRepo.find({
      where: {
        status: "pending",
        created_at: MoreThan(threshold),
      },
    });

    for (const order of orders) {
      const ttl =
        30 * 60 -
        Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);

      if (ttl > 0) {
        await redis.set(`order:pending:${order.id}`, "1", { EX: ttl });
      }
    }

    logger.info(`[Redis恢復] 已補建 ${orders.length} 筆 Redis 訂單過期 key`);
  } catch (err) {
    logger.error("恢復 Redis 訂單 key 發生錯誤：", err);
  }
}

module.exports = {
  restorePendingOrdersToRedis,
};
*/
