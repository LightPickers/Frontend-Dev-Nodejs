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

/**
 * 驗證使用者是否為管理員的中間件
 * 必須在 isAuth 中間件之後使用
 */
const isAdmin = async (req, res, next) => {
  const admin = await dataSource.getRepository("Roles").findOne({
    select: ["id"],
    where: { name: "admin" },
  });

  const { id: user_id } = req.user;
  const user = await dataSource.getRepository("Users").findOne({
    select: ["role_id"],
    where: { id: user_id },
  });

  if (req.user && user.role_id === admin.id) {
    next();
  } else {
    logger.warn("非管理員嘗試訪問管理員權限路由");
    return next(new AppError(403, "您無權限訪問此資源"));
  }
};

module.exports = {
  auth,
  isAdmin,
};
