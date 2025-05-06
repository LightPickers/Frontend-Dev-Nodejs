const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("Cart");
const {
  isUndefined,
  isValidString,
  isValidEmail,
  isValidPhone,
} = require("../utils/validUtils");
const { merchantId, version } = require("../config/neWebPaySecret");
const {
  genDataChain,
  create_mpg_aes_encrypt,
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
} = require("../utils/neWebPayCrypto");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postOrder(req, res, next) {}

module.exports = {
  postOrder,
};
