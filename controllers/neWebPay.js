const { In } = require("typeorm");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("NeWebPayController");
const {
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
} = require("../utils/neWebPayCrypto");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const { isValidString } = require("../utils/validUtils");

async function postReturn(req, res, next) {
  const resData = req.body;
  const info = create_mpg_aes_decrypt(resData.TradeInfo);
  logger.info("藍新回傳解密 info: ", info);

  const order = await dataSource.getRepository("Orders").findOne({
    select: ["id"],
    where: { merchant_order_no: info.Result.MerchantOrderNo },
  });
  if (!order) {
    logger.warn(`找不到訂單 MerchantOrderNo: ${info.Result.MerchantOrderNo}`);
    return next(new AppError(404, `訂單 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }
  const orderId = order.id;

  // 根據狀態轉跳前端顯示畫面（以 React 頁面為例）
  let redirectURL;
  if (info.Status === "SUCCESS") {
    redirectURL = `https://lightpickers.github.io/Frontend-Dev-React/#/checkout/status/${orderId}`;
  }

  return res.redirect(redirectURL);
}
async function postNotify(req, res, next) {
  const resData = req.body;
  logger.info("藍新 Notify body: ", req.body);

  if (!resData.TradeInfo || !resData.TradeSha) {
    logger.warn(ERROR_MESSAGES.TRADEINFO_OR_TRADESHA_NOT_FOUND);
    return next(
      new AppError(404, ERROR_MESSAGES.TRADEINFO_OR_TRADESHA_NOT_FOUND)
    );
  }
  const thisShaEncrypt = create_mpg_sha_encrypt(resData.TradeInfo); //再次加密回傳的字串
  // 比對 SHA 是否一致
  if (thisShaEncrypt !== resData.TradeSha) {
    logger.warn(ERROR_MESSAGES.PAY_FAILED_TREADSHA_NOT_SAME);
    return next(new AppError(400, ERROR_MESSAGES.PAY_FAILED_TREADSHA_NOT_SAME));
  }

  const info = create_mpg_aes_decrypt(resData.TradeInfo); // 解密後的藍新交易資料
  const result = info.Result;

  try {
    await dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository("Orders");
      const order = await orderRepo.findOneBy({
        merchant_order_no: result.MerchantOrderNo, // 用藍新回傳的 MerchantOrderNo 來查詢
      });
      // 確認訂單是否存在
      if (!order) {
        logger.warn(
          `藍新訂單 ${result.MerchantOrderNo} ${ERROR_MESSAGES.DATA_NOT_FOUND}`
        );
        throw new AppError(
          404,
          `藍新訂單 ${result.MerchantOrderNo} ${ERROR_MESSAGES.DATA_NOT_FOUND}`
        );
      }

      // 建立付款紀錄 payment
      const paymentRepo = manager.getRepository("Payments");
      const newPayment = paymentRepo.create({
        order_id: order.id,
        user_id: order.user_id,
        transaction_id: result.TradeNo,
        status: "付款成功",
        paid_at: new Date(result.PayTime),
      });
      await paymentRepo.save(newPayment);

      // 更新 Order status 狀態
      order.status = "已付款";
      await orderRepo.save(order);

      // 取得訂單商品
      const orderItemsRepo = manager.getRepository("Order_items");
      const orderItems = await orderItemsRepo.find({
        select: ["product_id"],
        where: { order_id: order.id },
      });

      const productIds = orderItems
        .map((item) => item.product_id) // 訂單項目裡 所有的 product_id
        .filter((id) => isValidString(id) && id.length > 0);

      if (!productIds.length) {
        logger.warn(`訂單 ${order.id} ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
        throw new AppError(
          404,
          `訂單 ${order.id} ${ERROR_MESSAGES.DATA_NOT_FOUND}`
        );
      }

      // 更新 商品庫存、是否供應
      const productRepo = manager.getRepository("Products");
      const products = await productRepo.find({
        where: { id: In(productIds) },
      });

      for (const product of products) {
        product.is_available = false;
      }

      await productRepo.save(products);
    });

    return res.status(200).send("OK");
  } catch (err) {
    logger.error("藍新通知處理失敗：", err);

    // 如果是 AppError 傳進來的，直接丟給 error middleware
    if (err instanceof AppError) return next(err);

    // 否則是內部錯誤
    return next(new AppError(500, "付款完成但後端處理失敗"));
  }
}

module.exports = {
  postReturn,
  postNotify,
};
