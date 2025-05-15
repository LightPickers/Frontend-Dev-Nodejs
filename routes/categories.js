const express = require("express");
const router = express.Router();
const categoriesController = require("../controllers/categories");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/", handleErrorAsync(categoriesController.getCategory));

module.exports = router;
