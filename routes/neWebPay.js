const express = require("express");
const router = express.Router();
const neWebPayController = require("../controllers/neWebPay");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post("/return", handleErrorAsync(neWebPayController.postReturn));
router.post("/notify", handleErrorAsync(neWebPayController.postNotify));

module.exports = router;
