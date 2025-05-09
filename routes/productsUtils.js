const express = require("express");
const router = express.Router();
const productsUtilsController = require("../controllers/productsUtils");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get(
  "/categories",
  handleErrorAsync(productsUtilsController.getCategory)
);
router.get("/brands", handleErrorAsync(productsUtilsController.getBrand));
router.get(
  "/conditions",
  handleErrorAsync(productsUtilsController.getCondition)
);

module.exports = router;
