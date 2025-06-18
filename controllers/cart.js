const { dataSource } = require("../db/data-source");
const { redis } = require("../utils/redis/redis");
const logger = require("../utils/logger")("CartController");
const {
  isUndefined,
  isValidString,
  checkProductStatus,
  checkIfProductSaved,
} = require("../utils/validUtils");
const { validateFields } = require("../utils/validateFields");
const { CARTCHECKOUT_RULES } = require("../utils/validateRules");
const { isValidPaymentMethod } = require("../utils/validPaymentMethod");
const { isValidShippingMethod } = require("../utils/validShippingMethod");
const { isUUID } = require("validator");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function addCart(req, res, next) {
  const user_id = req.user.id;
  const { product_id } = req.params;

  if (
    isUndefined(product_id) ||
    !isValidString(product_id) ||
    !isUUID(product_id, 4)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const productsRepo = dataSource.getRepository("Products");
  const cartRepo = dataSource.getRepository("Cart");

  // 檢查商品狀態(是否存在、刪除、下架、庫存(若第3個參數為true))
  const productStatus = await checkProductStatus(
    productsRepo,
    product_id,
    true
  );
  if (!productStatus.success) {
    return next(new AppError(404, productStatus.error));
  }
  /*
  // 檢查商品是否存在
  const existProduct = await checkProduct(productsRepo, product_id);
  if (!existProduct) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 檢查商品是否有庫存
  const availableToSell = await checkInventory(productsRepo, product_id);
  if (!availableToSell) {
    logger.warn(ERROR_MESSAGES.PRODUCT_SOLDOUT);
    return next(new AppError(404, ERROR_MESSAGES.PRODUCT_SOLDOUT));
  }
  */

  // 檢查商品是否已被儲存於購物車中
  const productSaved = await checkIfProductSaved(cartRepo, user_id, product_id);

  if (productSaved) {
    logger.warn(ERROR_MESSAGES.DUPLICATE_ADD_TO_CART);
    return next(new AppError(409, ERROR_MESSAGES.DUPLICATE_ADD_TO_CART));
  }

  // const productPrice = await productsRepo.findOne({
  //   select: ["selling_price"],
  //   where: { id: product_id },
  // });

  const addCart = await cartRepo.create({
    Users: { id: user_id },
    Products: { id: product_id },
    price_at_time: productStatus.product.selling_price,
    quantity: 1,
  });
  await cartRepo.save(addCart);

  res.status(200).json({
    status: "true",
    message: "商品成功加入購物車",
  });
}

async function getCart(req, res, next) {
  const { id: userId } = req.user;
  const cart = await dataSource
    .getRepository("Cart")
    .createQueryBuilder("cart")
    .innerJoinAndSelect("cart.Products", "Products")
    .where("cart.user_id = :userId", { userId })
    .select([
      "cart.id",
      "cart.price_at_time",
      "cart.quantity",
      "Products.id",
      "Products.name",
      "Products.primary_image",
      "Products.is_available",
      "Products.is_sold",
      "Products.is_deleted",
    ])
    .orderBy("cart.created_at", "DESC")
    .getMany();
  /*
  const items = cart.map(({ id, Products, price_at_time, quantity }) => {
    const {
      id: product_id,
      name,
      primary_image,
      is_available,
    } = Products || {};
    return {
      id,
      primary_image: primary_image || "",
      product_id,
      name: name,
      price_at_time,
      quantity,
      total_price: price_at_time * quantity,
      is_available: Products?.is_available,
      is_sold: Products?.is_sold,
      is_deleted: Products?.is_deleted,
    };
  });
*/

  const items = cart.map(({ id, Products, price_at_time, quantity }) => {
    return {
      id,
      product_id: Products.id,
      name: Products.name,
      primary_image: Products.primary_image || "",
      price_at_time,
      quantity,
      total_price: price_at_time * quantity,
      is_available: Products.is_available,
      is_sold: Products.is_sold,
      is_deleted: Products.is_deleted,
    };
  });

  const amount = items.reduce((sum, item) => {
    return item.is_available ? sum + item.total_price : sum;
  }, 0);

  res.status(200).json({
    status: true,
    data: {
      items,
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

  const errorFields = validateFields(
    {
      shippingMethod,
      paymentMethod,
      desiredDate,
    },
    CARTCHECKOUT_RULES
  );
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  // 驗證寄送方式
  if (!isValidShippingMethod(shippingMethod)) {
    logger.warn(ERROR_MESSAGES.SHIPPING_METHOD_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.SHIPPING_METHOD_NOT_RULE));
  }
  // 驗證付款方式
  if (!isValidPaymentMethod(paymentMethod)) {
    logger.warn(ERROR_MESSAGES.PAYMENT_METHOD_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.PAYMENT_METHOD_NOT_RULE));
  }

  const couponRepo = dataSource.getRepository("Coupons");
  const orderRepo = dataSource.getRepository("Orders");

  let coupon = null;
  if (couponCode) {
    coupon = await couponRepo.findOneBy({ code: couponCode });

    if (!coupon) {
      logger.warn(`優惠券${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      return next(new AppError(400, `優惠券${ERROR_MESSAGES.DATA_NOT_FOUND}`));
    }

    // 判斷優惠券是否供應
    if (!coupon.is_available) {
      logger.warn(`優惠券${ERROR_MESSAGES.DATA_NOT_AVAILABLE}`);
      return next(
        new AppError(400, `優惠券${ERROR_MESSAGES.DATA_NOT_AVAILABLE}`)
      );
    }

    // 判斷 現在 是否在 該優惠券使用範圍內（包含開始和結束日）
    const now = Date.now();
    const startAt = new Date(coupon.start_at).getTime();
    const endAt = new Date(coupon.end_at).getTime();

    if (now < startAt || now > endAt) {
      logger.warn(ERROR_MESSAGES.COUPON_PERIOD_ERROR);
      return next(new AppError(400, ERROR_MESSAGES.COUPON_PERIOD_ERROR));
    }

    // 此優惠券已使用過
    const usedCoupon = await orderRepo.findOne({
      select: ["id"],
      where: {
        user_id: userId,
        coupon_id: coupon.id,
        status: "paid",
      },
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
    return next(
      new AppError(500, ERROR_MESSAGES.REDIS_FAILED_TO_PROCESS_CHECKOUT)
    );
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
  addCart,
  getCart,
  deleteCartProduct,
  cleanCart,
  postCartCheckout,
};
