const express = require("express");
const router = express.Router();
const conditionsController = require("../controllers/conditions");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/", handleErrorAsync(conditionsController.getCondition));

module.exports = router;
