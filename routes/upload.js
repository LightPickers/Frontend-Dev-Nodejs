const express = require("express");
const uploadController = require("../controllers/upload");
const { isAuth } = require("../middlewares/auth");
const upload = require("../middlewares/uploadImages");
const handleErrorAsync = require("../utils/handleErrorAsync");

const router = express.Router();

router.post(
  "/",
  isAuth,
  upload,
  handleErrorAsync(uploadController.postUploadImage)
);

module.exports = router;
