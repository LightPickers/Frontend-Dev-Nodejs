const { dataSource } = require("../db/data-source");
const { MoreThan } = require("typeorm");
const logger = require("./logger")("RedisRestore");

// 重新儲存未滿 30 分鐘的待付款訂單
async function restorePendingOrdersToRedis() {
  try {
    const { redis } = require("./redis");
    const orderRepo = dataSource.getRepository("Orders");

    // 找出尚未過期的 pending 訂單（建立時間 < 30 分鐘內）
    const now = new Date().toISOString();
    const threshold = new Date(new Date(now) - 30 * 60 * 1000).toISOString(); // 30 分鐘前

    const orders = await orderRepo.find({
      where: {
        status: "pending",
        created_at: MoreThan(threshold), // 於 30 分鐘內建立的訂單
      },
    });

    if (orders) {
      for (const order of orders) {
        const ttl =
          30 * 60 -
          Math.floor((new Date(now) - new Date(order.created_at)) / 1000);

        if (ttl > 0) {
          await redis.set(`order:pending:${order.id}`, "1", { EX: ttl });
          logger.info(
            `[Redis 恢復] 補建 Redis Key：order:pending:${order.id}，有效時間還剩下 ${ttl} 秒`
          );
        } else if (ttl < 0) {
          // 訂單已超過 30 分鐘
          order.status = "canceled";
          order.canceled_at = now;
          await orderRepo.save(order);
          logger.info(
            `[訂單取消] 訂單 ${order.id} 已超過 30 分鐘未付款，自動取消`
          );
        }
      }
    }
  } catch (err) {
    logger.error("恢復 Redis 訂單 key 發生錯誤：", err);
  }
}

module.exports = {
  restorePendingOrdersToRedis,
};
