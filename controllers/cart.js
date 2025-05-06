const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Cart");
const { isUndefined, isValidString } = require("../utils/validUtils");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function getCart(req, res, next) {
  const { id: userId } = req.user;
  const cart = await dataSource
    .getRepository("Cart")
    .createQueryBuilder("cart")
    .leftJoinAndSelect("cart.Products", "Products")
    .where("cart.user_id = :userId", { userId })
    .select([
      "cart.id",
      "cart.price_at_time",
      "cart.quantity",
      "Products.name",
      "Products.primary_image",
      "Products.is_available",
    ])
    .getMany();

  const items = cart.map(({ Products, price_at_time, quantity }) => {
    return {
      primary_image: Products?.primary_image || "",
      name: Products?.name || "商品已下架",
      price_at_time: price_at_time,
      quantity: quantity,
      total_price: price_at_time * quantity,
      is_available: Products?.is_available,
    };
  });

  const amount = items
    .filter((item) => item.is_available)
    .reduce((sum, item) => sum + item.total_price, 0);

  res.status(200).json({
    status: true,
    data: {
      items: items.map(({ is_available, ...rest }) => rest),
      amount,
    },
  });
}

module.exports = { getCart };
