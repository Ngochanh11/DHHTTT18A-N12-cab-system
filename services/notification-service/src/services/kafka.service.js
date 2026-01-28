const { Kafka } = require('kafkajs');
const config = require('../config');
const notificationService = require('./notification.service');

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers.split(',')
    });
    this.consumer = null;
    this.producer = null;
    this.isRunning = false;
  }

  /**
   * Initialize Kafka consumer
   */
  async initConsumer() {
    try {
      this.consumer = this.kafka.consumer({
        groupId: config.kafka.groupId
      });

      await this.consumer.connect();
      console.log('✅ Kafka consumer connected');

      // Subscribe to notification topics
      await this.consumer.subscribe({
        topics: [
          config.kafka.topics.notifications,
          config.kafka.topics.rideUpdates,
          config.kafka.topics.payments
        ],
        fromBeginning: false
      });

      console.log('✅ Subscribed to Kafka topics:', Object.values(config.kafka.topics));

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleMessage(topic, message);
        }
      });

      this.isRunning = true;
      console.log('✅ Kafka consumer started');

    } catch (error) {
      console.error('❌ Failed to initialize Kafka consumer:', error);
      // Don't throw - service can run without Kafka
    }
  }

  /**
   * Initialize Kafka producer
   */
  async initProducer() {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      console.log('✅ Kafka producer connected');
    } catch (error) {
      console.error('❌ Failed to initialize Kafka producer:', error);
      // Don't throw - service can run without Kafka
    }
  }

  /**
   * Handle incoming Kafka message
   * @param {String} topic - Topic name
   * @param {Object} message - Kafka message
   */
  async handleMessage(topic, message) {
    try {
      const value = message.value?.toString();
      if (!value) {
        return;
      }

      const event = JSON.parse(value);
      console.log(`📨 Received message from topic ${topic}:`, event.key || event.type);

      // Route to appropriate handler based on topic
      switch (topic) {
        case config.kafka.topics.notifications:
          await this.handleNotificationEvent(event);
          break;
        case config.kafka.topics.rideUpdates:
          await this.handleRideUpdateEvent(event);
          break;
        case config.kafka.topics.payments:
          await this.handlePaymentEvent(event);
          break;
        default:
          console.warn(`Unknown topic: ${topic}`);
      }

    } catch (error) {
      console.error('❌ Error handling Kafka message:', error);
    }
  }

  /**
   * Handle general notification events
   * @param {Object} event - Event data
   */
  async handleNotificationEvent(event) {
    const { userId, type, title, body, data } = event;

    if (!userId || !type || !title || !body) {
      console.error('Invalid notification event: missing required fields');
      return;
    }

    await notificationService.create({
      userId,
      type,
      title,
      body,
      data: data || {},
      metadata: { source: 'kafka', eventType: event.type }
    });
  }

  /**
   * Handle ride update events
   * @param {Object} event - Event data
   */
  async handleRideUpdateEvent(event) {
    const { userId, rideId, status, driverName, driverPhone, vehicleInfo, eta } = event;

    const statusMessages = {
      'driver_assigned': `Tài xế ${driverName} đã được chỉ định cho chuyến đi của bạn`,
      'driver_arriving': `Tài xế ${driverName} đang đến (${eta || '5 phút'})`,
      'driver_arrived': `Tài xế ${driverName} đã đến điểm đón`,
      'trip_started': `Chuyến đi với tài xế ${driverName} đã bắt đầu`,
      'trip_completed': `Chuyến đi đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!`,
      'trip_cancelled': `Chuyến đi đã bị hủy`,
      'driver_changed': `Tài xế mới ${driverName} đã được chỉ định`
    };

    const message = statusMessages[status] || `Cập nhật trạng thái chuyến đi: ${status}`;

    await notificationService.create({
      userId,
      type: 'ride_update',
      title: status === 'trip_completed' ? 'Chuyến đi hoàn thành' : 'Cập nhật chuyến đi',
      body: message,
      data: { rideId, status, driverName, driverPhone, vehicleInfo, eta },
      metadata: { source: 'kafka', eventType: 'ride_update' }
    });
  }

  /**
   * Handle payment events
   * @param {Object} event - Event data
   */
  async handlePaymentEvent(event) {
    const { userId, bookingId, amount, method, status } = event;

    const statusMessages = {
      'payment_pending': `Thanh toán ${amount} VNĐ đang chờ xử lý`,
      'payment_success': `Thanh toán ${amount} VNĐ thành công qua ${method}`,
      'payment_failed': `Thanh toán ${amount} VNĐ thất bại. Vui lòng thử lại.`,
      'refund_initiated': `Yêu cầu hoàn tiền ${amount} VNĐ đã được gửi`,
      'refund_completed': `Tiền đã được hoàn trả ${amount} VNĐ vào tài khoản của bạn`
    };

    const message = statusMessages[status] || `Cập nhật thanh toán: ${status}`;

    await notificationService.create({
      userId,
      type: 'payment',
      title: status === 'payment_success' ? 'Thanh toán thành công' : 'Thông báo thanh toán',
      body: message,
      data: { bookingId, amount, method, status },
      metadata: { source: 'kafka', eventType: 'payment' }
    });
  }

  /**
   * Publish message to Kafka topic
   * @param {String} topic - Topic name
   * @param {Object} message - Message to publish
   * @param {String} key - Message key (optional)
   */
  async publish(topic, message, key = null) {
    if (!this.producer) {
      console.warn('Kafka producer not initialized, skipping publish');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [{
          key: key || message.userId,
          value: JSON.stringify(message)
        }]
      });
      console.log(`✅ Published message to topic ${topic}`);
    } catch (error) {
      console.error('❌ Error publishing to Kafka:', error);
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      if (this.producer) {
        await this.producer.disconnect();
      }
      console.log('✅ Kafka connections closed');
    } catch (error) {
      console.error('❌ Error disconnecting from Kafka:', error);
    }
  }
}

module.exports = new KafkaService();

