let pricingConfig = {
  baseFare: 15000,
  perKilometer: 12000,
  perMinute: 1000,
  minimumFare: 25000,
  currency: "VND",
  timeBasedMultipliers: [],
  distanceThresholds: [],
};

exports.getConfig = (_, res) => {
  res.json(pricingConfig);
};

exports.updateConfig = (req, res) => {
  pricingConfig = { ...pricingConfig, ...req.body };
  res.json(pricingConfig);
};
