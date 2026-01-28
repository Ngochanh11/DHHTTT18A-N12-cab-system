exports.getSurge = async (req, res) => {
  res.json({
    zoneId: req.params.zoneId,
    multiplier: 1.5,
    updatedAt: new Date().toISOString(),
  });
};

exports.updateSurge = async (req, res) => {
  const { multiplier } = req.body;
  res.json({
    zoneId: req.params.zoneId,
    multiplier,
    updatedAt: new Date().toISOString(),
  });
};

exports.listZones = (_, res) => {
  res.json([
    {
      id: "HCM_D1",
      name: "District 1",
      multiplier: 1.5,
      demand: 0.85,
      supply: 0.6,
      lastUpdated: new Date().toISOString(),
    },
  ]);
};
