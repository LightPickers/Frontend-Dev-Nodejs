const validator = require("validator");
const PATTERN_RULE = require("./validatePatterns");

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

module.exports = { isValidStringArray };

// 檢查商品是否已收藏/加入購物車
async function checkIfProductSaved(targetRepo, userId, productId) {
  return await targetRepo.findOne({
    where: {
      Users: { id: userId },
      Products: { id: productId },
    },
    relations: ["Users", "Products"],
  });
}

// 檢查商品是否存在
async function checkProduct(productsRepo, product_id) {
  return await productsRepo.findOne({
    where: { id: product_id },
  });
}

// 檢查商品是否有庫存
async function checkInventory(productsRepo, product_id) {
  return await productsRepo
    .createQueryBuilder("product")
    .select("product.is_available")
    .where("product.id = :product_id", { product_id })
    .getRawOne();
}

// 檢查訂單是否存在
async function checkOrder(ordersRepo, order_id) {
  return await ordersRepo.findOne({
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
  checkProduct,
  checkInventory,
  checkOrder,
};
