const express = require('express');
const cors = require('cors');

const bookingRoutes = require('./routes/booking.routes');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

app.use('/api/v1/bookings', bookingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'BOOKING SERVICE OK' });
});

app.listen(PORT, () => {
  console.log(`🚗 Booking Service running on port ${PORT}`);
});
