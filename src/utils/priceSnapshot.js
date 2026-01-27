const redis = require("../config/redis");

exports.saveSnapshot = async (id, data) => {
  await redis.set(`price_snapshot:${id}`, JSON.stringify(data), "EX", 300);
};

exports.getSnapshot = async (id) => {
  const data = await redis.get(`price_snapshot:${id}`);
  return data ? JSON.parse(data) : null;
};
