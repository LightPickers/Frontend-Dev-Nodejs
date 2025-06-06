const { isUUID } = require("validator");
const { dataSource } = require("../db/data-source");
// const { titleCase } = require("typeorm/util/StringUtils.js");
// const Conditions = require("../entities/Conditions");

const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const { isValidId, isValidInteger } = require("../utils/validUtils");
const {
  isUndefined,
  isValidString,
  checkProduct,
} = require("../utils/validUtils");
// const { ServerDescription } = require("typeorm");
// const Categories = require("../entities/Categories");
// const Brands = require("../entities/Brands");

// API 54
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

  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(page_size, 10);
  const offset = (pageInt - 1) * pageSizeInt;

  if (!isValidInteger(pageInt) || pageInt <= 0) {
    errors.page = ERROR_MESSAGES.DATA_NOT_POSITIVE;
  }

  if (!isValidInteger(pageSizeInt) || pageSizeInt <= 0) {
    errors.pageSize = ERROR_MESSAGES.DATA_NOT_POSITIVE;
  }
  if (offset < 0) {
    errors.offset = ERROR_MESSAGES.DATA_NEGATIVE;
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
      status: false,
      message: errors,
    });
  }

  const [selectedProducts, total] = await query
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

  if (pageInt > total_pages && total_pages > 0) {
    logger.warn(ERROR_MESSAGES.PAGE_OUT_OF_RANGE);
    return next(new AppError(400, ERROR_MESSAGES.PAGE_OUT_OF_RANGE));
  }

  const result = selectedProducts.map((products) => ({
    id: products.id,
    name: products.name,
    brand: products.Brands.name,
    condition: products.Conditions.name,
    original_price: products.original_price,
    selling_price: products.selling_price,
    primary_image: products.primary_image,
  }));

  res.json({
    status: true,
    message: selectedProducts.length === 0 ? "找不到搜尋商品" : undefined,
    total_pages,
    data: result,
  });
}

// API 15
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

// API 16
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
    relations: {
      Conditions: true,
    },
    order: {
      created_at: "DESC",
    },
    take: limit,
  });

  const result = latestProducts.map((product) => ({
    id: product.id,
    name: product.name,
    condition: product.Conditions?.name || null,
    original_price: product.original_price,
    selling_price: product.selling_price,
    primary_image: product.primary_image,
  }));

  res.status(200).json({
    status: "true",
    data: result,
  });
}

// API 18
async function getSpecificProducts(req, res, next) {
  const { product_id } = req.params;

  //400
  if (
    isUndefined(product_id) ||
    !isValidString(product_id) ||
    !isUUID(product_id, 4)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const productsRepo = dataSource.getRepository("Products");
  const imagesRepo = dataSource.getRepository("Product_images");

  // 404
  const existProduct = await checkProduct(productsRepo, product_id);
  if (!existProduct) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 200
  const productsInfo = await productsRepo.findOne({
    select: {
      id: true,
      Categories: { id: true, name: true },
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
      original_price: true,
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

module.exports = {
  getProducts,
  getFeaturedProducts,
  getLatestProducts,
  getSpecificProducts,
};
