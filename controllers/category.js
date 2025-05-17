const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
// const {
//   isUndefined,
//   isValidString,
//   checkIfProductSaved,
// } = require("../utils/validUtils");

async function getFeaturedCategory(req, res, next) {
  const FeaturedCategoriesInfo = await dataSource
    .getRepository("Categories")
    .find({
      select: {
        id: true,
        name: true,
        image: true,
      },
      where: { is_featured: true },
    });

  res.status(200).json({
    message: "成功",
    status: true,
    data: FeaturedCategoriesInfo,
  });
}

module.exports = {
  getFeaturedCategory,
};
