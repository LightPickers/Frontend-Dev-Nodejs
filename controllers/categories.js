const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const {
  isUndefined,
  isValidString,
  checkIfProductSaved,
} = require("../utils/validUtils");

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

module.exports = {
  getCategory,
};
