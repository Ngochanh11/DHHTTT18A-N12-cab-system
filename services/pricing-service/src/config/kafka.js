const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

(async () => {
  try {
    await producer.connect();
    console.log("Kafka producer connected");
  } catch (err) {
    console.error("Kafka connection failed", err.message);
  }
})();

exports.publish = async (topic, payload) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
};
