import express from "express";
import { mockAuth } from "../middleware/auth.mock.js";
import { payments, wallets, createPayment } from "../data/payment.mock.js";

const router = express.Router();

/**
 * GET /methods
 */
router.get("/methods", mockAuth, (req, res) => {
  res.json(["CASH", "MOMO", "VNPAY", "STRIPE"]);
});

/**
 * POST /
 * Create payment
 */
router.post("/", mockAuth, (req, res) => {
  const { bookingId, method, amount } = req.body;

  const payment = createPayment({
    bookingId,
    method,
    amount,
    userId: req.user.id
  });

  res.status(201).json(payment);
});

/**
 * GET /:paymentId
 */
router.get("/:paymentId", mockAuth, (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "Not found" });
  res.json(payment);
});

/**
 * POST /:paymentId/confirm
 */
router.post("/:paymentId/confirm", mockAuth, (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "Not found" });

  payment.status = "SUCCESS";
  res.json(payment);
});

/**
 * POST /:paymentId/cancel
 */
router.post("/:paymentId/cancel", mockAuth, (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "Not found" });

  payment.status = "CANCELLED";
  res.json(payment);
});

/**
 * POST /:paymentId/refund
 */
router.post("/:paymentId/refund", mockAuth, (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "Not found" });

  payment.status = "REFUNDED";
  res.json(payment);
});

/**
 * GET /booking/:bookingId
 */
router.get("/booking/:bookingId", mockAuth, (req, res) => {
  res.json(payments.filter(p => p.bookingId === req.params.bookingId));
});

/**
 * GET /user/:userId
 */
router.get("/user/:userId", mockAuth, (req, res) => {
  res.json(payments.filter(p => p.userId === req.params.userId));
});

/**
 * POST /wallet/topup
 */
router.post("/wallet/topup", mockAuth, (req, res) => {
  const { amount } = req.body;
  wallets[req.user.id] += amount;
  res.json({ balance: wallets[req.user.id] });
});

/**
 * POST /wallet/withdraw
 */
router.post("/wallet/withdraw", mockAuth, (req, res) => {
  const { amount } = req.body;

  if (wallets[req.user.id] < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  wallets[req.user.id] -= amount;
  res.json({ balance: wallets[req.user.id] });
});

/**
 * Webhooks (mock)
 */
router.post("/webhook/stripe", (req, res) => res.send("Stripe webhook received"));
router.post("/webhook/momo", (req, res) => res.send("MoMo webhook received"));
router.post("/webhook/vnpay", (req, res) => res.send("VNPay webhook received"));

export default router;
