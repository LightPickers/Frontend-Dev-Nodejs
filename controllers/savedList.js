const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateJWT = require("../utils/generateJWT");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/AppError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const {
  isUndefined,
  isValidString,
  checkIfProductExists,
  // isValidEmail,
  // isValidPassword,
  // isValidName,
  // isValidUrl,
  // isValidPhone,
  // isValidBirthDate,
} = require("../utils/validUtils");

async function addToSavedList(req, res, next) {
  const userId = req.user.id;
  const { productId } = req.body;

  if (isUndefined(productId) || !isValidString(productId)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const favoritesRepo = dataSource.getRepository("Favorites");
  const existProduct = await checkIfProductExists(
    favoritesRepo,
    userId,
    productId
  );

  if (existProduct) {
    logger.warn(ERROR_MESSAGES.DUPLICATE_FAVORITES);
    return next(new AppError(409, ERROR_MESSAGES.DUPLICATE_FAVORITES));
  }

  const newFavorite = await favoritesRepo.create({
    Users: { id: userId },
    Products: { id: productId },
  });
  await favoritesRepo.save(newFavorite);

  res.status(200).json({
    status: "true",
    message: "商品成功加入收藏",
  });
}

async function removeFromSavedList(req, res, next) {
  const userId = req.user.id;
  const { productId } = req.body;

  if (isUndefined(productId) || !isValidString(productId)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const favoritesRepo = dataSource.getRepository("Favorites");
  const existProduct = await checkIfProductExists(
    favoritesRepo,
    userId,
    productId
  );

  if (!existProduct) {
    logger.warn(ERROR_MESSAGES.FAVORITE_NOT_FOUND);
    return next(new AppError(409, ERROR_MESSAGES.FAVORITE_NOT_FOUND));
  }

  await favoritesRepo.remove(existProduct);

  res.status(200).json({
    status: "true",
    message: "商品已成功從收藏清單中移除",
  });
}

async function getSavedList(req, res, next) {}

module.exports = {
  addToSavedList,
  removeFromSavedList,
  getSavedList,
};
