const { In } = require("typeorm");
const { dataSource } = require("../db/data-source");
const { redis } = require("../utils/redis/redis");
const logger = require("../utils/logger")("OrdersController");
const { isUUID } = require("validator");
const {
  isUndefined,
  isValidString,
  isValidStringArray,
  checkOrder,
} = require("../utils/validUtils");
const {
  generateNewebpayForm,
} = require("../utils/newebpay/generateNewebpayForm");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postOrder(req, res, next) {
  const { id: userId } = req.user;
  const { cart_ids } = req.body;

  if (!isValidStringArray(cart_ids)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const cartRepo = dataSource.getRepository("Cart");
  const usersRepo = dataSource.getRepository("Users");
  const productsRepo = dataSource.getRepository("Products");

  // 從 req.body 的 cartIds 取得 productIds
  const carts = await cartRepo.find({
    where: { id: In(cart_ids) },
  });
  const productIds = carts.map((cart) => cart.product_id);

  // 檢查 cartIds 裡，是否有未供應的商品
  const count = await productsRepo.count({
    where: {
      id: In(productIds),
      is_available: false,
    },
  });
  if (count > 0) {
    logger.warn(ERROR_MESSAGES.PRODUCT_SOLDOUT);
    return next(new AppError(400, ERROR_MESSAGES.PRODUCT_SOLDOUT));
  }

  // 取得 Redis 暫存資料
  const checkoutDataJson = await redis.get(`checkout:${userId}`);
  if (!checkoutDataJson) {
    return next(new AppError(400, ERROR_MESSAGES.FINISH_CHECKOUT_FIRST));
  }
  const checkoutData = JSON.parse(checkoutDataJson);

  // 檢查是否已有 待付款 的相同商品訂單
  const query = dataSource
    .getRepository("Orders")
    .createQueryBuilder("order")
    .innerJoin("Order_items", "item", "item.order_id = order.id")
    .where("order.user_id = :userId", { userId })
    .andWhere("order.status = :status", { status: "pending" });

  if (productIds.length > 0) {
    query.andWhere("item.product_id IN (:...productIds)", { productIds });
  }

  const pendingOrder = await query.getOne();

  // 有相同訂單，直接回傳藍新資料，進入藍新頁面完成付款
  if (pendingOrder) {
    const user = await usersRepo.findOne({
      select: ["email"],
      where: { id: userId },
    });
    const product = await productsRepo.findOne({
      select: ["name"],
      where: { id: productIds[0] },
    });

    // 回傳給藍新的 htmlform
    const { html, merchantOrderNo } = generateNewebpayForm(
      pendingOrder,
      product.name,
      user.email,
      cart_ids.length
    );

    // 更新 pendingOrder 的 merchant_order_no 為此時的時間戳
    pendingOrder.merchant_order_no = merchantOrderNo;
    await dataSource.getRepository("Orders").save(pendingOrder);

    return res.status(200).type("html").send(html);
  }

  // 開始建立新訂單
  let newOrder;

  // ACID: 使用 transaction 讓操作全部成功才提交，否則回滾。
  await dataSource.transaction(async (manager) => {
    const cartRepo = manager.getRepository("Cart");
    const orderRepo = manager.getRepository("Orders");
    const orderItemsRepo = manager.getRepository("Order_items");
    const couponRepo = manager.getRepository("Coupons");

    // 計算付款總額 totalAmount
    let amount = 0;

    if (cart_ids.length > 0) {
      const totalAmount = await cartRepo
        .createQueryBuilder("cart")
        .select("SUM(cart.price_at_time)", "total")
        .where("cart.id IN (:...ids)", { ids: cart_ids })
        .getRawOne();

      amount = Number(totalAmount.total) || 0;
    }

    //建立 Order 資料
    newOrder = orderRepo.create({
      user_id: userId,
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
  });

  // 資料確定存入新訂單後，刪除 redis 暫存
  await redis.del(`checkout:${userId}`);

  // 設定 Redis key 表示訂單狀態是 pending，TTL 30 分鐘
  // key -> order: pending: <orderId>
  await redis.set(`order:pending:${newOrder.id}`, "pending", { EX: 1800 });

  // 建立 藍新金流 所需資料
  const user = await usersRepo.findOne({
    select: ["email"],
    where: { id: userId },
  });
  const product = await productsRepo.findOne({
    select: ["name"],
    where: { id: productIds[0] },
  });

  // 回傳給藍新的 htmlform
  const { html, merchantOrderNo } = generateNewebpayForm(
    newOrder,
    product.name,
    user.email,
    cart_ids.length
  );

  // 儲存 neWedPayOrder 至該訂單
  newOrder.merchant_order_no = merchantOrderNo;
  await dataSource.getRepository("Orders").save(newOrder);

  res.status(200).type("html").send(html);
}

async function getOrder(req, res, next) {
  const { order_id } = req.params;

  //400
  if (
    isUndefined(order_id) ||
    !isValidString(order_id) ||
    !isUUID(order_id, 4)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const ordersRepo = dataSource.getRepository("Orders");
  const orderItemsRepo = dataSource.getRepository("Order_items");

  // 404
  const existOrder = await checkOrder(ordersRepo, order_id);
  if (!existOrder) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 200
  const shippingFee = 60;
  const orderInfo = await ordersRepo
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.Users", "user")
    .leftJoinAndSelect("order.Coupons", "coupon")
    .select([
      "order.id AS id",
      "order.merchant_order_no AS merchant_order_no",
      "order.created_at AS created_at",
      "order.status AS status",
      "order.amount AS amount",
      "user.id",
      "user.name",
      "user.address_zipcode",
      "user.address_city",
      "user.address_district",
      "user.address_detail",
      "user.phone",
      "coupon.id",
      "coupon.discount",
      "order.shipping_method AS shipping_method",
      "order.payment_method AS payment_method",
      "order.desired_date AS desired_date",
      "(order.amount - :shippingFee) / COALESCE(coupon.discount, 10) * 10 AS final_amount",
      "((order.amount - :shippingFee) / COALESCE(coupon.discount, 10) * 10) - (order.amount - :shippingFee) AS discount_price",
      // "(order.amount - :shippingFee) * COALESCE(coupon.discount, 0) * 0.1 AS final_amount",
    ])
    .where("order.id = :order_id", { order_id })
    .setParameters({ shippingFee })
    .getRawOne();

  // 在 orderInfo 新增 shippingFee 運費
  orderInfo.shippingFee = shippingFee;

  const orderItems = await orderItemsRepo
    .createQueryBuilder("orderItems")
    .leftJoinAndSelect("orderItems.Products", "product")
    .select([
      "orderItems.product_id AS id",
      "product.name AS name",
      "product.primary_image AS primary_image",
      "orderItems.price AS price",
      "orderItems.quantity AS quantity",
    ])
    .where("orderItems.order_id = :order_id", { order_id })
    .getRawMany();

  res.status(200).json({
    message: "成功",
    status: "true",
    order: orderInfo,
    order_items: orderItems,
  });
}

async function getAllOrders(req, res, next) {
  const { id: user_id } = req.user;

  const orders = await dataSource.getRepository("Orders").find({
    select: [
      "id",
      "status",
      "payment_method",
      "amount",
      "created_at",
      "merchant_order_no",
    ],
    where: { user_id },
    order: {
      created_at: "DESC",
    },
  });

  res.status(200).json({
    status: "true",
    data: orders,
  });
}

async function getPaidOrder(req, res, next) {
  const { order_id } = req.params;
  const { is_banned } = req.user;

  // 檢查用戶是否有權限
  if (is_banned) {
    logger.warn(ERROR_MESSAGES.NOT_AUTHORIZED_FOR_ORDER);
    return next(new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED_FOR_ORDER));
  }

  // 檢查資料庫有無此訂單
  const orderRepo = dataSource.getRepository("Orders");
  const order = await orderRepo.findOneBy({ id: order_id });
  if (!order) {
    logger.warn(`訂單${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `訂單${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  res.status(200).json({
    status: true,
    message: "訂單取得成功",
    data: {
      id: order.id,
      user_id: order.user_id,
      merchant_order_no: order.merchant_order_no,
      status: order.status,
      amount: order.amount,
      created_at: order.created_at,
    },
  });
}

async function postPendingOrder(req, res, next) {
  const { id: userId } = req.user;
  const { order_id } = req.params;

  const usersRepo = dataSource.getRepository("Users");
  const productsRepo = dataSource.getRepository("Products");
  const orderItemsRepo = dataSource.getRepository("Order_items");

  // 取得訂單商品 product_id
  const orderItems = await orderItemsRepo.find({
    select: ["product_id"],
    where: { order_id },
  });

  const productIds = orderItems
    .map((item) => item.product_id) // 訂單項目裡 所有的 product_id
    .filter((id) => isValidString(id) && id.length > 0);

  // 取出 待付款 商品訂單
  const query = dataSource
    .getRepository("Orders")
    .createQueryBuilder("order")
    .innerJoin("Order_items", "item", "item.order_id = order.id")
    .where("order.user_id = :userId", { userId })
    .andWhere("order.status = :status", { status: "pending" });

  if (productIds.length > 0) {
    query.andWhere("item.product_id IN (:...productIds)", { productIds });
  }
  const pendingOrder = await query.getOne();

  if (!pendingOrder) {
    logger.warn(`待付款訂單 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(
      new AppError(404, `待付款訂單 ${ERROR_MESSAGES.DATA_NOT_FOUND}`)
    );
  }

  const user = await usersRepo.findOne({
    select: ["email"],
    where: { id: userId },
  });
  const product = await productsRepo.findOne({
    select: ["name"],
    where: { id: productIds[0] },
  });

  // 回傳給藍新的 htmlform
  const { html, merchantOrderNo } = generateNewebpayForm(
    pendingOrder,
    product.name,
    user.email,
    productIds.length
  );

  // 更新 pendingOrder 的 merchant_order_no 為此時的時間戳
  pendingOrder.merchant_order_no = merchantOrderNo;
  await dataSource.getRepository("Orders").save(pendingOrder);

  return res.status(200).type("html").send(html);
}

module.exports = {
  postOrder,
  getOrder,
  getAllOrders,
  getPaidOrder,
  postPendingOrder,
};
