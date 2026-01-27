const { Kafka } = require('kafkajs');
const service = require('../services/notification.service');

let kafka;
let consumer;
let isConnected = false;

const initKafka = async () => {
  try {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
    
    kafka = new Kafka({
      clientId: 'notification-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    consumer = kafka.consumer({ groupId: 'notification-service-group' });

    await consumer.connect();
    isConnected = true;
    console.log('✅ Kafka consumer connected');

    // Subscribe to relevant topics
    await consumer.subscribe({
      topics: ['ride-updates', 'payment-updates', 'booking-events', 'driver-updates'],
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`📥 Received event from ${topic}:`, event.type);
          
          await handleEvent(topic, event);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      }
    });

    console.log('✅ Subscribed to topics: ride-updates, payment-updates, booking-events, driver-updates');

  } catch (error) {
    console.error('❌ Kafka connection failed:', error.message);
    // Don't exit - service can run without Kafka
  }
};

const handleEvent = async (topic, event) => {
  switch (topic) {
    case 'ride-updates':
      await handleRideUpdate(event);
      break;
    case 'payment-updates':
      await handlePaymentUpdate(event);
      break;
    case 'booking-events':
      await handleBookingEvent(event);
      break;
    case 'driver-updates':
      await handleDriverUpdate(event);
      break;
    default:
      console.log(`Unknown topic: ${topic}`);
  }
};

const handleRideUpdate = async (event) => {
  const { userId, driverId, type, data } = event;
  
  let title, body;
  
  switch (type) {
    case 'driver_assigned':
      title = 'Driver Assigned';
      body = `Driver ${data.driverName || 'your driver'} has been assigned to your ride.`;
      break;
    case 'driver_arrived':
      title = 'Driver Arrived';
      body = 'Your driver has arrived at your location.';
      break;
    case 'ride_started':
      title = 'Ride Started';
      body = 'Your ride has started. Enjoy your trip!';
      break;
    case 'ride_completed':
      title = 'Ride Completed';
      body = `Your ride has been completed. Total fare: ${data.fare || 'N/A'}`;
      break;
    case 'ride_cancelled':
      title = 'Ride Cancelled';
      body = data.reason || 'Your ride has been cancelled.';
      break;
    default:
      title = 'Ride Update';
      body = data.message || 'Your ride status has been updated.';
  }

  await service.sendNotification({
    userId: userId || driverId,
    type: 'ride_update',
    title,
    body,
    data
  });
};

const handlePaymentUpdate = async (event) => {
  const { userId, type, data } = event;
  
  let title, body;
  
  switch (type) {
    case 'payment_successful':
      title = 'Payment Successful';
      body = `Your payment of ${data.amount || 'N/A'} has been processed successfully.`;
      break;
    case 'payment_failed':
      title = 'Payment Failed';
      body = data.reason || 'Your payment failed. Please try again.';
      break;
    case 'refund_processed':
      title = 'Refund Processed';
      body = `A refund of ${data.amount || 'N/A'} has been processed to your account.`;
      break;
    case 'wallet_topup':
      title = 'Wallet Top-up Successful';
      body = `Your wallet has been credited with ${data.amount || 'N/A'}.`;
      break;
    default:
      title = 'Payment Update';
      body = data.message || 'Your payment status has been updated.';
  }

  await service.sendNotification({
    userId,
    type: 'payment',
    title,
    body,
    data
  });
};

const handleBookingEvent = async (event) => {
  const { userId, driverId, type, data } = event;
  
  let title, body;
  
  switch (type) {
    case 'booking_confirmed':
      title = 'Booking Confirmed';
      body = `Your booking has been confirmed. Booking ID: ${data.bookingId}`;
      break;
    case 'booking_cancelled':
      title = 'Booking Cancelled';
      body = data.reason || 'Your booking has been cancelled.';
      break;
    default:
      title = 'Booking Update';
      body = data.message || 'Your booking status has been updated.';
  }

  await service.sendNotification({
    userId: userId || driverId,
    type: 'system',
    title,
    body,
    data
  });
};

const handleDriverUpdate = async (event) => {
  const { driverId, type, data } = event;
  
  let title, body;
  
  switch (type) {
    case 'new_booking_request':
      title = 'New Booking Request';
      body = `New booking request from ${data.pickup || 'a passenger'}. Tap to accept.`;
      break;
    case 'booking_timeout':
      title = 'Booking Expired';
      body = 'The booking request has expired.';
      break;
    default:
      title = 'Driver Update';
      body = data.message || 'Your driver status has been updated.';
  }

  await service.sendNotification({
    userId: driverId,
    type: 'ride_update',
    title,
    body,
    data
  });
};

const shutdownKafka = async () => {
  if (consumer && isConnected) {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
};

module.exports = { initKafka, shutdownKafka };

