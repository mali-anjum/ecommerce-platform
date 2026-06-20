import type { OrderStatus } from "@prisma/client";
import {
  findOrderForPublicTracking,
  findOrdersForUser,
} from "../../order/query";
import { loadPolicies } from "../knowledge/loaders/LoadPolicies";
import {
  detectOrderSupportSubIntent,
  extractEmail,
  extractOrderId,
} from "../classification/parsers/OrderSupportParser";
import type {
  AssistantOrderSummary,
  AssistantOrderTrackingEvent,
  OrderSupportResult,
  OrderSupportSubIntent,
} from "../types";

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDelivery(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff === -1) return "Yesterday";
  return formatDate(target);
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

function findShippedDate(timeline: AssistantOrderTrackingEvent[]): string | null {
  const shippedEvent = [...timeline]
    .reverse()
    .find(
      (event) =>
        event.status?.toUpperCase() === "SHIPPED" ||
        /\bshipped\b/i.test(event.message),
    );
  return shippedEvent ? formatDate(shippedEvent.occurredAt) : null;
}

function buildStructuredTrackReply(order: AssistantOrderSummary): string {
  const shortId = order.id.slice(0, 8);
  const statusLabel = formatStatus(order.status);
  const shippedOn =
    findShippedDate(order.timeline) ?? formatDate(order.createdAt);
  const latest = order.timeline[0];
  const currentLocation = latest?.location ?? null;
  const eta = formatRelativeDelivery(order.estimatedDeliveryAt);

  const lines = [
    `Order #${shortId}`,
    "",
    `Status: ${statusLabel}`,
  ];

  if (shippedOn && order.status !== "PENDING" && order.status !== "PROCESSING") {
    lines.push(`Shipped: ${shippedOn}`);
  }

  if (currentLocation) {
    lines.push(`Current location: ${currentLocation}`);
  } else if (latest?.message) {
    lines.push(`Latest update: ${latest.message}`);
  }

  if (eta) {
    lines.push(`Expected delivery: ${eta}`);
  }

  if (order.trackingNumber) {
    lines.push(
      "",
      `Tracking${order.carrier ? ` (${order.carrier})` : ""}: ${order.trackingNumber}`,
    );
  }

  return lines.join("\n");
}

function buildCancelReply(order: AssistantOrderSummary): string {
  const shortId = order.id.slice(0, 8);
  const statusLabel = formatStatus(order.status);

  if (order.status === "CANCELLED") {
    return `Order #${shortId}\n\nStatus: Cancelled\n\nThis order was already cancelled.`;
  }

  if (order.canRequestCancel) {
    return [
      `Order #${shortId}`,
      "",
      `Status: ${statusLabel}`,
      "",
      "You can cancel this order from your account: open Orders, select this order, and submit a cancellation request. Our team will confirm shortly.",
    ].join("\n");
  }

  if (order.status === "SHIPPED" || order.status === "DELIVERED") {
    return [
      `Order #${shortId}`,
      "",
      `Status: ${statusLabel}`,
      "",
      "This order has already shipped and cannot be cancelled online. After delivery, you can request a return from the order details page.",
    ].join("\n");
  }

  return [
    `Order #${shortId}`,
    "",
    `Status: ${statusLabel}`,
    "",
    "This order cannot be cancelled at its current stage. Say “talk to agent” if you need help from our team.",
  ].join("\n");
}

async function buildRefundReply(order?: AssistantOrderSummary): Promise<string> {
  const policies = await loadPolicies();
  const returnText =
    policies.returnPolicy.trim() ||
    "Contact support for return and refund eligibility.";

  const lines = [
    "Returns & refunds",
    "",
    returnText.slice(0, 1200),
  ];

  if (order) {
    const shortId = order.id.slice(0, 8);
    lines.push(
      "",
      `Your order #${shortId} is ${formatStatus(order.status)}.`,
    );
    if (order.status === "DELIVERED") {
      lines.push(
        "You can start a return from your order details page if the item is eligible.",
      );
    } else if (order.status === "SHIPPED") {
      lines.push(
        "If the package has not arrived yet, ask about delivery status first. Returns typically apply after delivery.",
      );
    }
  }

  if (policies.supportEmail) {
    lines.push("", `Support email: ${policies.supportEmail}`);
  }

  return lines.join("\n");
}

function buildMultiOrderReply(orders: AssistantOrderSummary[]): string {
  const lines = orders.slice(0, 5).map((order) => {
    const eta = formatRelativeDelivery(order.estimatedDeliveryAt);
    return `• #${order.id.slice(0, 8)} — ${formatStatus(order.status)}${eta ? ` · ETA ${eta}` : ""}`;
  });

  return [
    `You have ${orders.length} recent orders:`,
    "",
    ...lines,
    "",
    `Ask about one order by ID, e.g. "Where is order ${orders[0]?.id}?"`,
  ].join("\n");
}

function buildGuestAuthPrompt(): string {
  return [
    "I can look up a specific order from our database.",
    "",
    "Signed in: ask “Where is my order?” and I will use your account orders.",
    "",
    "Guest: send your order ID and the email used at checkout, for example:",
    "“Track order <order-id> email you@example.com”",
    "",
    "You can also sign in for full order history.",
  ].join("\n");
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

  return {
    order: null,
    recentOrders: activeOrders.length > 0 ? activeOrders : recentOrders,
  };
}

async function resolveGuestOrder(
  message: string,
  explicitOrderId?: string,
): Promise<OrderWithTracking | null> {
  const orderId = explicitOrderId ?? extractOrderId(message);
  const email = extractEmail(message);
  if (!orderId || !email) return null;

  const order = await findOrderForPublicTracking(orderId, email);
  return order as OrderWithTracking | null;
}

function buildReplyForOrder(
  summary: AssistantOrderSummary,
  subIntent: OrderSupportSubIntent,
): Promise<string> | string {
  switch (subIntent) {
    case "refund_request":
      return buildRefundReply(summary);
    case "cancel_request":
      return buildCancelReply(summary);
    case "delivery_status":
    case "track_order":
    default:
      return buildStructuredTrackReply(summary);
  }
}

export async function runOrderSupportChat(input: {
  message: string;
  userId?: string;
  userRole?: string;
  orderId?: string;
}): Promise<OrderSupportResult> {
  const subIntent = detectOrderSupportSubIntent(input.message);

  if (subIntent === "refund_request" && (!input.userId || input.userRole !== "USER")) {
    return {
      intent: "order_support",
      orderSupportIntent: subIntent,
      reply: await buildRefundReply(),
      orders: [],
    };
  }

  if (!input.userId || input.userRole !== "USER") {
    const guestOrder = await resolveGuestOrder(input.message, input.orderId);
    if (guestOrder) {
      const summary = toOrderSummary(guestOrder);
      const reply = await buildReplyForOrder(summary, subIntent);
      return {
        intent: "order_support",
        orderSupportIntent: subIntent,
        reply,
        orders: [summary],
      };
    }

    return {
      intent: "order_support",
      orderSupportIntent: subIntent,
      reply: buildGuestAuthPrompt(),
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
          "I could not find any orders on your account. Place an order first, or confirm you are signed in with the correct email.",
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
  const reply = await buildReplyForOrder(summary, subIntent);

  return {
    intent: "order_support",
    orderSupportIntent: subIntent,
    reply,
    orders: [summary],
  };
}
