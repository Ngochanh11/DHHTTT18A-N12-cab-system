const { v4: uuid } = require('uuid');
const bookings = require('../data/bookings.memory');

exports.createBooking = (userId, data) => {
  const booking = {
    id: uuid(),
    userId,
    driverId: null,
    pickup: data.pickup,
    destination: data.destination,
    vehicleType: data.vehicleType,
    status: 'pending',
    estimatedFare: 60000,
    actualFare: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date()
  };

  bookings.push(booking);
  return booking;
};

exports.getUserBookings = (userId) =>
  bookings.filter(b => b.userId === userId);

exports.getBookingById = (id) =>
  bookings.find(b => b.id === id);

exports.cancelBooking = (id, userId) => {
  const booking = bookings.find(b => b.id === id && b.userId === userId);
  if (!booking) return null;
  booking.status = 'cancelled';
  return booking;
};

exports.acceptBooking = (id, driverId) => {
  const booking = bookings.find(b => b.id === id && b.status === 'pending');
  if (!booking) return null;
  booking.status = 'assigned';
  booking.driverId = driverId;
  return booking;
};

exports.startRide = (id, driverId) => {
  const booking = bookings.find(
    b => b.id === id && b.driverId === driverId && b.status === 'assigned'
  );
  if (!booking) return null;
  booking.status = 'ongoing';
  booking.startedAt = new Date();
  return booking;
};

exports.completeRide = (id, driverId) => {
  const booking = bookings.find(
    b => b.id === id && b.driverId === driverId && b.status === 'ongoing'
  );
  if (!booking) return null;
  booking.status = 'completed';
  booking.completedAt = new Date();
  booking.actualFare = booking.estimatedFare;
  return booking;
};

exports.getDriverActiveBooking = (driverId) =>
  bookings.find(b =>
    b.driverId === driverId &&
    ['assigned', 'ongoing'].includes(b.status)
  );

exports.getReceipt = (id, userId) => {
  const booking = bookings.find(b => b.id === id && b.userId === userId);
  if (!booking || booking.status !== 'completed') return null;

  return {
    bookingId: booking.id,
    fare: booking.actualFare,
    startedAt: booking.startedAt,
    completedAt: booking.completedAt
  };
};
