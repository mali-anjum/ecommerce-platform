import type { Order } from "@/types/order/orderTypes";

export const ORDER_STATUS_STEPS: Order["status"][] = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_APPROVED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export const ORDER_TERMINAL_STATUS: Partial<Record<Order["status"], string>> = {
  CANCELLED: "This order was cancelled.",
  PAYMENT_FAILED: "Payment failed for this order.",
  CAPTURE_FAILED: "Payment capture failed for this order.",
};

export function getOrderProgressIndex(status: Order["status"]) {
  return ORDER_STATUS_STEPS.indexOf(status);
}

