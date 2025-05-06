const { IsNull, In } = require("typeorm");
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const redis = require("../utils/redis");
const logger = require("../utils/logger")("Cart");
const {
  isUndefined,
  isValidString,
  isValidEmail,
  isValidPhone,
} = require("../utils/validUtils");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

async function postOrder(req, res, next) {}

module.exports = {
  postOrder,
};
