const express = require("express");
const pricingRoutes = require("./routes/pricing.routes");

const app = express();
app.use(express.json());

/**
 * API Gateway → /api/v1/pricing/**
 */
app.use("/api/v1/pricing", pricingRoutes);

/* Health & metadata */
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.get("/version", (_, res) =>
  res.json({ service: "pricing-service", version: "1.0.0" }),
);

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`Pricing Service running on port ${PORT}`);
});
