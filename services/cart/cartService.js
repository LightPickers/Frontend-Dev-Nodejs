const { In } = require("typeorm");
const { isValidStringArray } = require("../../utils/validUtils");
const logger = require("../../utils/logger");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

class CartService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async cartIdsValidator(cart_ids) {
    try {
      if (!isValidStringArray(cart_ids)) {
        logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
        throw new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT);
      }

      const cartRepo = this.dataSource.getRepository("Cart");
      const productRepo = this.dataSource.getRepository("Products");

      // 從 req.body 的 cartIds 取得 productIds
      const carts = await cartRepo.find({
        where: { id: In(cart_ids) },
      });
      const productIds = carts.map((c) => c.product_id);

      // 檢查 cartIds 裡，是否有未供應的商品
      const unavailableCount = await productRepo.count({
        where: {
          id: In(productIds),
          is_available: false,
        },
      });
      if (unavailableCount > 0) {
        logger.warn(ERROR_MESSAGES.PRODUCT_SOLDOUT);
        throw new AppError(400, ERROR_MESSAGES.PRODUCT_SOLDOUT);
      }

      return { carts, productIds };
    } catch (err) {
      console.error("cartIdsValidator Error:", err);
    }
  }
}

module.exports = CartService;
