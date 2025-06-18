const dotenv = require("dotenv");

// 修改 dotenv 設定，使其在找不到 .env 檔案時不會失敗
try {
  dotenv.config();
  console.log("已成功載入 .env 檔案");
} catch (error) {
  console.warn("無法載入 .env 檔案，將使用環境變數:", error.message);
}

const db = require("./db");
const web = require("./web");
const secret = require("./secret");
const redisSecret = require("./redisSecret");
const neWebPaySecret = require("./neWebPaySecret");
const google = require("./google");
const openai = require("./openai");

const config = {
  db,
  web,
  secret,
  redisSecret,
  neWebPaySecret,
  google,
  openai,
};

class ConfigManager {
  /**
   * Retrieves a configuration value based on the provided dot-separated path.
   * Throws an error if the specified configuration path is not found.
   *
   * @param {string} path - Dot-separated string representing the configuration path.
   * @returns {*} - The configuration value corresponding to the given path.
   * @throws Will throw an error if the configuration path is not found.
   */
  static get(path) {
    if (!path || typeof path !== "string") {
      throw new Error(`incorrect path: ${path}`);
    }

    const keys = path.split(".");
    let configValue = config;

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(configValue, key)) {
        throw new Error(`config ${path} not found`);
      }
      configValue = configValue[key];
    }

    return configValue;
  }
}

module.exports = ConfigManager;
