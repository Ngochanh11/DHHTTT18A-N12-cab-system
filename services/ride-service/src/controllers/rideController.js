const Ride = require("../models/Ride");
const { producer } = require("../config/clients");

// GET /{rideId}
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Not found" });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /{rideId}/status - Cập nhật trạng thái
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { status },
      { new: true },
    );

    // Nếu hoàn thành chuyến -> Bắn event để Payment Service trừ tiền
    if (status === "COMPLETED") {
      await producer.send({
        topic: "ride.finished",
        messages: [
          {
            value: JSON.stringify({
              rideId: ride._id,
              customerId: ride.customerId,
            }),
          },
        ],
      });
    }
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /active - Lấy chuyến đi đang hoạt động (Dùng token để xác định user)
exports.getActiveRide = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ Token
    const ride = await Ride.findOne({
      $or: [{ customerId: userId }, { driverId: userId }],
      status: { $in: ["MATCHING", "ASSIGNED", "PICKUP", "IN_PROGRESS"] },
    });
    if (!ride) return res.status(404).json({ message: "No active ride" });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /{rideId}/sos - Gửi SOS
exports.sendSOS = async (req, res) => {
  try {
    await producer.send({
      topic: "ride.sos",
      messages: [
        {
          value: JSON.stringify({
            rideId: req.params.rideId,
            userId: req.user.id,
            type: "EMERGENCY",
          }),
        },
      ],
    });
    res.json({ message: "SOS sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /{rideId}/route
exports.getRoute = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).select(
      "route pickupLocation dropoffLocation",
    );
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /{rideId}/location (HTTP Fallback)
exports.updateLocationHTTP = async (req, res) => {
  const { lat, lng } = req.body;
  await Ride.findByIdAndUpdate(req.params.rideId, {
    currentLocation: { lat, lng },
  });
  res.json({ message: "Location updated via HTTP" });
};
