const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("Cart");
const { isUndefined, isValidString } = require("../utils/validUtils");
const {
  genDataChain,
  create_mpg_aes_encrypt,
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
} = require("../utils/neWebPayCrypto");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postOrder(req, res, next) {
  const { id: userId } = req.user;
  const { cart_ids } = req.body;
  const isValidCartIds = cart_ids.every(
    (id) => !isUndefined(id) && isValidString(id)
  );
  if (!isValidCartIds) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const data = await redis.get(`checkout:${userId}`);
  if (!data) {
    return next(new AppError(400, ERROR_MESSAGES.FINISH_CHECKOUT_FIRST));
  }
  const checkoutData = JSON.parse(data);

  // 檢查是否已有 未付款的相同商品訂單
  const carts = await dataSource.getRepository("Cart").find({
    where: { id: In(cart_ids) },
  });
  const productIds = carts.map((cart) => cart.product_id);

  const existingOrder = await dataSource
    .getRepository("Orders")
    .createQueryBuilder("order")
    .innerJoin("Order_items", "item", "item.order_id = order.id")
    .where("order.user_id = :userId", { userId })
    .andWhere("order.status = :status", { status: "待付款" })
    .andWhere("item.product_id IN (:...productIds)", { productIds })
    .getOne();

  if (existingOrder) {
    logger.warn(ERROR_MESSAGES.ORDER_ALREADY_USED_PLEASE_PAY_FIRST);
    return next(
      new AppError(400, ERROR_MESSAGES.ORDER_ALREADY_USED_PLEASE_PAY_FIRST)
    );
  }

  let newOrder;

  await dataSource.transaction(async (manager) => {
    const cartRepo = manager.getRepository("Cart");
    const orderRepo = manager.getRepository("Orders");
    const orderItemsRepo = manager.getRepository("Order_items");

    // 計算付款總額 amount
    const result = await cartRepo
      .createQueryBuilder("cart")
      .select("SUM(cart.price_at_time)", "total")
      .where("cart.id IN (:...ids)", { ids: cart_ids })
      .getRawOne();

    const amount = Number(result.total) || 0;

    //建立 Order 資料
    newOrder = await orderRepo.create({
      user_id: userId,
      status: "待付款",
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
    }

    await orderRepo.save(newOrder);

    // 將 cart 品項整理好，存入 Order_items
    const carts = await cartRepo.find({
      where: { id: In(cart_ids) },
    });
    const orderItemsData = carts.map((cart) => ({
      order_id: newOrder.id,
      product_id: cart.product_id,
      quantity: cart.quantity || 1,
      price: cart.price_at_time,
    }));
    await orderItemsRepo.save(orderItemsData);
  });

  await redis.del(`checkout:${userId}`);

  const cartRepo = dataSource.getRepository("Cart");

  // 藍新金流
  const Email = await dataSource.getRepository("Users").findOne({
    select: ["email"],
    where: { id: userId },
  });
  const cartItem = await cartRepo.findOne({
    select: ["product_id"],
    where: { id: cart_ids[0] },
  });
  const productId = cartItem.product_id;
  const productName = await dataSource.getRepository("Products").findOne({
    select: ["name"],
    where: { id: productId },
  });
  const ItemDesc = `${productName.name}...等${cart_ids.length}項商品`;
  const TimeStamp = Math.round(new Date().getTime() / 1000);
  const neWedPayOrder = {
    Email: Email.email,
    Amt: newOrder.amount,
    ItemDesc,
    TimeStamp,
    MerchantOrderNo: newOrder.id,
  };

  const aesEncrypt = create_mpg_aes_encrypt(neWedPayOrder);
  const shaEncrypt = create_mpg_sha_encrypt(neWedPayOrder);

  const htmlForm = ` 
    <form action="https://ccore.newebpay.com/MPG/mpg_gateway" method="post">
      <input type="text" name="MerchantID" value="${config.get(
        "neWebPaySecret.merchantId"
      )}">
      <input type="hidden" name="TradeInfo" value="${aesEncrypt}">
      <input type="hidden" name="TradeSha" value="${shaEncrypt}">
      <input type="text" name="TimeStamp" value="${neWedPayOrder.TimeStamp}">
      <input type="text" name="Version" value="${config.get(
        "neWebPaySecret.version"
      )}">
      <input type="text" name="MerchantOrderNo" value="${
        neWedPayOrder.MerchantOrderNo
      }">
      <input type="text" name="Amt" value="${neWedPayOrder.Amt}">
      <input type="email" name="Email" value="${neWedPayOrder.Email}">
      <button type="submit">送出</button>
    </form>`;

  res.status(200).type("html").send(htmlForm);
}

module.exports = {
  postOrder,
};
