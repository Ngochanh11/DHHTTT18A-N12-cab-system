const { createClient } = require("redis");
const { Kafka } = require("kafkajs");

// --- Redis Client (Geo & Cache) ---
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
redisClient.connect().then(() => console.log("✅ Redis Connected"));

// --- Kafka Producer (Event Driven) ---
const kafka = new Kafka({
  clientId: "ride-service",
  brokers: [process.env.KAFKA_BROKER],
});
const producer = kafka.producer();
producer.connect().then(() => console.log("✅ Kafka Producer Connected"));

module.exports = { redisClient, producer };
