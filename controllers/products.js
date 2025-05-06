const { titleCase } = require("typeorm/util/StringUtils.js");
const { dataSource } = require("../db/data-source");

const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const {
  isUndefined,
  isValidString,
  checkIfProductSaved,
} = require("../utils/validUtils");
const { ServerDescription } = require("typeorm");
const Categories = require("../entities/Categories");
const Brands = require("../entities/Brands");

async function getProducts(req, res, next) {
  const { product_id } = req.params;

  //400
  if (isUndefined(product_id) || !isValidString(product_id)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const productsRepo = dataSource.getRepository("Products");
  const imagesRepo = dataSource.getRepository("Products_images");

  // 404
  const existProduct = await checkIfProductSaved(productsRepo, product_id);
  if (!existProduct) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 200
  const productsInfo = await productsRepo.findOne({
    select: {
      id: true,
      Categories: { name: true },
      Brands: { name: true },
      Conditions: { name: true },
      name: true,
      title: true,
      subtitle: true,
      hashtags: true,
      description: true,
      summary: true,
      primary_image: true,
      selling_price: true,
    },
    relations: {
      Categories: true,
      Brands: true,
      Conditions: true,
    },
    where: { id: product_id },
  });

  const imagesInfo = await imagesRepo.find({
    select: { image: true },
    where: { product_id: product_id },
  });

  const image_num = imagesInfo.length;

  res.status(200).json({
    status: "true",
    data: productsInfo,
    imageList: imagesInfo,
    imageCount: image_num,
  });
}

async function getFeaturedProducts(req, res, next) {
  const featuredProducts = await dataSource.getRepository("Products").find({
    select: {
      name: true,
      original_price: true,
      selling_price: true,
      Conditions: { name: true },
      primary_image: true,
    },
    relations: {
      Conditions: true,
    },
    where: { is_featured: true },
  });

  res.status(200).json({
    status: "true",
    data: {
      featuredProducts,
    },
  });
}

module.exports = {
  getProducts,
  getFeaturedProducts,
};
