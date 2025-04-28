const { dataSource } = require("../../db/data-source");
const logger = require("../../utils/logger")("auth");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");
const { ZIPCODE_PATTERN } = require("../../utils/validatePatterns");
const {
  isUndefined,
  isValidString,
  isValidName,
  isValidUrl,
  isValidPhone,
  isValidBirthDate,
} = require("../../utils/validUtils");

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

  if (
    isUndefined(userId) ||
    !isValidString(userId) ||
    isUndefined(name) ||
    !isValidString(name) ||
    isUndefined(gender) ||
    !isValidString(gender) ||
    isUndefined(phone) ||
    !isValidString(phone)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  if (!isValidName(name)) {
    logger.warn(ERROR_MESSAGES.NAME_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.NAME_NOT_RULE));
  }

  if (!isValidPhone(phone)) {
    logger.warn(ERROR_MESSAGES.PHONE_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.PHONE_NOT_RULE));
  }

  if (!isValidUrl(photo)) {
    logger.warn(ERROR_MESSAGES.PROFILE_PHOTO_URL_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.PROFILE_PHOTO_URL_INCORRECT));
  }

  if (!address_zipcode || !address_zipcode.match(ZIPCODE_PATTERN)) {
    logger.warn(ERROR_MESSAGES.ZIPCODE_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.ZIPCODE_NOT_RULE));
  }
  if (!address_district || !address_detail) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  if (!birth_date || !isValidBirthDate(birth_date)) {
    logger.warn(ERROR_MESSAGES.BIRTH_DATE_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.BIRTH_DATE_NOT_RULE));
  }

  const userRepo = dataSource.getRepository("Users");
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
    status: "true",
    message: "資料更新成功",
    data: result,
  });
}

module.exports = updateUserProfile;
