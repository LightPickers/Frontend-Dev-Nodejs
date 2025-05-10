const { dataSource } = require("../db/data-source");
// const logger = require("../utils/logger")("UsersController");
// const AppError = require("../utils/appError");
// const ERROR_MESSAGES = require("../utils/errorMessages");
// const {
//   isUndefined,
//   isValidString,
//   checkIfProductSaved,
// } = require("../utils/validUtils");

async function getCategory(req, res, next) {
  const CategoriesInfo = await dataSource.getRepository("Categories").find({
    select: {
      id: true,
      name: true,
    },
  });

  res.status(200).json({
    message: "成功",
    status: true,
    data: CategoriesInfo,
  });
}

async function getBrand(req, res, next) {
  const BrandsInfo = await dataSource.getRepository("Brands").find({
    select: {
      id: true,
      name: true,
    },
  });

  res.status(200).json({
    message: "成功",
    status: true,
    data: BrandsInfo,
  });
}

async function getCondition(req, res, next) {
  const ConditionsInfo = await dataSource.getRepository("Conditions").find({
    select: {
      id: true,
      name: true,
    },
  });

  res.status(200).json({
    message: "成功",
    status: true,
    data: ConditionsInfo,
  });
}

module.exports = {
  getCategory,
  getBrand,
  getCondition,
};
