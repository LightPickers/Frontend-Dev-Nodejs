const PATTERN_RULE = {
  NAME_PATTERN: /^[a-zA-Z\u4e00-\u9fa5]{2,10}$/,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/,
  URL_PATTERN: /^(https:\/\/)([a-zA-Z0-9.-]+)(\.[a-zA-Z]{2,})(\/.*)?$/,
  PHONE_PATTERN: /^(09\d{8})$/,
  ZIPCODE_PATTERN: /^\d{3}$/,
  DATE_PATTERN: /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
};

module.exports = PATTERN_RULE;
