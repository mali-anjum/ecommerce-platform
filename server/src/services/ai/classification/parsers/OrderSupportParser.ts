import type { OrderSupportSubIntent } from "../../types";

const ORDER_SUPPORT_SIGNALS =
  /\b(where is my order|where'?s my order|track my order|track order|order status|my order|delivery status|when will.*(arrive|deliver)|expected delivery|shipping update|shipment status|order update)\b/i;

const CANCEL_SIGNALS =
  /\b(cancel my order|cancel order|cancellation|request cancel|want to cancel)\b/i;

const DELIVERY_SIGNALS =
  /\b(delivery|deliver|arriv(e|al|ing)|eta|expected (delivery|date)|when will i get)\b/i;

const REFUND_SIGNALS =
  /\b(refund|money back|chargeback|exchange|how do i return)\b/i;

const REFUND_WITH_ORDER_SIGNALS =
  /\b(return my order|refund my order|return this order)\b/i;

const STORE_POLICY_SIGNALS =
  /\b(return policy|refund policy|shipping policy)\b/i;

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function isStorePolicyQuestion(message: string): boolean {
  return (
    STORE_POLICY_SIGNALS.test(message) &&
    !/\b(my order|this order|order #|track)\b/i.test(message)
  );
}

export function isOrderSupportQuery(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 4) {
    return false;
  }

  if (isStorePolicyQuestion(trimmed)) {
    return false;
  }

  if (extractOrderId(trimmed)) {
    return (
      ORDER_SUPPORT_SIGNALS.test(trimmed) ||
      CANCEL_SIGNALS.test(trimmed) ||
      DELIVERY_SIGNALS.test(trimmed) ||
      REFUND_SIGNALS.test(trimmed) ||
      REFUND_WITH_ORDER_SIGNALS.test(trimmed) ||
      /\b(order|tracking|shipment)\b/i.test(trimmed)
    );
  }

  return (
    ORDER_SUPPORT_SIGNALS.test(trimmed) ||
    CANCEL_SIGNALS.test(trimmed) ||
    REFUND_SIGNALS.test(trimmed) ||
    REFUND_WITH_ORDER_SIGNALS.test(trimmed) ||
    (DELIVERY_SIGNALS.test(trimmed) && /\border\b/i.test(trimmed))
  );
}

export function detectOrderSupportSubIntent(
  message: string,
): OrderSupportSubIntent {
  if (
    REFUND_SIGNALS.test(message) ||
    REFUND_WITH_ORDER_SIGNALS.test(message) ||
    (STORE_POLICY_SIGNALS.test(message) && /\b(return|refund)\b/i.test(message))
  ) {
    return "refund_request";
  }
  if (CANCEL_SIGNALS.test(message)) {
    return "cancel_request";
  }
  if (DELIVERY_SIGNALS.test(message)) {
    return "delivery_status";
  }
  return "track_order";
}

export function extractOrderId(message: string): string | undefined {
  const match = message.match(UUID_PATTERN);
  return match?.[0];
}

export function extractEmail(message: string): string | undefined {
  const match = message.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase();
}
