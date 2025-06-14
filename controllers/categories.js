const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
// const ERROR_MESSAGES = require("../utils/errorMessages");
// const {
//   isUndefined,
//   isValidString,
//   checkIfProductSaved,
// } = require("../utils/validUtils");
const { cacheOrFetch } = require("../utils/cache"); // 加入快取工具

/*
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
*/

async function getCategory(req, res, next) {
  try {
    const CategoriesInfo = await cacheOrFetch(
      "homepage:categories",
      async () => {
        return await dataSource.getRepository("Categories").find({
          select: {
            id: true,
            name: true,
          },
        });
      },
      3600
    ); // 快取 1 小時

    res.status(200).json({
      message: "成功",
      status: true,
      ...(cacheHit ? { cache: true } : {}),
      data: CategoriesInfo,
    });
  } catch (err) {
    logger.error("取得Categories清單失敗", err);
    next(new AppError(500, "取得Categories清單失敗"));
  }
}

module.exports = {
  getCategory,
};
