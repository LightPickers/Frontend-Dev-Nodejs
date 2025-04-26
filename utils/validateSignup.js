const ERROR_MESSAGES = require("./errorMessages");
const PATTERN_RULE = require("./validatePatterns");
const {
  isValidEmail,
  isValidPassword,
  isValidBirthDate,
} = require("./validUtils");

function validateSignup(data) {
  const errors = {};

  if (!isValidEmail(data.email)) {
    errors.email = ERROR_MESSAGES.EMAIL_NOT_RULE;
  }

  if (!isValidPassword(data.password)) {
    errors.password = ERROR_MESSAGES.PASSWORD_NOT_RULE;
  }

  if (!data.name?.match(PATTERN_RULE.NAME_PATTERN)) {
    errors.name = ERROR_MESSAGES.NAME_NOT_RULE;
  }

  if (!data.phone?.match(PATTERN_RULE.PHONE_PATTERN)) {
    errors.phone = ERROR_MESSAGES.PHONE_NOT_RULE;
  }

  if (!isValidBirthDate(data.birth_date)) {
    errors.birth_date = ERROR_MESSAGES.BIRTH_DATE_NOT_RULE;
  }

  if (!data.address_zipcode?.match(PATTERN_RULE.ZIPCODE_PATTERN)) {
    errors.zipcode = ERROR_MESSAGES.ZIPCODE_NOT_RULE;
  }
  if (!data.address_detail) {
    errors.address_detail = ERROR_MESSAGES.ADDRESS_NOT_RULE;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = validateSignup;
