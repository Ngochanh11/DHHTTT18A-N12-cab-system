const kafka = require('kafka-node');
const Review = require('../models/Review');

class KafkaService {
  constructor() {
    this.client = new kafka.KafkaClient({
      kafkaHost: process.env.KAFKA_BROKER || 'localhost:9092'
    });
    
    this.producer = new kafka.Producer(this.client);
    this.consumer = new kafka.Consumer(
      this.client,
      [
        { topic: 'ride-completed', partition: 0 },
        { topic: 'user-banned', partition: 0 }
      ],
      {
        autoCommit: true,
        groupId: process.env.KAFKA_GROUP_ID || 'review-group'
      }
    );

    this.setupProducer();
    this.setupConsumer();
  }

  setupProducer() {
    this.producer.on('ready', () => {
      console.log('✅ Kafka Producer is ready');
    });

    this.producer.on('error', (err) => {
      console.error('❌ Kafka Producer error:', err);
    });
  }

  setupConsumer() {
    this.consumer.on('message', async (message) => {
      try {
        const data = JSON.parse(message.value);
        
        switch (message.topic) {
          case 'ride-completed':
            await this.handleRideCompleted(data);
            break;
          case 'user-banned':
            await this.handleUserBanned(data);
            break;
          default:
            console.log('Unknown topic:', message.topic);
        }
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    });

    this.consumer.on('error', (err) => {
      console.error('❌ Kafka Consumer error:', err);
    });
  }

  // Xử lý khi chuyến xe hoàn thành
  async handleRideCompleted(data) {
    console.log('📝 Ride completed, enabling reviews:', data);
    
    // Có thể gửi notification để nhắc nhở đánh giá
    // Hoặc tạo record để track việc đánh giá
    
    // Publish event để notification service gửi thông báo
    this.publishEvent('review-reminder', {
      rideId: data.rideId,
      customerId: data.customerId,
      driverId: data.driverId,
      message: 'Hãy đánh giá chuyến xe của bạn!'
    });
  }

  // Xử lý khi user bị ban
  async handleUserBanned(data) {
    console.log('🚫 User banned, hiding reviews:', data);
    
    // Ẩn tất cả đánh giá của user bị ban
    await Review.updateMany(
      { reviewerId: data.userId, status: 'active' },
      { status: 'hidden' }
    );
  }

  // Publish event
  publishEvent(topic, data) {
    const payload = [{
      topic: topic,
      messages: JSON.stringify(data)
    }];

    this.producer.send(payload, (err, result) => {
      if (err) {
        console.error(`Error publishing to ${topic}:`, err);
      } else {
        console.log(`✅ Published to ${topic}:`, result);
      }
    });
  }

  // Publish khi có đánh giá mới
  publishReviewCreated(reviewData) {
    this.publishEvent('review-created', {
      reviewId: reviewData.id,
      revieweeId: reviewData.revieweeId,
      revieweeType: reviewData.revieweeType,
      rating: reviewData.rating,
      timestamp: new Date().toISOString()
    });
  }

  // Đóng kết nối
  close() {
    this.producer.close();
    this.consumer.close();
    this.client.close();
  }
}

module.exports = new KafkaService();