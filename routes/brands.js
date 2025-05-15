const express = require("express");
const router = express.Router();
const brandsController = require("../controllers/brands");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get("/", handleErrorAsync(brandsController.getBrand));

module.exports = router;
