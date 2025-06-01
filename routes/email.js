const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email");
const auth = require("../middlewares/auth");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post(
  "/register-success",
  auth,
  handleErrorAsync(emailController.postRegisterSuccess)
);
router.post(
  "/reset-password",
  handleErrorAsync(emailController.postResetPassword)
);

module.exports = router;
