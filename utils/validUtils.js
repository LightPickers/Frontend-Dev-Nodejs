const validator = require("validator");
const PATTERN_RULE = require("./validatePatterns");
const ERROR_MESSAGES = require("../utils/errorMessages");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");

function isUndefined(value) {
  return value === undefined;
}
function isValidString(value) {
  return typeof value === "string" && !validator.isEmpty(value.trim());
}
function isValidInteger(value) {
  return (
    typeof value === "number" && validator.isInt(String(value), { min: 0 })
  );
}
function isValidEmail(value) {
  return validator.isEmail(value);
}
function isValidPassword(value) {
  return PATTERN_RULE.PASSWORD_PATTERN.test(value);
}
function isValidUrl(value) {
  return PATTERN_RULE.URL_PATTERN.test(value);
}
function isValidPhone(value) {
  return PATTERN_RULE.PHONE_PATTERN.test(value);
}
function isValidName(value) {
  return PATTERN_RULE.NAME_PATTERN.test(value);
}

function isValidId(value) {
  return PATTERN_RULE.ID_PATTERN.test(value);
}

function isValidBirthDate(value) {
  if (!PATTERN_RULE.DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const now = new Date();
  if (date > now) return false;

  const age = now.getFullYear() - year;
  if (age < 0 || age > 120) return false;

  return true;
}

function isValidStringArray(arr) {
  if (!Array.isArray(arr)) {
    return false;
  }
  return arr.every((item) => !isUndefined(item) && isValidString(item));
}

// 檢查商品是否已收藏/加入購物車
/*
async function checkIfProductSaved(targetRepo, userId, productId) {
  return await targetRepo.findOne({
    where: {
      Users: { id: userId },
      Products: { id: productId },
    },
    relations: ["Users", "Products"],
  });
}
  */
// utils/checkIfProductSaved.js（或 utils 資料夾中）

async function checkIfProductSaved(repo, userId, productId) {
  return await repo.exist({
    where: {
      Users: { id: userId },
      Products: { id: productId },
    },
    relations: ["Users", "Products"],
  });
}

// 檢查商品是否存在
async function checkExisted(productsRepo, product_id) {
  return await productsRepo.exist({
    where: { id: product_id },
  });
}

// 檢查商品是否有上架
async function checkListed(productsRepo, product_id) {
  const result = await productsRepo
    .createQueryBuilder("product")
    .select("product.is_available")
    .where("product.id = :product_id", { product_id })
    .getRawOne();
  return result ? result.is_available : null;
}

// 檢查商品是否有庫存
async function checkSold(productsRepo, product_id) {
  const result = await productsRepo
    .createQueryBuilder("product")
    .select("product.is_sold")
    .where("product.id = :product_id", { product_id })
    .getRawOne();
  return result ? result.is_sold : null;
}

// 檢查商品是否被刪除
async function checkDeleted(productsRepo, product_id) {
  const result = await productsRepo
    .createQueryBuilder("product")
    .select("product.is_deleted")
    .where("product.id = :product_id", { product_id })
    .getRawOne();
  return result ? result.is_deleted : null;
}

// 綜合檢查商品是否: 存在、刪除、上架、庫存(若inventory為true)
/*
async function checkProductStatus(productsRepo, product_id, inventory) {
  const product = await productsRepo
    .createQueryBuilder("product")
    .select(["id", "is_deleted", "is_available", "is_sold"])
    .where("product.id = :product_id", { product_id })
    .getRawOne();

  console.log(product);

  if (!product) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return { success: false, error: ERROR_MESSAGES.DATA_NOT_FOUND };
  }

  if (product.is_deleted) {
    logger.warn(ERROR_MESSAGES.PRODUCT_DELETED);
    return { success: false, error: ERROR_MESSAGES.PRODUCT_DELETED };
  }

  if (!product.is_available) {
    console.log(product.is_available);
    logger.warn(ERROR_MESSAGES.PRODUCT_DELISTED);
    return { success: false, error: ERROR_MESSAGES.PRODUCT_DELISTED };
  }

  if (inventory) {
    if (product.is_sold) {
      logger.warn(ERROR_MESSAGES.PRODUCT_SOLDOUT);
      return { success: false, error: ERROR_MESSAGES.PRODUCT_SOLDOUT };
    }
  }

  return { success: true };
}
*/

async function checkProductStatus(productsRepo, product_id, inventory) {
  const product = await productsRepo
    .createQueryBuilder("product")
    .select([
      "product.id",
      "product.selling_price",
      "product.is_deleted",
      "product.is_available",
      "product.is_sold",
    ])
    .where("product.id = :product_id", { product_id })
    .getOne();

  if (!product) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return { success: false, error: ERROR_MESSAGES.DATA_NOT_FOUND };
  }

  if (product.is_deleted) {
    logger.warn(ERROR_MESSAGES.PRODUCT_DELETED);
    return { success: false, error: ERROR_MESSAGES.PRODUCT_DELETED };
  }

  if (!product.is_available) {
    logger.warn(ERROR_MESSAGES.PRODUCT_DELISTED);
    return { success: false, error: ERROR_MESSAGES.PRODUCT_DELISTED };
  }

  if (inventory && product.is_sold) {
    logger.warn(ERROR_MESSAGES.PRODUCT_SOLDOUT);
    return { success: false, error: ERROR_MESSAGES.PRODUCT_SOLDOUT };
  }
  return { success: true, product };
}

// 檢查訂單是否存在
async function checkOrder(ordersRepo, order_id) {
  return await ordersRepo.exist({
    where: { id: order_id },
  });
}

module.exports = {
  isUndefined,
  isValidString,
  isValidInteger,
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isValidPhone,
  isValidName,
  isValidId,
  isValidBirthDate,
  isValidStringArray,
  checkIfProductSaved,
  checkExisted,
  checkListed,
  checkSold,
  checkDeleted,
  checkProductStatus,
  checkOrder,
};
