const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger")("auth");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return next(new AppError(401, ERROR_MESSAGES.USER_NOT_SIGNUP));
    }
    const token = authHeader.split(" ")[1];

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, config.get("secret.jwtSecret"), (err, decoded) => {
        if (err) {
          // reject(err)
          // return
          switch (err.name) {
            case "TokenExpiredError":
              logger.warn(ERROR_MESSAGES.EXPIRED_TOKEN);
              reject(new AppError(401, ERROR_MESSAGES.EXPIRED_TOKEN));
              break;
            default:
              logger.warn(ERROR_MESSAGES.INVALID_TOKEN);
              reject(new AppError(401, ERROR_MESSAGES.INVALID_TOKEN));
              break;
          }
        } else {
          resolve(decoded);
        }
      });
    });

    let currentUser = await dataSource.getRepository("Users").findOne({
      select: ["id", "name", "is_banned"],
      where: { id: decoded.id },
    });

    if (!currentUser) {
      logger.warn(ERROR_MESSAGES.USER_NOT_FOUND);
      return next(new AppError(401, ERROR_MESSAGES.USER_NOT_FOUND));
    }
    if (currentUser.is_banned) {
      logger.warn(ERROR_MESSAGES.USER_IS_BANNED);
      return next(
        new AppError(403, `${ERROR_MESSAGES.USER_IS_BANNED}, 請聯繫客服`)
      );
    }

    req.user = currentUser;

    next();
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
}

module.exports = auth;
