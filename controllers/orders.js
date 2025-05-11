const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("Cart");
const { isUUID } = require("validator");
const {
  isUndefined,
  isValidString,
  checkOrder,
} = require("../utils/validUtils");
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

  // Orders
  const data = await redis.get(`checkout:${userId}`);
  if (!data) {
    return next(new AppError(400, ERROR_MESSAGES.FINISH_CHECKOUT_FIRST));
  }
  const checkoutData = JSON.parse(data);

  const cartRepo = dataSource.getRepository("Cart");
  const result = await cartRepo
    .createQueryBuilder("cart")
    .select("SUM(cart.price_at_time)", "total")
    .where("cart.id IN (:...ids)", { ids: cart_ids })
    .getRawOne();

  const amount = Number(result.total) || 0;

  const orderRepo = dataSource.getRepository("Orders");
  let newOrder = await orderRepo.create({
    user_id: userId,
    status: "待付款",
    desired_date: checkoutData.desiredDate,
    shipping_method: checkoutData.shippingMethod,
    payment_method: checkoutData.paymentMethod,
    amount,
  });
  if (checkoutData.coupon) {
    newOrder.coupon_id = checkoutData.coupon.id;
    newOrder.amount = Math.round((amount / 10) * checkoutData.coupon.discount);
  }
  await orderRepo.save(newOrder);

  // Order_items
  const carts = await cartRepo.find({
    where: { id: In(cart_ids) },
  });
  const orderItemsData = carts.map((cart) => ({
    order_id: newOrder.id,
    product_id: cart.product_id,
    quantity: cart.quantity || 1,
    price: cart.price_at_time,
  }));
  await dataSource.getRepository("Order_items").save(orderItemsData);

  await redis.del(`checkout:${userId}`);

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

async function getOrder(req, res, next) {
  // const user_id = req.user.id;
  const { oder_id } = req.params;

  //400
  if (isUndefined(oder_id) || !isValidString(oder_id) || !isUUID(oder_id, 4)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const ordersRepo = dataSource.getRepository("Orders");

  // 404
  const existOrder = await checkOrder(ordersRepo, oder_id);
  if (!existOrder) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 200
  const orderInfo = await ordersRepo.findOne({
    select: {
      id: true,
      created_at: true,
      status: true,
      desired_date: true,
      shipping_method: true,
      payment_method: true,

      // Categories: { id: true, name: true },
    },
    relations: {
      Categories: true,
      Brands: true,
      Conditions: true,
    },
    where: { id: oder_id },
  });

  res.status(200).json({
    message: "成功",
    status: "true",
    order: orderInfo,
  });
}

module.exports = {
  postOrder,
  getOrder,
};
