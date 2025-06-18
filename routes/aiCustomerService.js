const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const aiLimiter = require("../middlewares/rateLimiter");
const aiCustomerServiceController = require("../controllers/aiCustomerService");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post(
  "/",
  auth,
  aiLimiter, // 1 分鐘內請求不得超過 10 次
  handleErrorAsync(aiCustomerServiceController.postAiCustomerService)
);

module.exports = router;
