const CartValidator = require("../cart/cartService");
const CheckoutSession = require("../checkout/checkoutSession");
const OrderFactory = require("./orderFactory");
const PaymentNewebpay = require("../payment/paymentNewebpay");
const AppError = require("../../utils/appError");

class OrderService {
  constructor(dataSource, redis) {
    this.dataSource = dataSource;
    this.redis = redis;
    this.cartValidator = new CartValidator(dataSource);
    this.checkoutSession = new CheckoutSession(redis);
    this.orderFactory = new OrderFactory(dataSource);
    this.paymentNewebpay = new PaymentNewebpay(dataSource);
  }

  async createOrder(user_id, cart_ids) {
    try {
      console.log("Step 1: validate cart");
      const { carts, productIds } = await this.cartValidator.cartIdsValidator(
        cart_ids
      );
      console.log("Step 2: load checkout");
      let checkoutData;
      try {
        checkoutData = await this.checkoutSession.load(user_id);
      } catch (err) {
        console.error("CheckoutSession.load Error:", err);
        throw err;
      }

      console.log("Step 3: query pending order");
      const orderRepo = this.dataSource.getRepository("Orders");
      const userRepo = this.dataSource.getRepository("Users");
      const productRepo = this.dataSource.getRepository("Products");

      // 檢查是否已有 pending 訂單
      const query = orderRepo
        .createQueryBuilder("order")
        .innerJoin("Order_items", "item", "item.order_id = order.id")
        .where("order.user_id = :user_id", { user_id })
        .andWhere("order.status = :status", { status: "pending" });

      if (productIds.length > 0) {
        query.andWhere("item.product_id IN (:...productIds)", { productIds });
      }

      const pendingOrder = await query.getOne();

      // 有相同訂單，直接回傳藍新資料，進入藍新頁面完成付款
      if (pendingOrder) {
        const user = await userRepo.findOne({
          select: ["email"],
          where: { id: user_id },
        });
        const product = await productRepo.findOne({
          select: ["name"],
          where: { id: productIds[0] },
        });

        // 回傳給藍新的 htmlform
        return this.paymentNewebpay.generateForm(
          pendingOrder,
          product.name,
          user.email,
          cart_ids.length
        );
      }

      // 建立新訂單
      const newOrder = await this.orderFactory.create(
        user_id,
        carts,
        checkoutData
      );
      await this.checkoutSession.clear(user_id);
      await this.redis.set(`order:pending:${newOrder.id}`, "pending", {
        EX: 1800,
      });

      const user = await this.dataSource.getRepository("Users").findOne({
        select: ["email"],
        where: { id: user_id },
      });
      const product = await this.dataSource.getRepository("Products").findOne({
        select: ["name"],
        where: { id: productIds[0] },
      });

      return this.paymentNewebpay.generateForm(
        newOrder,
        product.name,
        user.email,
        cart_ids.length
      );
    } catch (err) {
      console.error("createOrder Error:", err);
      throw new AppError(500, "建立訂單時發生錯誤");
    }
  }

  async getPendingOrderHtml(user_id, order_id) {
    const userRepo = this.dataSource.getRepository("Users");
    const productRepo = this.dataSource.getRepository("Products");
    const orderItemsRepo = this.dataSource.getRepository("Order_items");

    // 取得訂單商品 product_id
    const orderItems = await orderItemsRepo.find({
      select: ["product_id"],
      where: { order_id },
    });

    const productIds = orderItems
      .map((item) => item.product_id) // 訂單項目裡 所有的 product_id
      .filter((id) => isValidString(id) && id.length > 0);

    // 查詢所有對應商品的 is_available 狀態
    const products = await productRepo.find({
      select: ["id", "is_available"],
      where: { id: In(productIds) },
    });

    const unavailableProducts = products.filter((p) => !p.is_available);

    // 檢查是否有不可用商品
    if (unavailableProducts.length > 0) {
      const unavailableIds = unavailableProducts.map((p) => p.id).join(", ");
      logger.warn(`以下商品目前已無庫存: ${unavailableIds}`);
      throw new AppError(400, `以下商品目前已無庫存: ${unavailableIds}`);
    }

    // 查找該用戶的 pending 訂單
    const query = this.dataSource
      .getRepository("Orders")
      .createQueryBuilder("order")
      .innerJoin("Order_items", "item", "item.order_id = order.id")
      .where("order.user_id = :user_id", { user_id })
      .andWhere("order.status = :status", { status: "pending" });

    if (productIds.length > 0) {
      query.andWhere("item.product_id IN (:...productIds)", { productIds });
    }
    const pendingOrder = await query.getOne();

    // 判斷是否有該筆 待付款訂單
    if (!pendingOrder) {
      logger.warn(`待付款訂單 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      throw new AppError(404, `待付款訂單 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    }

    // 取用戶與第一個商品資料
    const user = await userRepo.findOne({
      select: ["email"],
      where: { id: user_id },
    });
    const product = await productRepo.findOne({
      select: ["name"],
      where: { id: productIds[0] },
    });

    return this.paymentNewebpay.generateForm(
      pendingOrder,
      product.name,
      user.email,
      productIds.length
    );
  }
}

module.exports = OrderService;
