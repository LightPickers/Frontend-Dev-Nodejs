const cron = require("node-cron");
const { dataSource } = require("../db/data-source");
const { LessThan } = require("typeorm");
const { redis, isRedisConnected } = require("../utils/redis");
const logger = require("../utils/logger")("OrderExpire.cron");

async function cancelExpiredOrders() {
  const orderRepo = dataSource.getRepository("Orders");
  const now = new Date().toISOString();

  let cursor = "0";
  do {
    // scan redis key pattern
    const res = await redis.scan(cursor, {
      MATCH: "order:pending:*",
      COUNT: 100,
    });
    cursor = res.cursor;
    const keys = res.keys;

    for (const key of keys) {
      // 檢查 key TTL
      const ttl = await redis.ttl(key);

      if (ttl === -2) {
        // key 不存在：已過期
        // 取出 orderId
        const orderId = key.split(":")[2];

        // 訂單狀態是不是 pending，如果是就 取消
        const order = await orderRepo.findOneBy({ id: orderId });
        if (order && order.status === "pending") {
          order.status = "canceled";
          order.canceled_at = now;
          await orderRepo.save(order);
          logger.info(`訂單 ${orderId} 超時未付款，已自動取消`);
        }
      }
    }
  } while (cursor !== "0");
}

async function fallbackCancelExpiredOrders() {
  const orderRepo = dataSource.getRepository("Orders");

  // 取得 30 分鐘前的時間
  const nowDbTime = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const cutoffTime = new Date(
    new Date(nowDbTime) - 30 * 60 * 1000
  ).toISOString(); // 30 分鐘前

  const expiredOrders = await orderRepo.find({
    where: {
      status: "pending",
      created_at: LessThan(cutoffTime), // 當訂單建立時間 早於(小於) 30 分鐘前的時間
    },
  });

  for (const order of expiredOrders) {
    order.status = "canceled";
    order.canceled_at = nowDbTime;
    await orderRepo.save(order);
    logger.info(`[資料庫備援] 訂單 ${order.id} 超過 30 分鐘未付款，自動取消`);
  }
}

// 每 10 分鐘執行一次
cron.schedule("*/10 * * * *", async () => {
  try {
    if (isRedisConnected()) {
      logger.info("每 10 分鐘使用 Redis 排程 檢查是否有過期訂單");
      await cancelExpiredOrders();
    } else {
      logger.info("[資料庫備援] 每 10 分鐘檢查是否有過期訂單");
      await fallbackCancelExpiredOrders();
    }
  } catch (err) {
    logger.error("排程執行錯誤", err);
  }
});

// 每小時執行一次
cron.schedule("0 * * * *", async () => {
  logger.info("[資料庫備援] 開始執行過期訂單補掃...");
  await fallbackCancelExpiredOrders().catch(console.error);
});
