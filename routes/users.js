const express = require("express");
const router = express.Router();
// const config = require("../config/index");
// const { dataSource } = require("../db/data-source");

const handleErrorAsync = require("../utils/handleErrorAsync");
const AppError = require("../utils/appError");
const signup = require("../controllers/users/signup");
const getUserProfile = require("../controllers/users/getUserProfile");
const updateUserProfile = require("../controllers/users/updateUserProfile");
const verifyAuth = require("../controllers/users/verifyAuth");
const login = require("../controllers/users/login");

router.post("/signup", handleErrorAsync(signup));
router.get("/profile", handleErrorAsync(getUserProfile));
// router.put("/profile/:userId", handleErrorAsync(updateUserProfile));
router.put("/profile", handleErrorAsync(updateUserProfile));
router.post("/login", handleErrorAsync(login));

// middleware
router.post("/auth/verify", handleErrorAsync(verifyAuth));

router.use((req, res, next) => {
  next(new AppError(404, "Route not found"));
});

module.exports = router;
