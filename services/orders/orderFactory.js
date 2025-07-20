const logger = require("../../utils/logger");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

class OrderFactory {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async create(user_id, carts, checkoutData) {
    try {
      let newOrder;

      // ACID: 使用 transaction 讓操作全部成功才提交，否則回滾。
      await this.dataSource.transaction(async (manager) => {
        const cartRepo = manager.getRepository("Cart");
        const orderRepo = manager.getRepository("Orders");
        const orderItemsRepo = manager.getRepository("Order_items");
        const couponRepo = manager.getRepository("Coupons");

        // 計算付款總額 totalAmount
        let amount = 0;

        if (carts.length > 0) {
          const total = carts.reduce(
            (sum, c) => sum + Number(c.price_at_time),
            0
          );
          amount = total;
        }

        //建立 Order 資料
        newOrder = orderRepo.create({
          user_id,
          status: "pending",
          desired_date: checkoutData.desiredDate,
          shipping_method: checkoutData.shippingMethod,
          payment_method: checkoutData.paymentMethod,
          amount,
        });

        if (checkoutData.coupon) {
          newOrder.coupon_id = checkoutData.coupon.id;
          newOrder.amount = Math.round(
            (amount / 10) * checkoutData.coupon.discount
          );
          // 將使用的優惠券數量 -1
          const usingCoupon = await couponRepo.findOneBy({
            id: newOrder.coupon_id,
          });
          usingCoupon.quantity -= 1;

          // 將使用的優惠券 已使用數量 +1
          usingCoupon.distributed_quantity += 1;
          await couponRepo.save(usingCoupon);
        }

        newOrder.amount += 60; // 最後價格 加上運費 60
        await orderRepo.save(newOrder);

        // 將 cart 品項整理好，存入 Order_items
        const orderItemsData = carts.map((cart) => ({
          order_id: newOrder.id,
          product_id: cart.product_id,
          quantity: cart.quantity || 1,
          price: cart.price_at_time,
        }));
        await orderItemsRepo.save(orderItemsData);

        // 清除購物車
        const cleanCart = await cartRepo.delete({ user_id });
        if (cleanCart.affected === 0) {
          logger.warn(`購物車${ERROR_MESSAGES.DATA_NOT_DELETE}`);
          throw new AppError(400, `購物車${ERROR_MESSAGES.DATA_NOT_DELETE}`);
        }
      });

      return newOrder;
    } catch (err) {
      console.error("orderFactory create Error:", err);
    }
  }
}

module.exports = OrderFactory;
