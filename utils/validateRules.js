const PUTPASSWORD_RULE = {
  password: "string",
  newPassword: "string",
  confirmNewPassword: "string",
};

const RESETPASSWORD_RULE = {
  token: "string",
  newPassword: "string",
  confirmNewPassword: "string",
};

const CARTCHECKOUT_RULES = {
  shippingMethod: "string",
  paymentMethod: "string",
  desiredDate: "string",
};

const EMAIL_RULE = {
  to: "string",
};

const REVIEWS_RULE = {
  rating: "number",
  comment: "string",
};

const PAGE_PER_RULE = {
  page: "string",
  per: "string",
};

const PAGENUMBER_PERNUMBER_RULE = {
  pageNumber: "number",
  perNumber: "number",
};

const REVIEWS_REPLY_RULE = {
  reply: "string",
};

module.exports = {
  PUTPASSWORD_RULE,
  RESETPASSWORD_RULE,
  CARTCHECKOUT_RULES,
  EMAIL_RULE,
  REVIEWS_RULE,
  PAGE_PER_RULE,
  PAGENUMBER_PERNUMBER_RULE,
  REVIEWS_REPLY_RULE,
};
