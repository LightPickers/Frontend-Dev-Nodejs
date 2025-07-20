const { redis } = require("../../utils/redis/redis");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

class CheckoutSession {
  constructor(redis) {
    this.redis = redis;
  }

  async load(user_id) {
    try {
      const data = await redis.get(`checkout:${user_id}`);
      if (!data) {
        throw new AppError(400, ERROR_MESSAGES.FINISH_CHECKOUT_FIRST);
      }
      return JSON.parse(data);
    } catch (err) {
      console.error("checkout load Error:", err);
    }
  }

  async clear(user_id) {
    try {
      await this.redis.del(`checkout:${user_id}`);
    } catch (err) {
      console.error("checkout clear Error:", err);
    }
  }
}

module.exports = CheckoutSession;
