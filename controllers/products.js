const { dataSource } = require("../db/data-source");

const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function getProducts(req, res, next) {}

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
  getFeaturedProducts,
};
