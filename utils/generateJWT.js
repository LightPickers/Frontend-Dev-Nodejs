//utils/generateJWT.js

const jwt = require("jsonwebtoken");
const AppError = require("./appError");
const ERROR_MESSAGES = require("./errorMessages");

/**
 * create JSON Web Token
 * @param {Object} payload token content
 * @param {String} secret token secret
 * @param {Object} [option] same to npm package - jsonwebtoken
 * @returns {String}
 */
module.exports = (payload, secret, option = {}) =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, secret, option, (err, token) => {
      if (err) {
        // reject(err)
        // return
        switch (err.name) {
          case "TokenExpiredError":
            reject(new AppError(401, ERROR_MESSAGES.EXPIRED_TOKEN));
            break;
          default:
            reject(new AppError(401, ERROR_MESSAGES.INVALID_TOKEN));
            break;
        }
      }
      resolve(token);
    });
  });
