const { dataSource } = require("../../db/data-source");
const { validateSignup } = require("../../utils/validUtils");
const appError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

async function verifyAuth(req, res, next) {}

module.exports = verifyAuth;
