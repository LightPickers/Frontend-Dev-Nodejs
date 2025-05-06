const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("Cart");
const { isUndefined, isValidString } = require("../utils/validUtils");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function getCart(req, res, next) {
  const { id: userId } = req.user;
  const cart = await dataSource
    .getRepository("Cart")
    .createQueryBuilder("cart")
    .leftJoinAndSelect("cart.Products", "Products")
    .where("cart.user_id = :userId", { userId })
    .select([
      "cart.id",
      "cart.price_at_time",
      "cart.quantity",
      "Products.name",
      "Products.primary_image",
      "Products.is_available",
    ])
    .getMany();

  const items = cart.map(({ Products, price_at_time, quantity }) => {
    return {
      primary_image: Products?.primary_image || "",
      name: Products?.name || "商品已下架",
      price_at_time: price_at_time,
      quantity: quantity,
      total_price: price_at_time * quantity,
      is_available: Products?.is_available,
    };
  });

  const amount = items
    .filter((item) => item.is_available)
    .reduce((sum, item) => sum + item.total_price, 0);

  res.status(200).json({
    status: true,
    data: {
      items: items.map(({ is_available, ...rest }) => rest),
      amount,
    },
  });
}

async function deleteCartProduct(req, res, next) {
  const { cart_id } = req.params;
  const { id: user_id } = req.user;
  if (isUndefined(cart_id) || !isValidString(cart_id)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const cartRepo = dataSource.getRepository("Cart");
  const result = await cartRepo.delete({
    id: cart_id,
    user_id: user_id,
  });
  if (result.affected === 0) {
    logger.warn(`購物車商品${ERROR_MESSAGES.DATA_NOT_DELETE}`);
    return next(
      new AppError(400, `購物車商品${ERROR_MESSAGES.DATA_NOT_DELETE}`)
    );
  }

  res.status(200).json({
    status: true,
    message: "刪除成功",
  });
}

async function cleanCart(req, res, next) {
  const { id: user_id } = req.user;
  const cartRepo = dataSource.getRepository("Cart");
  const result = await cartRepo.delete({ user_id: user_id });
  if (result.affected === 0) {
    logger.warn(`購物車${ERROR_MESSAGES.DATA_NOT_DELETE}`);
    return next(new AppError(400, `購物車${ERROR_MESSAGES.DATA_NOT_DELETE}`));
  }

  res.status(200).json({
    status: true,
    message: "購物車清除成功",
  });
}

async function postCartCheckout(req, res, next) {
  const { id: userId } = req.user;
  const {
    shipping_method: shippingMethod,
    payment_method: paymentMethod,
    desired_date: desiredDate,
    coupon_code: couponCode,
  } = req.body;

  if (
    isUndefined(shippingMethod) ||
    !isValidString(shippingMethod) ||
    isUndefined(paymentMethod) ||
    !isValidString(paymentMethod) ||
    isUndefined(desiredDate) ||
    !isValidString(desiredDate)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const couponRepo = dataSource.getRepository("Coupons");
  const orderRepo = dataSource.getRepository("Orders");

  let coupon = null;
  if (couponCode) {
    coupon = await couponRepo.findOne({
      select: ["id", "code", "discount"],
      where: { code: couponCode },
    });

    if (!coupon) {
      logger.warn(`優惠券${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      return next(new AppError(400, `優惠券${ERROR_MESSAGES.DATA_NOT_FOUND}`));
    }

    const usedCoupon = await orderRepo.findOne({
      select: ["id", "user_id", "coupon_id"],
      where: { user_id: userId, coupon_id: coupon.id, status: "completed" },
    });

    if (usedCoupon) {
      logger.warn(`優惠券${ERROR_MESSAGES.DATA_ALREADY_USED}`);
      return next(
        new AppError(400, `優惠券${ERROR_MESSAGES.DATA_ALREADY_USED}`)
      );
    }
  }

  const cacheKey = `checkout:${userId}`;
  const order_draft = {
    user_id: userId,
    shippingMethod,
    paymentMethod,
    desiredDate,
  };
  if (coupon) {
    order_draft.coupon = {
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
    };
  }

  try {
    await redis.set(cacheKey, JSON.stringify(order_draft), { EX: 1800 }); // 30 分鐘
    logger.info(`訂單暫存成功：${cacheKey}`);
  } catch (error) {
    logger.error(ERROR_MESSAGES.REDIS_WRITE_FAILED, error);
    return next(new AppError(500, "伺服器暫時無法處理結帳資訊"));
  }

  return res.status(200).json({
    status: true,
    message: "結帳資料暫存成功",
    data: {
      order_draft,
    },
  });
}

module.exports = {
  getCart,
  deleteCartProduct,
  cleanCart,
  postCartCheckout,
};
