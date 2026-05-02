import type { Payment } from "@prisma/client";

/**
 * Adds top-level `paymentId` / `providerOrderId` / `providerCaptureId` aliases expected by older
 * clients, derived from the most recent payment attempt.
 */
export function withLegacyPaymentAliases<
  O extends { payments?: Payment[] },
>(order: O): O & {
  paymentId?: string;
  providerOrderId?: string;
  providerCaptureId?: string | null;
} {
  const latest = order.payments?.[0];
  return {
    ...order,
    paymentId: latest?.providerReferenceId ?? undefined,
    providerOrderId: latest?.providerReferenceId ?? undefined,
    providerCaptureId: latest?.providerCaptureId ?? null,
  };
}

export function mapOrdersWithLegacyPaymentAliases<
  O extends { payments?: Payment[] },
>(orders: O[]): ReturnType<typeof withLegacyPaymentAliases<O>>[] {
  return orders.map(withLegacyPaymentAliases);
}
