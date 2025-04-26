const { dataSource } = require("../../db/data-source");
const config = require("../../config/index");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    next(new AppError(401, ERROR_MESSAGES.USER_NOT_SIGNUP));
  }
  const token = authHeader.split(" ")[1];

  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, config.get("secret.jwtSecret"), (err, decoded) => {
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
      } else {
        resolve(decoded);
      }
    });
  });

  let currentUser = await dataSource.getRepository("Users").findOne({
    select: ["id", "name"],
    where: { id: decoded.id },
  });

  if (!currentUser) {
    return next(new AppError(401, ERROR_MESSAGES.USER_NOT_FOUND));
  }
  req.user = currentUser;

  res.status(200).json({
    message: "驗證成功",
    status: true,
    user: currentUser,
  });
}

module.exports = verifyAuth;
