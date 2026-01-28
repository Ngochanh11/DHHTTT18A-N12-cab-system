import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔎 DEBUG LOG
console.log("🚀 Starting Payment Service...");
console.log("📌 Mounting routes at: /api/v1/payments");

// 👉 Mount routes
app.use("/api/v1/payments", paymentRoutes);

// 🔎 Route test nhanh (rất quan trọng)
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "payment-service" });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`💰 Payment Service running on port ${PORT}`);
  console.log(`👉 Test: http://localhost:${PORT}/api/v1/payments/methods`);
});
