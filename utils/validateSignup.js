const ERROR_MESSAGES = require("./errorMessages");
const PATTERN_RULE = require("./validatePatterns");
const { isValidEmail, isValidPassword } = require("./validUtils");

function validateSignup(data) {
  const errors = {};

  if (!isValidEmail(data.email)) {
    errors.email = ERROR_MESSAGES.EMAIL_NOT_RULE;
  }

  if (!isValidPassword(data.password)) {
    errors.password = ERROR_MESSAGES.PASSWORD_NOT_RULE;
  }

  if (!data.name?.match(PATTERN_RULE.NAME_PATTERN)) {
    errors.name = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (!data.phone?.match(PATTERN_RULE.PHONE_PATTERN)) {
    errors.phone = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (data.address) {
    if (
      !data.address.zipcode ||
      !data.address.zipcode.match(PATTERN_RULE.ZIPCODE_PATTERN)
    ) {
      errors.zipcode = ERROR_MESSAGES.FIELDS_INCORRECT;
    }
    if (!data.address.district) {
      errors.district = ERROR_MESSAGES.FIELDS_INCORRECT;
    }
    if (!data.address.street_address) {
      errors.street_address = ERROR_MESSAGES.FIELDS_INCORRECT;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = validateSignup;
