import type { Order } from "@/types/order/orderTypes";

export type OrderListTab =
  | "all"
  | "to-pay"
  | "to-ship"
  | "to-receive"
  | "to-review";

export const ORDER_LIST_TABS: { id: OrderListTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "to-pay", label: "To Pay" },
  { id: "to-ship", label: "Prepared to Ship" },
  { id: "to-receive", label: "To Receive" },
  { id: "to-review", label: "To Review" },
];

const TO_PAY: Order["status"][] = ["DRAFT", "PENDING_PAYMENT"];
const TO_SHIP: Order["status"][] = ["PAYMENT_APPROVED", "PROCESSING"];
const TO_RECEIVE: Order["status"][] = ["SHIPPED"];
const TO_REVIEW: Order["status"][] = ["DELIVERED"];

export function orderMatchesTab(order: Order, tab: OrderListTab): boolean {
  if (tab === "all") return true;
  if (tab === "to-pay") return TO_PAY.includes(order.status);
  if (tab === "to-ship") return TO_SHIP.includes(order.status);
  if (tab === "to-receive") return TO_RECEIVE.includes(order.status);
  if (tab === "to-review") return TO_REVIEW.includes(order.status);
  return true;
}

export function countOrdersByTab(orders: Order[]): Record<OrderListTab, number> {
  return {
    all: orders.length,
    "to-pay": orders.filter((o) => orderMatchesTab(o, "to-pay")).length,
    "to-ship": orders.filter((o) => orderMatchesTab(o, "to-ship")).length,
    "to-receive": orders.filter((o) => orderMatchesTab(o, "to-receive")).length,
    "to-review": orders.filter((o) => orderMatchesTab(o, "to-review")).length,
  };
}

export function filterOrdersByTab(orders: Order[], tab: OrderListTab): Order[] {
  return orders.filter((o) => orderMatchesTab(o, tab));
}

export function filterOrdersBySearch(orders: Order[], query: string): Order[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;

  return orders.filter((order) => {
    if (order.id.toLowerCase().includes(q)) return true;
    return order.items?.some((item) =>
      item.productName.toLowerCase().includes(q)
    );
  });
}

/** Orders that did not complete — shown on All with a prominent badge, not in lifecycle tabs. */
export const TERMINAL_FAILURE_STATUSES = [
  "CANCELLED",
  "PAYMENT_FAILED",
  "CAPTURE_FAILED",
] as const satisfies readonly Order["status"][];

export function isOrderTerminalFailure(status: Order["status"]): boolean {
  return (TERMINAL_FAILURE_STATUSES as readonly Order["status"][]).includes(
    status
  );
}

export type OrderStatusBadgeTone =
  | "success"
  | "primary"
  | "warning"
  | "muted"
  | "destructive";

export function getOrderStatusBadgeTone(
  status: Order["status"]
): OrderStatusBadgeTone {
  if (isOrderTerminalFailure(status)) return "destructive";
  if (status === "DELIVERED") return "success";
  if (status === "SHIPPED" || status === "PAYMENT_APPROVED") return "primary";
  if (
    status === "PENDING_PAYMENT" ||
    status === "PENDING" ||
    status === "DRAFT"
  ) {
    return "warning";
  }
  if (status === "PROCESSING") return "primary";
  return "muted";
}

export function getOrderStatusBadgeClassName(
  status: Order["status"]
): string {
  const tone = getOrderStatusBadgeTone(status);
  const byTone: Record<OrderStatusBadgeTone, string> = {
    destructive:
      "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10",
    success:
      "border-success/30 bg-success/10 text-success hover:bg-success/10",
    primary:
      "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
    warning:
      "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10",
    muted: "border-border bg-muted/50 text-muted-foreground hover:bg-muted/50",
  };
  return byTone[tone];
}

export function getOrderDisplayStatus(status: Order["status"]): string {
  const labels: Record<Order["status"], string> = {
    PENDING: "Pending",
    DRAFT: "Draft",
    PENDING_PAYMENT: "To Pay",
    PAYMENT_APPROVED: "Preparing",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Completed",
    CANCELLED: "Cancelled",
    PAYMENT_FAILED: "Payment Failed",
    CAPTURE_FAILED: "Capture Failed",
  };
  return labels[status] ?? status;
}

export function getShippingStepIndex(status: Order["status"]): number {
  switch (status) {
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    case "PAYMENT_APPROVED":
      return 1;
    case "PROCESSING":
      return 1;
    case "PENDING_PAYMENT":
    case "DRAFT":
    case "PENDING":
      return 0;
    default:
      return 0;
  }
}

export const SHIPPING_PROGRESS_LABELS = [
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
] as const;
