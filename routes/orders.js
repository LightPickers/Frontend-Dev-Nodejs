const express = require("express");
const router = express.Router();
const { dataSource } = require("../db/data-source");
const OrderService = require("../services/orders/orderService.js");
const OrderController = require("../controllers/orders.js");
const { auth } = require("../middlewares/auth");
const { redis } = require("../utils/redis/redis");

const orderService = new OrderService(dataSource, redis);
const orderController = new OrderController(orderService);

router.post("/", auth, orderController.postOrder);
//router.get("/", auth, orderController.getOrders);
//router.get("/all", auth, orderController.getAllOrders);
//router.get("/paid/:order_id", auth, orderController.getPaidOrder);
router.post("/pending/:order_id", auth, orderController.postPendingOrder);

module.exports = router;
