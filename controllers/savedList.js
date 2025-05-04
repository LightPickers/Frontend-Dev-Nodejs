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
const Favorites = require("../entities/Favorites");

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

async function getSavedList(req, res, next) {
  const userId = req.user.id;
  const validSortFields = [
    "Favorites.created_at",
    "Products.created_at",
    "price",
  ]; // 限定排序欄位
  const validOrders = ["ASC", "DESC"]; // 排序方式限定升冪降冪兩種
  let { sortBy = "Favorites.created_at", orderBy = "DESC" } = req.query;

  // 檢查排序欄位是否合法
  if (!validSortFields.includes(sortBy)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    sortBy = "Favorites.created_at";
    // return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  // 檢查排序方式是否合法
  orderBy = orderBy.toUpperCase();
  if (!validOrders.includes(order)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    orderBy = "DESC";
    // return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }
  sort_opt = sortBy.split(".");
  sort_table = sort_opt[0];
  sort_col = sort_opt[1];
  const savedList = await favoritesRepo.find({
    where: { Users: { id: userId } },
    relations: ["Products"],
    select: {
      Products: {
        id: true,
        name: true,
        selling_price: true,
        primary_image: true,
        is_available: true,
        created_at: true,
      },
      Favorites: {
        created_at: true,
      },
    },
    order: { [sort_table]: { [sort_col]: orderBy } },
  });

  const totalPrice = savedList.reduce(
    (sum, item) => sum + item.product.price,
    0
  ); //計算收藏清單中的商品價格總額

  res.status(200).json({
    status: "true",
    message: "成功",
    totalSellingPrice: totalPrice,
    data: savedList,
  });
}

module.exports = {
  addToSavedList,
  removeFromSavedList,
  getSavedList,
};
