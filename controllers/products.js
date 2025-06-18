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
  checkProductStatus,
} = require("../utils/validUtils");
// const { ServerDescription } = require("typeorm");
// const Categories = require("../entities/Categories");
// const Brands = require("../entities/Brands");
const { getValidIds } = require("../utils/validFilterCache");
const { cacheOrFetch } = require("../utils/redis/cache"); // 加入快取工具

// API 54
async function getProducts(req, res, next) {
  const {
    category_id,
    brand_ids, // 多選品牌
    condition_ids, // 多選狀態
    brand_id, // 保留向後相容（單選）
    condition_id, // 保留向後相容（單選）
    keyword,
    min_price,
    max_price,
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

  const {
    category_ids,
    brand_ids: valid_brand_ids,
    condition_ids: valid_condition_ids,
  } = await getValidIds();

  const query = dataSource
    .getRepository("Products")
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.Brands", "brand")
    .leftJoinAndSelect("product.Conditions", "condition")
    .where("1=1");

  query.andWhere(
    "product.is_deleted = :is_deleted AND product.is_available = :is_available",
    { is_deleted: false, is_available: true }
  );

  // 處理類別篩選
  if (category_id) {
    if (!isValidId(category_id)) {
      logger.warn(`category_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
      errors.category_id = ERROR_MESSAGES.ID_NOT_RULE;
    } else if (!category_ids.includes(category_id)) {
      logger.warn(`category_id錯誤: ${ERROR_MESSAGES.ID_NOT_FOUND}`);
      errors.category_id = ERROR_MESSAGES.ID_NOT_FOUND;
    } else {
      query.andWhere("product.category_id = :category_id", { category_id });
    }
  }

  // 處理品牌篩選（優先使用多選，如果沒有多選則使用單選）
  const brandIdsToFilter = brand_ids || brand_id;
  if (brandIdsToFilter) {
    if (brand_ids) {
      // 多選品牌處理
      const brandIdArray = brandIdsToFilter
        .split(",")
        .filter((id) => id.trim());

      // 驗證每個品牌 ID
      const invalidBrandIds = brandIdArray.filter(
        (id) => !isValidId(id) || !valid_brand_ids.includes(id)
      );
      if (invalidBrandIds.length > 0) {
        errors.brand_ids = `無效的品牌 ID: ${invalidBrandIds.join(", ")}`;
      } else {
        query.andWhere("product.brand_id IN (:...brandIds)", {
          brandIds: brandIdArray,
        });
      }
    } else if (brand_id) {
      // 單選品牌處理（向後相容）
      if (!isValidId(brand_id)) {
        logger.warn(`brand_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
        errors.brand_id = ERROR_MESSAGES.ID_NOT_RULE;
      } else if (!valid_brand_ids.includes(brand_id)) {
        logger.warn(`brand_id錯誤: ${ERROR_MESSAGES.ID_NOT_FOUND}`);
        errors.brand_id = ERROR_MESSAGES.ID_NOT_FOUND;
      } else {
        query.andWhere("product.brand_id = :brand_id", { brand_id });
      }
    }
  }

  // 處理狀態篩選（優先使用多選，如果沒有多選則使用單選）
  const conditionIdsToFilter = condition_ids || condition_id;
  if (conditionIdsToFilter) {
    if (condition_ids) {
      // 多選狀態處理
      const conditionIdArray = conditionIdsToFilter
        .split(",")
        .filter((id) => id.trim());

      // 驗證每個狀態 ID
      const invalidConditionIds = conditionIdArray.filter(
        (id) => !isValidId(id) || !valid_condition_ids.includes(id)
      );
      if (invalidConditionIds.length > 0) {
        errors.condition_ids = `無效的狀態 ID: ${invalidConditionIds.join(
          ", "
        )}`;
      } else {
        query.andWhere("product.condition_id IN (:...conditionIds)", {
          conditionIds: conditionIdArray,
        });
      }
    } else if (condition_id) {
      // 單選狀態處理（向後相容）
      if (!isValidId(condition_id)) {
        logger.warn(`condition_id錯誤: ${ERROR_MESSAGES.ID_NOT_RULE}`);
        errors.condition_id = ERROR_MESSAGES.ID_NOT_RULE;
      } else if (!valid_condition_ids.includes(condition_id)) {
        logger.warn(`condition_id錯誤: ${ERROR_MESSAGES.ID_NOT_FOUND}`);
        errors.condition_id = ERROR_MESSAGES.ID_NOT_FOUND;
      } else {
        query.andWhere("product.condition_id = :condition_id", {
          condition_id,
        });
      }
    }
  }

  // 處理關鍵字搜尋
  if (keyword) {
    query.andWhere("product.name ILIKE :keyword", { keyword: `%${keyword}%` });
  }

  // 處理價格篩選（優先使用分離參數）
  if (min_price || max_price) {
    if (min_price) {
      const minPriceInt = parseInt(min_price, 10);
      if (!isValidInteger(minPriceInt) || minPriceInt < 0) {
        errors.min_price = ERROR_MESSAGES.PRICE_NOT_RULE;
      } else {
        query.andWhere("product.selling_price >= :minPrice", {
          minPrice: minPriceInt,
        });
      }
    }

    if (max_price) {
      const maxPriceInt = parseInt(max_price, 10);
      if (!isValidInteger(maxPriceInt) || maxPriceInt < 0) {
        errors.max_price = ERROR_MESSAGES.PRICE_NOT_RULE;
      } else {
        query.andWhere("product.selling_price <= :maxPrice", {
          maxPrice: maxPriceInt,
        });
      }
    }

    // 驗證價格範圍邏輯
    if (min_price && max_price) {
      const minPriceInt = parseInt(min_price, 10);
      const maxPriceInt = parseInt(max_price, 10);
      if (minPriceInt > maxPriceInt) {
        errors.price_range = "最低價格不能大於最高價格";
      }
    }
  } else if (price_range) {
    // 保留原有的 price_range 邏輯（向後相容）
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
        const min_price_val = parseInt(price_parsed[0], 10);
        const max_price_val = parseInt(price_parsed[1], 10);

        if (!isValidInteger(min_price_val) || !isValidInteger(max_price_val)) {
          errors.price_range = ERROR_MESSAGES.PRICE_NOT_RULE;
        } else if (min_price_val > max_price_val) {
          errors.price_range = ERROR_MESSAGES.PRICE_NOT_RULE;
        } else {
          query.andWhere("product.selling_price BETWEEN :min AND :max", {
            min: min_price_val,
            max: max_price_val,
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
    .addOrderBy("product.id", "DESC")
    .skip(offset)
    .take(pageSizeInt)
    .getManyAndCount();

  const total_pages = Math.ceil(total / pageSizeInt);
  console.log("Total products found:", total);

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
  try {
    const data = await cacheOrFetch(
      "homepage:featured_products", // Redis key
      async () => {
        const featuredProducts = await dataSource
          .getRepository("Products")
          .find({
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
            where: {
              is_featured: true,
              is_sold: false,
              is_deleted: false,
              is_available: true,
            },
          });

        const featuredProductsResult = featuredProducts.map((product) => ({
          id: product.id,
          name: product.name,
          original_price: product.original_price,
          selling_price: product.selling_price,
          brand: product.Brands.name,
          condition: product.Conditions.name,
          primary_image: product.primary_image,
        }));

        return featuredProductsResult;
      },
      3600 // 快取 1 小時
    );

    res.status(200).json({
      status: true,
      // ...(cacheHit ? { cache: true } : {}),
      message: data.length === 0 ? "找不到精選商品" : undefined,
      data: data,
    });
  } catch (err) {
    // console.error("詳細錯誤：", err);
    logger.error("取得精選商品時發生錯誤", err);
    next(new AppError(500, "取得精選商品時發生錯誤"));
  }
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

  const cacheKey = `homepage:latest_products:limit_${limit}`;
  try {
    const data = await cacheOrFetch(
      cacheKey,
      async () => {
        const latestProducts = await dataSource.getRepository("Products").find({
          where: {
            is_sold: false,
            is_deleted: false,
            is_available: true,
          },
          relations: {
            Conditions: true,
          },
          order: {
            created_at: "DESC",
          },
          take: limit,
        });

        return latestProducts.map((product) => ({
          id: product.id,
          name: product.name,
          condition: product.Conditions?.name || null,
          original_price: product.original_price,
          selling_price: product.selling_price,
          primary_image: product.primary_image,
        }));
      },
      3600 // 快取 1 小時
    );

    res.status(200).json({
      status: "true",
      // ...(cacheHit ? { cache: true } : {}),
      data: data,
    });
  } catch (err) {
    logger.error("取得最新商品失敗", err);
    next(new AppError(500, "取得最新商品失敗"));
  }
  /*
  const latestProducts = await dataSource.getRepository("Products").find({
    where: { is_sold: false, is_deleted: false, is_available: true },
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
  */
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
  const productStatus = await checkProductStatus(
    productsRepo,
    product_id,
    false
  );
  if (!productStatus.success) {
    return next(new AppError(404, productStatus.error));
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
      is_available: true,
      is_sold: true,
      is_deleted: true,
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
