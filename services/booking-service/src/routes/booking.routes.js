const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/booking.controller');

router.post('/', auth, ctrl.createBooking);
router.get('/', auth, ctrl.getBookings);
router.get('/driver/active', auth, ctrl.getDriverActive);
router.get('/:bookingId', auth, ctrl.getBooking);
router.put('/:bookingId/cancel', auth, ctrl.cancelBooking);
router.put('/:bookingId/accept', auth, ctrl.acceptBooking);
router.put('/:bookingId/start', auth, ctrl.startRide);
router.put('/:bookingId/complete', auth, ctrl.completeRide);
router.get('/:bookingId/receipt', auth, ctrl.getReceipt);

module.exports = router;
