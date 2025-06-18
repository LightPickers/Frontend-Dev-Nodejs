// utils/validFilterCache.js
const { dataSource } = require("../db/data-source");
const { cacheOrFetch } = require("./redis/cache");
const { redis } = require("./redis/redis");

const VALID_FILTER_KEY = "filters:valid_ids";

// 撈出目前所有可用的 ID
async function getValidIdsFromDB() {
  const [categories, brands, conditions] = await Promise.all([
    dataSource.getRepository("Categories").find({ select: { id: true } }),
    dataSource.getRepository("Brands").find({ select: { id: true } }),
    dataSource.getRepository("Conditions").find({ select: { id: true } }),
  ]);

  return {
    category_ids: categories.map((c) => c.id),
    brand_ids: brands.map((b) => b.id),
    condition_ids: conditions.map((c) => c.id),
  };
}

// 快取取得合法 ID
async function getValidIds() {
  return await cacheOrFetch(VALID_FILTER_KEY, getValidIdsFromDB, 3600);
}

// 快取失效
async function invalidateFilterCache() {
  await redis.del(VALID_FILTER_KEY);
}

module.exports = {
  getValidIds,
  invalidateFilterCache,
};
