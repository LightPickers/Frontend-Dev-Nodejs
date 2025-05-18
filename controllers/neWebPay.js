const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("NeWebPayController");
const {
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
} = require("../utils/neWebPayCrypto");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postReturn(req, res, next) {
  const { TradeInfo } = req.body;
  const info = create_mpg_aes_decrypt(TradeInfo);
  const { Status, Result } = info;
  const orderId = Result.MerchantOrderNo;

  // 根據狀態轉跳前端顯示畫面（以 React 頁面為例）
  const redirectURL =
    Status === "SUCCESS"
      ? `https://lightpickers.github.io/Frontend-Dev-React/#/cart/payment-success?orderNo=${orderId}`
      : `https://lightpickers.github.io/Frontend-Dev-React/#/cart/payment-failed?orderNo=${orderId}`;

  return res.redirect(redirectURL);
}
async function postNotify(req, res, next) {
  const resData = req.body;
  const thisShaEncrypt = create_mpg_sha_encrypt(resData.TradeInfo); //再次加密回傳的字串
  // 比對 SHA 是否一致
  if (thisShaEncrypt !== resData.TradeSha) {
    logger.warn(ERROR_MESSAGES.PAY_FAILED_TREADSHA_NOT_SAME);
    return next(new AppError(400, ERROR_MESSAGES.PAY_FAILED_TREADSHA_NOT_SAME));
  }

  const info = create_mpg_aes_decrypt(resData.TradeInfo); // 解密後的藍新交易資料
  const neWebPayMerchantOrderNo = info.Result.MerchantOrderNo; // 取出藍新回傳的order_id
  const orderRepo = dataSource.getRepository("Orders");
  const checkOrder = await orderRepo.findOneBy({
    merchant_order_no: neWebPayMerchantOrderNo,
  });
  // 確認訂單是否存在
  if (!checkOrder) {
    logger.warn(`藍新訂單${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `藍新訂單${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }
  // 將資料寫入 payment
  const payment = dataSource.getRepository("Payment");
  const newPayment = await payment.create({
    order_id: neWebPayOrderId,
    user_id: checkOrder.user_id,
    transaction_id: info.Result.TradeNo,
    status: "付款成功",
    paid_at: info.Result.PayTime,
  });
  await payment.save(newPayment);

  // 更改 Order status 狀態
  checkOrder.status = "已付款";
  await orderRepo.save(checkOrder);

  // 更改商品庫存、是否供應
  const findProducts = await dataSource.getRepository("Order_items").find({
    select: ["product_id"],
    where: { order_id: checkOrder.id },
  });
  const productIds = findProducts.map((item) => item.product_id);
  const productRepo = dataSource.getRepository("Products");
  const products = await productRepo.find({
    where: { id: In(productIds) },
  });
  const updatedProduct = products.map((product) => {
    product.is_available = false;
    return product;
  });
  await productRepo.save(updatedProduct);
}

module.exports = {
  postReturn,
  postNotify,
};
