const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const ordersController = require("../controllers/orders");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post("/", auth, handleErrorAsync(ordersController.postOrder));
router.get("/:order_id", auth, handleErrorAsync(ordersController.getOrder));
router.get("/", auth, handleErrorAsync(ordersController.getAllOrders));
router.get(
  "/paid/:order_id",
  auth,
  handleErrorAsync(ordersController.getPaidOrder)
);
router.post(
  "/pending/:order_id",
  auth,
  handleErrorAsync(ordersController.postPendingOrder)
);

module.exports = router;
