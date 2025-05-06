const express = require("express");
const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const auth = require("../middlewares/auth");
const cartController = require("../controllers/cart");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/", auth, handleErrorAsync(cartController.getCart));

module.exports = router;
