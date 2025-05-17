const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/", handleErrorAsync(productsController.getProducts));
router.get(
  "/featured",
  handleErrorAsync(productsController.getFeaturedProducts)
);
router.get("/latest", handleErrorAsync(productsController.getLatestProducts));
router.get(
  "/:product_id",
  handleErrorAsync(productsController.getSpecificProducts)
);

module.exports = router;
