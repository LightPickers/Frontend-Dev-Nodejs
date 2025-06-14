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

// 沒有快取的版本
/*
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
*/

async function getBrand(req, res, next) {
  try {
    const BrandsInfo = await cacheOrFetch(
      "homepage:brands",
      async () => {
        return await dataSource.getRepository("Brands").find({
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
      data: BrandsInfo,
    });
  } catch (err) {
    logger.error("取得品牌清單失敗", err);
    next(new AppError(500, "取得品牌清單失敗"));
  }
}

module.exports = {
  getBrand,
};
