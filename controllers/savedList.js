const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UsersController");
const AppError = require("../utils/appError");
const { isUUID } = require("validator");
const ERROR_MESSAGES = require("../utils/errorMessages");
const {
  isUndefined,
  isValidString,
  // checkExisted,
  // checkDeleted,
  // checkListed,
  checkProductStatus,
  checkIfProductSaved,
} = require("../utils/validUtils");

async function addToSavedList(req, res, next) {
  const user_id = req.user.id;
  const { product_id } = req.body;

  if (
    isUndefined(product_id) ||
    !isValidString(product_id) ||
    !isUUID(product_id, 4)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const productsRepo = dataSource.getRepository("Products");
  const favoritesRepo = dataSource.getRepository("Favorites");

  // 檢查商品狀態(是否存在、刪除、下架、庫存(若第3個參數為true))
  const productStatus = await checkProductStatus(
    productsRepo,
    product_id,
    false
  );
  if (!productStatus.success) {
    return next(new AppError(404, productStatus.error));
  }

  /*
  // 檢查商品是否存在
  const existProduct = await checkExisted(productsRepo, product_id);
  if (!existProduct) {
    logger.warn(ERROR_MESSAGES.DATA_NOT_FOUND);
    return next(new AppError(404, ERROR_MESSAGES.DATA_NOT_FOUND));
  }

  // 檢查商品是否刪除
  const deletedProduct = await checkDeleted(productsRepo, product_id);
  if (!deletedProduct) {
    logger.warn(ERROR_MESSAGES.PRODCUT_DELETED);
    return next(new AppError(404, ERROR_MESSAGES.PRODCUT_DELETED));
  }

  // 檢查商品是否上架
  const listedProduct = await checkListed(productsRepo, product_id);
  if (!listedProduct) {
    logger.warn(ERROR_MESSAGES.PRODUCT_DELISTED);
    return next(new AppError(404, ERROR_MESSAGES.PRODUCT_DELISTED));
  }
  */

  // 檢查商品是否已被儲存於儲存清單中
  const productSaved = await checkIfProductSaved(
    favoritesRepo,
    user_id,
    product_id
  );

  if (productSaved) {
    logger.warn(ERROR_MESSAGES.DUPLICATE_FAVORITES);
    return next(new AppError(409, ERROR_MESSAGES.DUPLICATE_FAVORITES));
  }

  const newFavorite = await favoritesRepo.create({
    Users: { id: user_id },
    Products: { id: product_id },
  });
  await favoritesRepo.save(newFavorite);

  res.status(200).json({
    status: "true",
    message: "商品成功加入收藏",
  });
}

async function removeFromSavedList(req, res, next) {
  const user_id = req.user.id;
  const { favorites_id } = req.params;

  if (
    isUndefined(favorites_id) ||
    !isValidString(favorites_id) ||
    !isUUID(favorites_id, 4)
  ) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const favoritesRepo = dataSource.getRepository("Favorites");
  const existFavorite = await favoritesRepo.findOne({
    where: {
      id: favorites_id,
      Users: { id: user_id },
    },
    relations: ["Users"],
  });

  if (!existFavorite) {
    logger.warn(ERROR_MESSAGES.FAVORITE_NOT_FOUND);
    return next(new AppError(409, ERROR_MESSAGES.FAVORITE_NOT_FOUND));
  }

  await favoritesRepo.remove(existFavorite);

  res.status(200).json({
    status: "true",
    message: "商品已成功從收藏清單中移除",
  });
}

async function getSavedList(req, res, next) {
  const user_id = req.user.id;
  const validSortFields = ["created_at", "updated_at", "price"]; // 限定排序欄位
  const validOrders = ["ASC", "DESC"]; // 排序方式限定升冪降冪兩種
  let { sortBy = "created_at", orderBy = "DESC" } = req.query;

  // const favoritesRepo = dataSource.getRepository("Favorites");
  // const cartRepo = dataSource.getRepository("Cart");

  // 檢查排序欄位是否合法
  if (!validSortFields.includes(sortBy)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    sortBy = "created_at";
  }

  // 檢查排序方式是否合法
  orderBy = orderBy.toUpperCase();
  if (!validOrders.includes(orderBy)) {
    logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT);
    orderBy = "DESC";
  }

  // 轉換 sortBy => 對應的資料表欄位
  const sortFieldMap = {
    created_at: "favorites.created_at",
    updated_at: "Products.updated_at",
    price: "Products.selling_price",
  };
  const sortField = sortFieldMap[sortBy] || "favorites.created_at";

  const favorites = await dataSource
    .getRepository("Favorites")
    .createQueryBuilder("fav")
    .leftJoin("fav.Products", "product")
    .leftJoin(
      "Cart",
      "cart",
      "cart.product_id = product.id AND cart.user_id = :user_id",
      { user_id }
    )
    .select([
      "fav.id AS id",
      "fav.created_at AS created_at",
      "product.id AS product_id",
      "product.name AS name",
      "product.selling_price AS selling_price",
      "product.original_price AS original_price",
      "product.primary_image AS primary_image",
      "product.is_available AS is_available",
      "product.is_sold AS is_sold",
      "product.is_deleted AS is_deleted",
      "product.updated_at AS updated_at",
      "cart.product_id AS in_cart_id",
    ])
    .where("fav.user_id = :user_id", { user_id })
    .orderBy(sortField, orderBy)
    .addOrderBy("fav.id", "DESC") // 保證穩定排序
    .getRawMany();

  const formatted = favorites.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    Products: {
      id: row.product_id,
      name: row.name,
      selling_price: row.selling_price,
      original_price: row.original_price,
      primary_image: row.primary_image,
      is_available: row.is_available,
      is_sold: row.is_sold,
      is_deleted: row.is_deleted,
      updated_at: row.updated_at,
    },
    is_in_cart: row.in_cart_id !== null,
  }));

  // 查詢方式：find() 搭配 relations + select + order
  /*
  const savedList = await favoritesRepo.find({
    where: { Users: { id: user_id } },
    relations: ["Products"],
    select: {
      id: true,
      created_at: true,
      Products: {
        id: true,
        name: true,
        selling_price: true,
        original_price: true,
        primary_image: true,
        is_available: true,
        is_sold: true,
        is_deleted: true,
        updated_at: true,
      },
    },
    order: { [sortBy]: orderBy },
  });

  // Fetch cart items for the user (only product IDs)
  const cartItems = await cartRepo.find({
    where: { user_id: user_id },
    select: { product_id: true },
  });

  // Convert cart product IDs into a Set for quick lookup
  const cartProductIds = new Set(cartItems.map((item) => item.product_id));

  // Modify savedList to include is_in_cart information
  const updatedSavedList = savedList.map((item) => ({
    ...item,
    is_in_cart: cartProductIds.has(item.Products.id),
  }));
  */

  /*
  const savedList = await favoritesRepo
    .createQueryBuilder("favorites")
    .leftJoinAndSelect("favorites.Products", "product")
    .leftJoinAndSelect("Cart", "cart", "cart.product_id = product.id") // Join Cart
    .select([
      "favorites.id",
      "favorites.created_at",
      "product.id",
      "product.name",
      "product.selling_price",
      "product.original_price",
      "product.primary_image",
      "product.is_available",
      "product.is_sold",
      "product.is_deleted",
      "product.updated_at",
      "cart.product_id", // Fetch product_id from Cart
    ])
    .where("favorites.Users = :user_id", { user_id })
    .orderBy(`favorites.${sortBy}`, orderBy)
    .getRawMany();
  // console.log(savedList);
  */

  const totalPrice = formatted.reduce(
    (sum, item) => sum + item.Products.selling_price,
    0
  ); //計算收藏清單中的商品價格總額

  // 只計算可以購買的商品的價格總額
  /*
  const totalPrice = savedList.reduce((sum, item) => {
  const p = item.Products;
  if (p.is_available && !p.is_deleted && !p.is_sold) {
    return sum + p.selling_price;
  }
  return sum;
  }, 0);
  */

  res.status(200).json({
    status: "true",
    message: "成功",
    totalSellingPrice: totalPrice,
    data: formatted,
  });
}

module.exports = {
  addToSavedList,
  removeFromSavedList,
  getSavedList,
};
