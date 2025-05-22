const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateJWT = require("../utils/generateJWT");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

const validateSignup = require("../utils/validateSignup");
const { ZIPCODE_PATTERN } = require("../utils/validatePatterns");
const {
  isUndefined,
  isValidString,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidUrl,
  isValidPhone,
  isValidBirthDate,
} = require("../utils/validUtils");

async function signup(req, res, next) {
  try {
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
      return res.status(400).json({
        status: "false",
        message: validation.errors,
      });
    }

    const userData = {
      ...req.body,
      photo: req.body.photo || null,
      is_banned: false,
      role_id: "84f0e762-ff1c-4197-b525-c8ec22de8dd5",
    };

    const userRepository = dataSource.getRepository("Users");
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      logger.warn(ERROR_MESSAGES.EMAIL_ALREADY_USED);
      return res.status(409).json({
        status: "false",
        message: ERROR_MESSAGES.EMAIL_ALREADY_USED,
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await userRepository.save(newUser);

    const token = await generateJWT(
      {
        id: savedUser.id,
        role: savedUser.role_id,
      },
      config.get("secret.jwtSecret"),
      {
        expiresIn: `${config.get("secret.jwtExpiresDay")}`,
      }
    );

    logger.info(
      `新建立的使用者 - ID: ${savedUser.id}, Email: ${savedUser.email}`
    );

    res.status(201).json({
      status: "true",
      message: "註冊成功",
      data: {
        token,
        name: savedUser.name,
      },
    });
  } catch (error) {
    logger.error("伺服器錯誤", { error });
    res.status(500).json({
      status: false,
      message: "發生伺服器錯誤",
    });
  }
}
async function login(req, res, next) {
  const { email, password } = req.body;

  if (isUndefined(email) || !isValidString(email) || !isValidEmail(email)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  if (isUndefined(password) || !isValidString(password)) {
    logger.warn(ERROR_MESSAGES.PASSWORD_FALSE);
    return next(new AppError(401, ERROR_MESSAGES.PASSWORD_FALSE));
  }
  if (!isValidPassword(password)) {
    logger.warn(ERROR_MESSAGES.PASSWORD_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.PASSWORD_NOT_RULE));
  }

  const userRepository = dataSource.getRepository("Users");
  const existingUser = await userRepository.findOne({
    select: {
      id: true,
      name: true,
      password: true,
      role_id: true,
      photo: true,
    },
    where: { email },
  });

  if (!existingUser) {
    logger.warn(ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE);
    return next(
      new AppError(401, ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE)
    );
  }

  logger.info(
    `使用者資料: ID: ${existingUser.id}, name: ${existingUser.name}, Role_id: ${existingUser.role_id}`
  );
  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    logger.warn(ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE);
    return next(
      new AppError(401, ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE)
    );
  }

  const token = await generateJWT(
    {
      id: existingUser.id,
      role: existingUser.role_id,
    },
    config.get("secret.jwtSecret"),
    {
      expiresIn: `${config.get("secret.jwtExpiresDay")}`,
    }
  );

  res.status(201).json({
    status: "true",
    message: "登入成功",
    data: {
      token,
      user: {
        name: existingUser.name,
        photo: existingUser.photo,
      },
    },
  });
}
async function getUserProfile(req, res, next) {
  const { id: userId } = req.user;
  const user = await dataSource.getRepository("Users").findOne({
    select: [
      "name",
      "email",
      "phone",
      "gender",
      "birth_date",
      "address_zipcode",
      "address_city",
      "address_district",
      "address_detail",
      "photo",
    ],
    where: { id: userId },
  });

  res.status(200).json({
    status: true,
    data: {
      user,
    },
  });
}
async function updateUserProfile(req, res, next) {
  const { id: userId } = req.user;
  const {
    name,
    photo,
    gender,
    birth_date,
    phone,
    address_zipcode,
    address_district,
    address_detail,
  } = req.body;

  const errors = {};

  if (isUndefined(userId) || !isValidString(userId)) {
    errors.userId = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (isUndefined(name) || !isValidString(name)) {
    errors.name = ERROR_MESSAGES.FIELDS_INCORRECT;
  } else if (!isValidName(name)) {
    errors.name = ERROR_MESSAGES.NAME_NOT_RULE;
  }

  if (isUndefined(gender) || !isValidString(gender)) {
    errors.gender = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (isUndefined(phone) || !isValidString(phone)) {
    errors.phone = ERROR_MESSAGES.FIELDS_INCORRECT;
  } else if (!isValidPhone(phone)) {
    errors.phone = ERROR_MESSAGES.PHONE_NOT_RULE;
  }

  if (!address_zipcode) {
    errors.address_zipcode = ERROR_MESSAGES.FIELDS_INCORRECT;
  } else if (!address_zipcode.match(ZIPCODE_PATTERN)) {
    errors.address_zipcode = ERROR_MESSAGES.ZIPCODE_NOT_RULE;
  }

  if (isUndefined(address_district) || !isValidString(address_district)) {
    errors.address_district = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (isUndefined(address_detail) || !isValidString(address_detail)) {
    errors.address_detail = ERROR_MESSAGES.FIELDS_INCORRECT;
  }

  if (isUndefined(birth_date) || !isValidString(birth_date)) {
    errors.birth_date = ERROR_MESSAGES.FIELDS_INCORRECT;
  } else if (!isValidBirthDate(birth_date)) {
    errors.birth_date = ERROR_MESSAGES.BIRTH_DATE_NOT_RULE;
  }

  if (Object.keys(errors).length > 0) {
    logger.warn("欄位驗證失敗", { errors });
    return res.status(400).json({
      status: "false",
      message: errors,
    });
  }

  const userRepo = dataSource.getRepository("Users");
  const existingUser = await userRepo.findOne({
    select: [
      "name",
      "photo",
      "gender",
      "birth_date",
      "phone",
      "address_zipcode",
      "address_district",
      "address_detail",
    ],
    where: { id: userId },
  });

  if (!existingUser) {
    logger.warn(ERROR_MESSAGES.USER_NOT_FOUND);
    return next(new AppError(400, ERROR_MESSAGES.USER_NOT_FOUND));
  }

  const dataToUpdate = {
    name,
    photo,
    gender,
    birth_date,
    phone,
    address_zipcode,
    address_district,
    address_detail,
  };

  const isUpdated = Object.entries(dataToUpdate).some(([key, value]) => {
    return existingUser[key] !== value;
  });

  if (!isUpdated) {
    logger.info("資料未變更，略過更新");
    return res.status(200).json({
      status: true,
      message: "資料未變更",
      data: existingUser,
    });
  }

  const findUser = await userRepo.findOne({
    where: { id: userId },
  });

  if (!findUser) {
    logger.warn(ERROR_MESSAGES.USER_NOT_FOUND);
    return next(new AppError(400, ERROR_MESSAGES.USER_NOT_FOUND));
  }

  const updateUser = await userRepo.update(
    {
      id: userId,
    },
    {
      name,
      photo,
      gender,
      birth_date,
      phone,
      address_zipcode,
      address_district,
      address_detail,
    }
  );

  if (updateUser.affected === 0) {
    logger.warn(ERROR_MESSAGES.UPDATE_USER_FAILED);
    return next(new AppError(400, ERROR_MESSAGES.UPDATE_USER_FAILED));
  }

  const result = await userRepo.findOne({
    select: [
      "name",
      "email",
      "phone",
      "gender",
      "birth_date",
      "address_zipcode",
      "address_district",
      "address_detail",
      "photo",
    ],
    where: { id: userId },
  });
  res.status(200).json({
    status: true,
    message: "資料更新成功",
    data: result,
  });
}
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

  res.status(200).json({
    message: "驗證成功",
    status: true,
    user: currentUser,
  });
}

module.exports = {
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  verifyAuth,
};
