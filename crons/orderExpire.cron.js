const cron = require("node-cron");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("OrderExpire.cron");

async function cancelExpiredOrders() {
  const orderRepo = dataSource.getRepository("Orders");

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
          order.canceled_at = new Date().toISOString();
          await orderRepo.save(order);
          logger.info(`訂單 ${orderId} 超時未付款，已自動取消`);
        }
        // 如果該訂單有使用優惠券，將已取消的優惠券數量補回去
        if (order.coupon_id) {
          const couponRepo = dataSource.getRepository("Coupons");
          const coupon = await couponRepo.findOneBy({ id: order.coupon_id });
          if (coupon) {
            coupon.quantity++;
            await couponRepo.save(coupon);
          }
        }
      }
    }
  } while (cursor !== "0");
}

// 每分鐘執行一次
cron.schedule("* * * * *", () => {
  cancelExpiredOrders().catch(console.error);
});
