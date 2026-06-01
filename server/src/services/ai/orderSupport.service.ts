import type { OrderStatus } from "@prisma/client";
import { findOrdersForUser } from "../order/query";
import {
  detectOrderSupportSubIntent,
  extractOrderId,
} from "./orderSupportParser";
import type {
  AssistantOrderSummary,
  AssistantOrderTrackingEvent,
  OrderSupportResult,
  OrderSupportSubIntent,
} from "./types";

const CANCELLABLE_STATUSES = new Set<OrderStatus>([
  "PENDING",
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_APPROVED",
  "PROCESSING",
]);

type OrderWithTracking = Awaited<ReturnType<typeof findOrdersForUser>>[number];

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function collectTimeline(order: OrderWithTracking): AssistantOrderTrackingEvent[] {
  const events: AssistantOrderTrackingEvent[] = [];

  for (const event of order.trackingEvents ?? []) {
    events.push({
      id: event.id,
      status: event.status,
      message: event.message,
      location: event.location,
      occurredAt: event.occurredAt.toISOString(),
    });
  }

  for (const shipment of order.shipments ?? []) {
    for (const event of shipment.trackingEvents ?? []) {
      events.push({
        id: event.id,
        status: event.status,
        message: event.message,
        location: event.location,
        occurredAt: event.occurredAt.toISOString(),
      });
    }
  }

  const seen = new Set<string>();
  return events
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

function toOrderSummary(order: OrderWithTracking): AssistantOrderSummary {
  const primaryShipment = order.shipments?.[0];
  const timeline = collectTimeline(order);

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.length,
    carrier: primaryShipment?.carrier ?? null,
    trackingNumber: primaryShipment?.trackingNumber ?? null,
    estimatedDeliveryAt:
      primaryShipment?.estimatedDeliveryAt?.toISOString() ?? null,
    timeline,
    canRequestCancel: CANCELLABLE_STATUSES.has(order.status),
  };
}

function buildTrackReply(
  order: AssistantOrderSummary,
  subIntent: OrderSupportSubIntent,
): string {
  const statusLabel = formatStatus(order.status);
  const eta = formatDate(order.estimatedDeliveryAt);
  const parts: string[] = [
    `Order ${order.id.slice(0, 8)}… is ${statusLabel}.`,
  ];

  if (subIntent === "delivery_status" && eta) {
    parts.push(`Estimated delivery: ${eta}.`);
  } else if (subIntent === "delivery_status") {
    parts.push("No estimated delivery date is set yet.");
  }

  if (order.trackingNumber) {
    parts.push(
      `Tracking${order.carrier ? ` (${order.carrier})` : ""}: ${order.trackingNumber}.`,
    );
  }

  if (order.timeline.length > 0) {
    const latest = order.timeline[0];
    parts.push(`Latest update: ${latest.message}.`);
  }

  return parts.join(" ");
}

function buildCancelReply(order: AssistantOrderSummary): string {
  const statusLabel = formatStatus(order.status);

  if (order.status === "CANCELLED") {
    return `Order ${order.id.slice(0, 8)}… is already cancelled.`;
  }

  if (order.canRequestCancel) {
    return `Order ${order.id.slice(0, 8)}… (${statusLabel}) can be cancelled. Open your Orders page, select this order, and submit a cancellation request. Our team will confirm shortly.`;
  }

  if (order.status === "SHIPPED" || order.status === "DELIVERED") {
    return `Order ${order.id.slice(0, 8)}… has already shipped and cannot be cancelled online. You can request a return from the order details page once it arrives.`;
  }

  return `Order ${order.id.slice(0, 8)}… (${statusLabel}) cannot be cancelled at this stage. Contact support if you need help.`;
}

function buildMultiOrderReply(orders: AssistantOrderSummary[]): string {
  const lines = orders.slice(0, 5).map((order) => {
    const eta = formatDate(order.estimatedDeliveryAt);
    return `• ${order.id.slice(0, 8)}… — ${formatStatus(order.status)}${eta ? ` (ETA ${eta})` : ""}`;
  });

  return `You have ${orders.length} recent orders. Here are the latest:\n${lines.join("\n")}\n\nAsk about a specific order by including its ID, e.g. "Where is order ${orders[0]?.id}?".`;
}

async function resolveTargetOrder(
  userId: string,
  message: string,
  explicitOrderId?: string,
): Promise<{ order: OrderWithTracking | null; recentOrders: OrderWithTracking[] }> {
  const orderId = explicitOrderId ?? extractOrderId(message);
  const recentOrders = await findOrdersForUser(userId);

  if (orderId) {
    const order = recentOrders.find((entry) => entry.id === orderId) ?? null;
    return { order, recentOrders };
  }

  const activeOrders = recentOrders.filter(
    (entry) =>
      entry.status !== "CANCELLED" &&
      entry.status !== "DELIVERED" &&
      entry.paymentStatus !== "FAILED",
  );

  if (activeOrders.length === 1) {
    return { order: activeOrders[0], recentOrders };
  }

  return { order: null, recentOrders: activeOrders.length > 0 ? activeOrders : recentOrders };
}

export async function runOrderSupportChat(input: {
  message: string;
  userId?: string;
  userRole?: string;
  orderId?: string;
}): Promise<OrderSupportResult> {
  const subIntent = detectOrderSupportSubIntent(input.message);

  if (!input.userId || input.userRole !== "USER") {
    return {
      intent: "order_support",
      orderSupportIntent: subIntent,
      reply:
        "To check your order status, please sign in first. Then ask again — for example: “Where is my order?” or include your order ID.",
      orders: [],
      requiresAuth: true,
    };
  }

  const { order, recentOrders } = await resolveTargetOrder(
    input.userId,
    input.message,
    input.orderId,
  );

  if (!order) {
    if (recentOrders.length === 0) {
      return {
        intent: "order_support",
        orderSupportIntent: subIntent,
        reply:
          "I could not find any orders on your account. Place an order first, or double-check you are signed in with the correct account.",
        orders: [],
      };
    }

    const summaries = recentOrders.map(toOrderSummary);
    return {
      intent: "order_support",
      orderSupportIntent: "order_list",
      reply: buildMultiOrderReply(summaries),
      orders: summaries,
    };
  }

  const summary = toOrderSummary(order);
  let reply: string;

  switch (subIntent) {
    case "cancel_request":
      reply = buildCancelReply(summary);
      break;
    case "delivery_status":
      reply = buildTrackReply(summary, "delivery_status");
      break;
    case "track_order":
    default:
      reply = buildTrackReply(summary, "track_order");
      break;
  }

  return {
    intent: "order_support",
    orderSupportIntent: subIntent,
    reply,
    orders: [summary],
  };
}
