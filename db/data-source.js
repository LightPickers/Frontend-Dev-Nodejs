const { DataSource } = require("typeorm");
const config = require("../config/index");

const Users = require("../entities/Users");
const Roles = require("../entities/Roles");
const Products = require("../entities/Products");
const Categories = require("../entities/Categories");
const Brands = require("../entities/Brands");
const Conditions = require("../entities/Conditions");

const dataSource = new DataSource({
  type: "postgres",
  host: config.get("db.host"),
  port: config.get("db.port"),
  username: config.get("db.username"),
  password: config.get("db.password"),
  database: config.get("db.database"),
  synchronize: config.get("db.synchronize"),
  poolSize: 10,
  entities: [Users, Roles, Products, Categories, Brands, Conditions],
  ssl: config.get("db.ssl"),
});

module.exports = { dataSource };
