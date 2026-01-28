exports.calculateDynamicPrice = (req, res) => {
  const { demand, time, weather, events } = req.body;

  let multiplier = 1.0;
  if (demand > 80) multiplier += 0.4;
  if (time === "peak") multiplier += 0.3;
  if (weather === "rain") multiplier += 0.2;
  if (events) multiplier += 0.3;

  res.json({
    surgeMultiplier: Math.min(multiplier, 2.0),
    source: "AI-MOCK",
  });
};
