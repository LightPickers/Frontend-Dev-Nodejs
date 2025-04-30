const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users");
const auth = require("../middlewares/auth");
const handleErrorAsync = require("../utils/handleErrorAsync");

router.post("/signup", handleErrorAsync(usersController.signup));
router.post("/login", handleErrorAsync(usersController.login));
router.get("/profile", auth, handleErrorAsync(usersController.getUserProfile));
router.put(
  "/profile",
  auth,
  handleErrorAsync(usersController.updateUserProfile)
);

// middleware
router.post("/auth/verify", handleErrorAsync(usersController.verifyAuth));

module.exports = router;
