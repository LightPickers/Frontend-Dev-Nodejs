const { dataSource } = require("../db/data-source");

const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const { isValidId, isValidInteger } = require("../utils/validUtils");

async function getProducts(req, res, next) {
  const {
    category_id,
    brand_id,
    condition_id,
    keyword,
    price_range,
    page = 1,
    page_size = 10,
  } = req.query;

  const errors = {};

  const pageInt = parseInt(page, 10) || 1;
  const pageSizeInt = parseInt(page_size, 10) || 10;
  const offset = (pageInt - 1) * pageSizeInt;

  if (!isValidInteger(pageInt) || !isValidInteger(pageSizeInt)) {
    return next(new AppError(400, "page 和 pageSize 需為正整數"));
  }
  if (offset < 0) {
    return next(new AppError(400, "offset 不能小於 0"));
  }

  const query = dataSource
    .getRepository("Products")
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.Brands", "brand")
    .leftJoinAndSelect("product.Conditions", "condition")
    .where("1=1");

  if (category_id) {
    if (!isValidId(category_id)) {
      logger.warn(`category_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
      errors.category_id = ERROR_MESSAGES.ID_NOT_RULE;
    } else {
      const categoryRepo = dataSource.getRepository("Categories");
      const existId = await categoryRepo.findOneBy({ id: category_id });

      if (!existId) {
        logger.warn(`category_id錯誤: ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
        errors.category_id = ERROR_MESSAGES.ID_NOT_FOUND;
      } else {
        query.andWhere("product.category_id = :category_id", { category_id });
      }
    }
  }

  if (brand_id) {
    if (!isValidId(brand_id)) {
      logger.warn(`brand_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
      errors.brand_id = ERROR_MESSAGES.ID_NOT_RULE;
    } else {
      const brandRepo = dataSource.getRepository("Brands");
      const existId = await brandRepo.findOneBy({ id: brand_id });

      if (!existId) {
        logger.warn(`brand_id錯誤: ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
        errors.brand_id = ERROR_MESSAGES.ID_NOT_FOUND;
      } else {
        query.andWhere("product.brand_id = :brand_id", { brand_id });
      }
    }
  }

  if (condition_id) {
    if (!isValidId(condition_id)) {
      logger.warn(`condition_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
      errors.condition_id = ERROR_MESSAGES.ID_NOT_RULE;
    } else {
      const conditionRepo = dataSource.getRepository("Conditions");
      const existId = await conditionRepo.findOneBy({ id: condition_id });

      if (!existId) {
        logger.warn(`condition_id錯誤: ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
        errors.condition_id = ERROR_MESSAGES.ID_NOT_FOUND;
      } else {
        query.andWhere("product.condition_id = :condition_id", {
          condition_id,
        });
      }
    }
  }

  if (keyword) {
    query.andWhere("product.name ILIKE :keyword", { keyword: `%${keyword}%` });
  }

  if (price_range) {
    try {
      const price_parsed = JSON.parse(price_range);
      if (
        !Array.isArray(price_parsed) ||
        price_parsed.length !== 2 ||
        price_parsed.some(
          (price) => typeof price !== "number" && typeof price !== "string"
        )
      ) {
        errors.price_range = ERROR_MESSAGES.PRICE_RANGE_NOT_RULE;
      } else {
        const min_price = parseInt(price_parsed[0], 10);
        const max_price = parseInt(price_parsed[1], 10);

        if (!isValidInteger(min_price) || !isValidInteger(max_price)) {
          errors.price_range = ERROR_MESSAGES.PRICE_NOT_RULE;
        } else if (min_price > max_price) {
          errors.price_range = ERROR_MESSAGES.PRICE_NOT_RULE;
        } else {
          // 根據價格區間來篩選資料
          query.andWhere("product.selling_price BETWEEN :min AND :max", {
            min: min_price,
            max: max_price,
          });
        }
      }
    } catch (err) {
      errors.price_range = ERROR_MESSAGES.PRICE_RANGE_NOT_RULE;
    }
  }

  if (Object.keys(errors).length > 0) {
    logger.warn("欄位驗證失敗", { errors });
    return res.status(400).json({
      status: "false",
      message: errors,
    });
  }

  const [products, total] = await query
    .select([
      "product.id",
      "product.name",
      "brand.name",
      "product.original_price",
      "product.selling_price",
      "condition.name",
      "product.primary_image",
      "product.created_at",
    ])
    .orderBy("product.created_at", "DESC")
    .skip(offset)
    .take(pageSizeInt)
    .getManyAndCount();

  const total_pages = Math.ceil(total / pageSizeInt);

  res.json({
    status: true,
    message: products.length === 0 ? "找不到搜尋商品" : undefined,
    total_pages,
    data: products,
  });
}

async function getFeaturedProducts(req, res, next) {
  const featuredProducts = await dataSource.getRepository("Products").find({
    select: {
      id: true,
      name: true,
      original_price: true,
      selling_price: true,
      Brands: { name: true },
      Conditions: { name: true },
      primary_image: true,
    },
    relations: {
      Brands: true,
      Conditions: true,
    },
    where: { is_featured: true },
  });

  const result = featuredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    original_price: product.original_price,
    selling_price: product.selling_price,
    brand: product.Brands.name,
    condition: product.Conditions.name,
    primary_image: product.primary_image,
  }));

  res.status(200).json({
    status: true,
    message: result.length === 0 ? "找不到精選商品" : undefined,
    data: result,
  });
}

module.exports = {
  getProducts,
  getFeaturedProducts,
};
