const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users");
const auth = require("../middlewares/auth");
const handleErrorAsync = require("../utils/handleErrorAsync");
const savedList = require("../controllers/savedList"); // 收藏資料相關功能

router.post("/signup", handleErrorAsync(usersController.signup));
router.post("/login", handleErrorAsync(usersController.login));
router.get("/profile", auth, handleErrorAsync(usersController.getUserProfile));
router.put(
  "/profile",
  auth,
  handleErrorAsync(usersController.updateUserProfile)
);
router.put("/password", auth, handleErrorAsync(usersController.putPassword)); // 修改密碼

router.post("/favorites", auth, handleErrorAsync(savedList.addToSavedList)); // 新增收藏資料
router.get("/favorites", auth, handleErrorAsync(savedList.getSavedList)); // 取得收藏資料
router.delete(
  "/favorites/:favorites_id",
  auth,
  handleErrorAsync(savedList.removeFromSavedList)
); // 移除收藏資料

// middleware
router.post("/auth/verify", handleErrorAsync(usersController.verifyAuth));

module.exports = router;
