const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const logger = require("../utils/logger")("authController");
const generateJWT = require("../utils/generateJWT");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// 註冊 Google OAuth 策略
passport.use(
  new GoogleStrategy(
    {
      clientID: `${config.get("google.googleAuthClientId")}`,
      clientSecret: `${config.get("google.googleAuthClientSecret")}`,
      callbackURL: `${config.get("google.callbackURL")}`,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const userRepo = dataSource.getRepository("Users");
        const roleRepo = dataSource.getRepository("Roles");

        let user = await userRepo.findOneBy({ email: profile.emails[0].value });

        // 如果使用者不存在，則建立一個新帳號
        if (!user) {
          const role = await roleRepo.findOneBy({ name: "使用者" });
          user = userRepo.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            role_id: role.id,
            photo: profile.photos[0].value,
            is_banned: false,
          });
          user = await userRepo.save(user);
        }
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);

async function getGoogleCallback(req, res, next) {
  const { id: userId } = req.user;
  const userRepo = dataSource.getRepository("Users");
  const user = await userRepo.findOne({
    select: ["id", "role_id", "name"],
    where: { id: userId },
  });

  if (!user) {
    logger.warn(ERROR_MESSAGES.USER_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.USER_NOT_FOUND));
  }

  // 使用撈取到的 user 資料 建立 token
  const token = await generateJWT(
    {
      id: user.id,
      role: user.role_id,
    },
    config.get("secret.jwtSecret"),
    {
      expiresIn: `${config.get("secret.jwtExpiresDay")}`,
    }
  );

  const redirectURL = `https://lightpickers.github.io/Frontend-Dev-React/#/google-callback?token=${token}&name=${encodeURIComponent(
    user.name
  )}`;

  return res.redirect(redirectURL);
  res.status(201).json({
    status: true,
    data: {
      token,
      name: user.name,
    },
  });
}

module.exports = {
  getGoogleCallback,
};
