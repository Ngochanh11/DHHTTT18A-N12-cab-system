const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  driverId: { type: String, default: null },

  pickupLocation: {
    lat: Number,
    lng: Number,
    address: String,
  },
  dropoffLocation: {
    lat: Number,
    lng: Number,
    address: String,
  },

  // Vị trí hiện tại (Cập nhật liên tục)
  currentLocation: {
    lat: Number,
    lng: Number,
  },

  // State Machine (Trạng thái chuyến đi)
  status: {
    type: String,
    enum: [
      "CREATED", // Mới đặt
      "MATCHING", // Đang tìm xe
      "ASSIGNED", // Đã có tài xế
      "PICKUP", // Tài xế đang đến
      "IN_PROGRESS", // Đang di chuyển
      "COMPLETED", // Hoàn thành
      "PAID", // Đã thanh toán
      "CANCELLED", // Đã hủy
    ],
    default: "CREATED",
  },
  fare: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ride", rideSchema);
