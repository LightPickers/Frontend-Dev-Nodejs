const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CcategoryController");
const AppError = require("../utils/appError");
// const ERROR_MESSAGES = require("../utils/errorMessages");
// const {
//   isUndefined,
//   isValidString,
//   checkIfProductSaved,
// } = require("../utils/validUtils");
const { cacheOrFetch } = require("../utils/redis/cache"); // 加入快取工具

/*
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
*/

async function getFeaturedCategory(req, res, next) {
  try {
    const FeaturedCategoriesInfo = await cacheOrFetch(
      "homepage:featuredCategories", // Redis key
      async () => {
        return await dataSource.getRepository("Categories").find({
          select: {
            id: true,
            name: true,
            image: true,
          },
          where: { is_featured: true },
        });
      },
      3600 // 快取 1 小時
    );

    res.status(200).json({
      message: "成功",
      status: true,
      // ...(cacheHit ? { cache: true } : {}),
      data: FeaturedCategoriesInfo,
    });
  } catch (err) {
    logger.error("取得精選分類失敗", err);
    next(new AppError(500, "取得精選分類失敗"));
  }
}

module.exports = {
  getFeaturedCategory,
};
