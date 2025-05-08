const { dataSource } = require("../db/data-source");
const Conditions = require("../entities/Conditions");

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

async function getLatestProducts(req, res, next) {
  const sort = req.query.sort;
  const limit = parseInt(req.query.limit) || 6;

  if (sort !== "latest") {
    return res.status(400).json({
      status: "false",
      message: "請提供正確的排序方式：sort=latest",
    });
  }

  const latestProducts = await dataSource.getRepository("Products").find({
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
    order: {
      created_at: "DESC",
    },
    take: limit,
  });
  res.status(200).json({
    status: "true",
    data: {
      latestProducts,
    },
  });
}

module.exports = {
  getFeaturedProducts,
  getLatestProducts,
};
