const service = require('../services/booking.service');

exports.createBooking = (req, res) =>
  res.status(201).json(service.createBooking(req.user.id, req.body));

exports.getBookings = (req, res) =>
  res.json(service.getUserBookings(req.user.id));

exports.getBooking = (req, res) => {
  const booking = service.getBookingById(req.params.bookingId);
  if (!booking) return res.sendStatus(404);
  res.json(booking);
};

exports.cancelBooking = (req, res) => {
  const booking = service.cancelBooking(req.params.bookingId, req.user.id);
  if (!booking) return res.sendStatus(404);
  res.json(booking);
};

exports.acceptBooking = (req, res) => {
  if (req.user.role !== 'driver') return res.sendStatus(403);
  const booking = service.acceptBooking(req.params.bookingId, req.user.id);
  if (!booking) return res.sendStatus(400);
  res.json(booking);
};

exports.startRide = (req, res) => {
  const booking = service.startRide(req.params.bookingId, req.user.id);
  if (!booking) return res.sendStatus(400);
  res.json(booking);
};

exports.completeRide = (req, res) => {
  const booking = service.completeRide(req.params.bookingId, req.user.id);
  if (!booking) return res.sendStatus(400);
  res.json(booking);
};

exports.getDriverActive = (req, res) => {
  const booking = service.getDriverActiveBooking(req.user.id);
  if (!booking) return res.sendStatus(404);
  res.json(booking);
};

exports.getReceipt = (req, res) => {
  const receipt = service.getReceipt(req.params.bookingId, req.user.id);
  if (!receipt) return res.sendStatus(404);
  res.json(receipt);
};
