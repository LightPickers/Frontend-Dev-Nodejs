const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/:product_id", handleErrorAsync(productsController.getProducts));
router.get(
  "/featured",
  handleErrorAsync(productsController.getFeaturedProducts)
);
router.get("/latest", handleErrorAsync(productsController.getLatestProducts));

module.exports = router;
