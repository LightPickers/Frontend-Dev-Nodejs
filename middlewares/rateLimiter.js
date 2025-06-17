const rateLimit = require("express-rate-limit");

const aiRequestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: 10, // 每分鐘最多10次請求
  message: "請求過於頻繁，請稍後再試。",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = aiRequestLimiter;
