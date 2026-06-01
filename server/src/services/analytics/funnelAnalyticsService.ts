import { AnalyticsEventType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type FunnelTrackingSummary = {
  chat: number;
  productView: number;
  cartAdd: number;
  orderComplete: number;
  chatToProductViewRate: number;
  productViewToCartRate: number;
  cartToOrderRate: number;
  overallConversionRate: number;
  sessionCounts: {
    startedChat: number;
    reachedProductView: number;
    reachedCart: number;
    completedOrder: number;
  };
};

const FUNNEL_STAGES: AnalyticsEventType[] = [
  AnalyticsEventType.CHAT,
  AnalyticsEventType.PRODUCT_VIEW,
  AnalyticsEventType.CART_ADD,
  AnalyticsEventType.ORDER_COMPLETE,
];

function correlationKey(event: {
  sessionId: string | null;
  userId: string | null;
  id: string;
}): string | null {
  return event.sessionId ?? event.userId ?? null;
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export async function fetchFunnelTrackingSummary(
  start: Date,
  end: Date,
): Promise<FunnelTrackingSummary> {
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      id: true,
      type: true,
      sessionId: true,
      userId: true,
    },
  });

  const eventCounts: Record<AnalyticsEventType, number> = {
    CHAT: 0,
    PRODUCT_VIEW: 0,
    CART_ADD: 0,
    ORDER_COMPLETE: 0,
  };

  for (const event of events) {
    eventCounts[event.type] += 1;
  }

  const stageSets = new Map<string, Set<AnalyticsEventType>>();

  for (const event of events) {
    const key = correlationKey(event);
    if (!key) continue;

    const stages = stageSets.get(key) ?? new Set<AnalyticsEventType>();
    stages.add(event.type);
    stageSets.set(key, stages);
  }

  let startedChat = 0;
  let reachedProductView = 0;
  let reachedCart = 0;
  let completedOrder = 0;

  for (const stages of stageSets.values()) {
    if (!stages.has(AnalyticsEventType.CHAT)) continue;
    startedChat += 1;

    if (stages.has(AnalyticsEventType.PRODUCT_VIEW)) {
      reachedProductView += 1;
    }
    if (
      stages.has(AnalyticsEventType.PRODUCT_VIEW) &&
      stages.has(AnalyticsEventType.CART_ADD)
    ) {
      reachedCart += 1;
    }
    if (
      stages.has(AnalyticsEventType.PRODUCT_VIEW) &&
      stages.has(AnalyticsEventType.CART_ADD) &&
      stages.has(AnalyticsEventType.ORDER_COMPLETE)
    ) {
      completedOrder += 1;
    }
  }

  return {
    chat: eventCounts.CHAT,
    productView: eventCounts.PRODUCT_VIEW,
    cartAdd: eventCounts.CART_ADD,
    orderComplete: eventCounts.ORDER_COMPLETE,
    chatToProductViewRate: rate(reachedProductView, startedChat),
    productViewToCartRate: rate(reachedCart, reachedProductView),
    cartToOrderRate: rate(completedOrder, reachedCart),
    overallConversionRate: rate(completedOrder, startedChat),
    sessionCounts: {
      startedChat,
      reachedProductView,
      reachedCart,
      completedOrder,
    },
  };
}

export { FUNNEL_STAGES };
