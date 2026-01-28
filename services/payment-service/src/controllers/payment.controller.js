import { v4 as uuidv4 } from "uuid";

/**
 * POST /payments
 */
export const createPayment = (req, res) => {
  const { bookingId, method, amount } = req.body;

  res.status(201).json({
    paymentId: uuidv4(),
    bookingId,
    method,
    amount,
    status: "PENDING",
  });
};

export const getPayment = (req, res) => {
  res.json({
    paymentId: req.params.paymentId,
    status: "PENDING",
  });
};

export const confirmPayment = (req, res) => {
  res.json({
    paymentId: req.params.paymentId,
    status: "SUCCESS",
  });
};

export const cancelPayment = (req, res) => {
  res.json({
    paymentId: req.params.paymentId,
    status: "CANCELLED",
  });
};

export const refundPayment = (req, res) => {
  res.json({
    paymentId: req.params.paymentId,
    refund: "REQUESTED",
  });
};

export const getByBooking = (req, res) => {
  res.json({ bookingId: req.params.bookingId });
};

export const getByUser = (req, res) => {
  res.json({ userId: req.params.userId });
};

export const getByDriver = (req, res) => {
  res.json({ driverId: req.params.driverId });
};

export const walletTopup = (req, res) => {
  res.json({
    amount: req.body.amount,
    method: req.body.method,
    status: "TOPUP_SUCCESS",
  });
};

export const walletWithdraw = (req, res) => {
  res.json({
    amount: req.body.amount,
    status: "WITHDRAW_SUCCESS",
  });
};

export const getMethods = (req, res) => {
  res.json(["STRIPE", "VNPAY", "MOMO"]);
};

// Webhooks
export const stripeWebhook = (req, res) => res.json({ received: true });
export const vnpayWebhook = (req, res) => res.json({ received: true });
export const momoWebhook = (req, res) => res.json({ received: true });
