const ERROR_MESSAGES = require("./errorMessages");
const { isValidPassword } = require("./validUtils");

// 驗證密碼規則
function validatePasswordRule(passwords) {
  const errors = [];
  for (const [key, value] of Object.entries(passwords)) {
    if (!isValidPassword(value)) {
      errors.push(`${key} ${ERROR_MESSAGES.PASSWORD_NOT_RULE}`);
    }
  }
  return errors.length > 0 ? errors : null;
}

module.exports = { validatePasswordRule };
