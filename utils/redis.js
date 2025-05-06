const { createClient } = require("redis");
const redis = createClient(); // 預設會連到 localhost:6379

redis.on("error", (err) => console.error("Redis Client Error", err));

redis.connect(); // 回傳 Promise，你也可以在 app 啟動時 await redis.connect()

module.exports = redis;
