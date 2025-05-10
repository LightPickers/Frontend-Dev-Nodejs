const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get(
  "/featured",
  handleErrorAsync(categoryController.getFeaturedCategory)
);

module.exports = router;
