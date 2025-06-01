const ERROR_MESSAGES = require("./errorMessages");
const { isUndefined, isValidString, isValidInteger } = require("./validUtils");

// 驗證欄位
function validateFields(fields, rules) {
  const errors = [];
  for (const [key, expectedType] of Object.entries(rules)) {
    const value = fields[key];

    // 檢查是否有值
    if (isUndefined(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    } else if (typeof value !== expectedType) {
      errors.push(`${key} 必須是 ${expectedType}`); // 檢查型別
    } else if (expectedType == "string" && !isValidString(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`); // 檢查字串
    } else if (expectedType == "number" && !isValidInteger(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`); //檢查整數
    }
  }
  return errors.length > 0 ? errors : null;
}

module.exports = { validateFields };
