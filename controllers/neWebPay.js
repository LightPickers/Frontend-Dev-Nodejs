const config = require("../config/index");
const logger = require("../utils/logger")("NeWebPayController");
const {
  genDataChain,
  create_mpg_aes_encrypt,
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
} = require("../utils/neWebPayCrypto");

async function postReturn(req, res, next) {}
async function postNotify(req, res, next) {}

module.exports = {
  postReturn,
  postNotify,
};
