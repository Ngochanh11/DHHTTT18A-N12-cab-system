exports.estimate = async (req, res) => {
  const { pickup, destination, vehicleType = "economy" } = req.body;

  if (!pickup || !destination) {
    return res.status(400).json({
      message: "pickup and destination are required",
    });
  }

  // Mock dữ liệu (đúng tinh thần OpenAPI)
  const estimatedDistance = 10.5; // km
  const estimatedDuration = 18; // phút

  const baseFare = 15000;
  const distanceFare = estimatedDistance * 12000;
  const timeFare = estimatedDuration * 1000;
  const surgeMultiplier = 1.0;

  const totalFare = (baseFare + distanceFare + timeFare) * surgeMultiplier;

  res.json({
    baseFare,
    distanceFare,
    timeFare,
    surgeMultiplier,
    totalFare,
    currency: "VND",
    estimatedDistance,
    estimatedDuration,
    breakdown: [
      { name: "Base Fare", amount: baseFare },
      { name: "Distance Fare", amount: distanceFare },
      { name: "Time Fare", amount: timeFare },
    ],
  });
};
