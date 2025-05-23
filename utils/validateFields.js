const ERROR_MESSAGES = require("./errorMessages");
const { isUndefined, isValidString, isValidInteger } = require("./validUtils");

function validateFields(fields, rules) {
  const errors = [];
  for (const [key, expectedType] of Object.entries(rules)) {
    const value = fields[key];

    // 檢查是否有值
    if (isUndefined(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
      continue;
    }
    // 檢查型別
    if (typeof value !== expectedType) {
      errors.push(`${key} 必須是 ${expectedType}`);
      continue;
    }
    // 檢查字串
    if (expectedType == "string" && !isValidString(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
      continue;
    }
    //檢查整數
    if (expectedType == "number" && !isValidInteger(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
      continue;
    }
  }
  return errors.length > 0 ? errors : null;
}

module.exports = { validateFields };
