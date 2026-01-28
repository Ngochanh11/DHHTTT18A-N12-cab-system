exports.getVehicleTypes = (_, res) => {
  res.json([
    {
      type: "economy",
      name: "Economy",
      description: "Affordable daily rides",
      baseFareMultiplier: 1.0,
      perKmMultiplier: 1.0,
      perMinMultiplier: 1.0,
      capacity: 4,
    },
    {
      type: "premium",
      name: "Premium",
      description: "Comfortable premium cars",
      baseFareMultiplier: 1.5,
      perKmMultiplier: 1.4,
      perMinMultiplier: 1.3,
      capacity: 4,
    },
  ]);
};
