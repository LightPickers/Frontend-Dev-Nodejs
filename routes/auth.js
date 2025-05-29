const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleErrorAsync(authController.getGoogleCallback)
);

module.exports = router;
