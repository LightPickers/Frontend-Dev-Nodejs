const express = require("express");
const uploadController = require("../controllers/upload");
const { auth } = require("../middlewares/auth");
const upload = require("../middlewares/uploadImages");
const handleErrorAsync = require("../utils/handleErrorAsync");

const router = express.Router();

router.post(
  "/",
  // auth,
  upload,
  handleErrorAsync(uploadController.postUploadImage)
);
router.delete("/images", handleErrorAsync(uploadController.deleteImages));

module.exports = router;
