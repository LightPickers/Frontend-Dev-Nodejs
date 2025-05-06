const express = require("express");
const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const auth = require("../middlewares/auth");
const ordersController = require("../controllers/orders");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post("/", auth, handleErrorAsync(ordersController.postOrder));

module.exports = router;
