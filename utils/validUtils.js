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

async function checkIfProductExists(favoritesRepo, userId, productId) {
  return await favoritesRepo.findOne({
    where: {
      Users: { id: userId },
      Products: { id: productId },
    },
    relations: ["Users", "Products"],
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
  isValidBirthDate,
  checkIfProductExists,
};
