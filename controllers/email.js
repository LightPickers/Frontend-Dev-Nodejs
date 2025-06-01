const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const logger = require("../utils/logger")("emailController");
const generateJWT = require("../utils/generateJWT");
const { validateFields } = require("../utils/validateFields");
const { EMAIL_RULE } = require("../utils/validateRules");
const { isValidEmail } = require("../utils/validUtils");
const { registerSuccess, resetPassword } = require("../utils/sendEmail");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postRegisterSuccess(req, res, next) {
  // 從資料庫撈取用戶 email
  const { id: userId } = req.user;
  const user = await dataSource.getRepository("Users").findOne({
    select: ["email"],
    where: { id: userId },
  });

  // 呼叫 註冊成功 函式
  await registerSuccess(user.email);

  res.status(200).json({
    status: true,
    message: "註冊完成信件發送成功",
  });
}

async function postResetPassword(req, res, next) {
  const { to } = req.body;

  // 驗證欄位
  const errorFields = validateFields({ to }, EMAIL_RULE);
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  // 驗證 Email 格式
  if (!isValidEmail(to)) {
    logger.warn(`建立使用者錯誤: ${ERROR_MESSAGES.EMAIL_NOT_RULE}`);
    return next(
      new AppError(400, `建立使用者錯誤: ${ERROR_MESSAGES.EMAIL_NOT_RULE}`)
    );
  }

  // 建立 token
  const token = await generateJWT(
    { email: to },
    config.get("secret.jwtSecret"),
    { expiresIn: "24h" }
  );

  // 呼叫 忘記密碼 函式
  await resetPassword(to, { token });

  res.status(200).json({
    status: true,
    message: "重設密碼信件發送成功",
  });
}

module.exports = {
  postRegisterSuccess,
  postResetPassword,
};
