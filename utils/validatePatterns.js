const PATTERN_RULE = {
  NAME_PATTERN: /^[a-zA-Z\u4e00-\u9fa5]{2,10}$/,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/,
  URL_PATTERN: /^(https:\/\/)([a-zA-Z0-9.-]+)(\.[a-zA-Z]{2,})(\/.*)?$/,
  PHONE_PATTERN: /^(09\d{8})$/,
  ZIPCODE_PATTERN: /^\d{3}$/,
};

module.exports = PATTERN_RULE;
