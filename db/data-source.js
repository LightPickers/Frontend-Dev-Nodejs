const { DataSource } = require("typeorm");
const config = require("../config/index");

const Users = require("../entities/Users");
const Roles = require("../entities/Roles");
const Products = require("../entities/Products");
const Categories = require("../entities/Categories");
const Brands = require("../entities/Brands");
const Conditions = require("../entities/Conditions");
const Orders = require("../entities/Orders");
const Order_items = require("../entities/Order_items");
const Payments = require("../entities/Payments");
const Coupons = require("../entities/Coupons");
const Favorites = require("../entities/Favorites");

const dataSource = new DataSource({
  type: "postgres",
  host: config.get("db.host"),
  port: config.get("db.port"),
  username: config.get("db.username"),
  password: config.get("db.password"),
  database: config.get("db.database"),
  synchronize: config.get("db.synchronize"),
  poolSize: 10,
  entities: [
    Users,
    Roles,
    Products,
    Categories,
    Brands,
    Conditions,
    Orders,
    Order_items,
    Payments,
    Coupons,
    ,
    Favorites,
  ],
  ssl: config.get("db.ssl"),
});

module.exports = { dataSource };
