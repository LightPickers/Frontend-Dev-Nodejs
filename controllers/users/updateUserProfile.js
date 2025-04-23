const { dataSource } = require("../../db/data-source");
const appError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");
const { ZIPCODE_PATTERN } = require("../../utils/validatePatterns");
const {
  isUndefined,
  isValidString,
  isValidName,
  isValidPhone,
} = require("../../utils/validUtils");

async function updateUserProfile(req, res, next) {
  const { id } = req.params;
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
    isUndefined(name) ||
    !isValidString(name) ||
    isUndefined(phone) ||
    !isValidString(phone)
  ) {
    return next(appError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  if (!isValidName(name)) {
    return next(appError(400, ERROR_MESSAGES.NAME_NOT_RULE));
  }

  if (!isValidPhone(phone)) {
    return next(appError(400, ERROR_MESSAGES.PHONE_NOT_RULE));
  }

  if (!address_zipcode || !address_zipcode.match(ZIPCODE_PATTERN)) {
    return next(appError(400, ERROR_MESSAGES.ZIPCODE_NOT_RULE));
  }
  if (!address_district || !address_detail) {
    return next(appError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const userRepo = dataSource.getRepository("Users");
  const findUser = await userRepo.findOne({
    where: { id },
  });

  if (!findUser) {
    return next(appError(400, ERROR_MESSAGES.USER_NOT_FOUND));
  }

  const updateUser = await userRepo.update(
    {
      id,
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
    return next(appError(400, ERROR_MESSAGES.UPDATE_USER_FAILED));
  }

  const result = await userRepo.findOne({
    where: { id },
  });
  res.status(200).json({
    status: "success",
    data: result,
  });
}

module.exports = updateUserProfile;
