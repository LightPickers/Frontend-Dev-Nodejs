const crypto = require("crypto");
const {
  hashIv,
  hashKey,
  merchantId,
  version,
  notifyUrl,
} = require("../config/secret");
const RespondType = "JSON";

function genDataChain(neWedPayOrder) {
  return `MerchantID=${merchantId}&RespondType=${RespondType}&TimeStamp=${
    neWedPayOrder.TimeStamp
  }&
      Version=${version}&MerchantOrderNo=${neWedPayOrder.MerchantOrderNo}&
      Amt=${neWedPayOrder.Amt}&ItemDesc=${encodeURIComponent(
    neWedPayOrder.ItemDesc
  )}&NotifyURL=${encodeURIComponent(notifyUrl)}`;
}

function create_mpg_aes_encrypt(TradeInfo) {
  const encrypt = crypto.createCipheriv("aes-256-cbc", hashKey, hashIv);
  const enc = encrypt.update(genDataChain(TradeInfo), "utf8", "hex");
  return enc + encrypt.final("hex");
}

function create_mpg_sha_encrypt(aesEncrypt) {
  const sha = crypto.createHash("sha256");
  const plainText = `HashKey=${hashKey}&${aesEncrypt}&HashIV=${hashIv}`;

  return sha.update(plainText).digest("hex").toUpperCase();
}

function create_mpg_aes_decrypt(TradeInfo) {
  const decrypt = crypto.createDecipheriv("aes256", hashKey, hashIv);
  decrypt.setAutoPadding(false);
  const text = decrypt.update(TradeInfo, "hex", "utf8");
  const plainText = text + decrypt.final("utf8");
  const result = plainText.replace(/[\x00-\x20]+/g, "");
  return JSON.parse(result);
}

module.exports = {
  genDataChain,
  create_mpg_aes_encrypt,
  create_mpg_sha_encrypt,
  create_mpg_aes_decrypt,
};
