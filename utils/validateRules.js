const PUTPASSWORD_RULE = {
  password: "string",
  newPassword: "string",
  comfirmNewPassword: "string",
};

const CARTCHECKOUT_RULES = {
  shippingMethod: "string",
  paymentMethod: "string",
  desiredDate: "string",
};

const EMAIL_RULE = {
  to: "string",
};

module.exports = {
  PUTPASSWORD_RULE,
  CARTCHECKOUT_RULES,
  EMAIL_RULE,
};
