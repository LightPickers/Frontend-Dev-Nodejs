const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviews");
const { auth, isAdmin } = require("../middlewares/auth");
const handleErrorAsync = require("../utils/handleErrorAsync");

// 67.新增商品評論
router.post(
  "/:product_id",
  auth,
  handleErrorAsync(reviewsController.postReviews)
);
// 68.取得評論列表
router.get("/", handleErrorAsync(reviewsController.getReviews));
// 69.修改商品評論
router.put("/:review_id", auth, handleErrorAsync(reviewsController.putReviews));
// 70.新增商品評論讚
router.post(
  "/like/:review_id",
  auth,
  handleErrorAsync(reviewsController.postReviewsLike)
);
// 71.取消商品評論讚
router.delete(
  "/unlike/:review_id",
  auth,
  handleErrorAsync(reviewsController.deleteReviewsLike)
);

// 管理者功能
// 72.回覆商品評論
router.post(
  "/reply/:review_id",
  auth,
  isAdmin,
  handleErrorAsync(reviewsController.replyReviews)
);
// 73.修改商品回覆評論
router.put(
  "/reply/:review_id",
  auth,
  isAdmin,
  handleErrorAsync(reviewsController.putReplyReviews)
);
// 74.刪除商品評論
router.delete(
  "/:review_id",
  auth,
  isAdmin,
  handleErrorAsync(reviewsController.deleteReviews)
);

module.exports = router;
