import { v4 as uuidv4 } from "uuid";

export const payments = [];
export const wallets = {
  user_001: 500000,
  driver_001: 200000
};

export const createPayment = ({ bookingId, method, amount, userId }) => {
  const payment = {
    id: uuidv4(),
    bookingId,
    userId,
    method,
    amount,
    status: "PENDING",
    createdAt: new Date()
  };

  payments.push(payment);
  return payment;
};
