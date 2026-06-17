import { AnalyticsEventType, SalesOfferTrigger } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  SALES_AGENT_CONSTANTS,
  type BehaviorSignals,
  type ViewedProductSummary,
} from "./types";

const LOOKBACK_DAYS = 30;

function metadataString(
  metadata: unknown,
  key: string,
): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function metadataStringArray(
  metadata: unknown,
  key: string,
): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const value = (metadata as Record<string, unknown>)[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function uniqueDays(dates: Date[]): number {
  const days = new Set(
    dates.map((date) => date.toISOString().slice(0, 10)),
  );
  return days.size;
}

export async function collectBehaviorSignals(input: {
  sessionId: string;
  userId?: string;
  visitorId?: string;
}): Promise<BehaviorSignals> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const sessionEvents = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { sessionId: input.sessionId },
        ...(input.userId ? [{ userId: input.userId }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      type: true,
      metadata: true,
      createdAt: true,
    },
  });

  let visitorEvents = sessionEvents;
  if (input.visitorId) {
    visitorEvents = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        metadata: {
          path: ["visitorId"],
          equals: input.visitorId,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        type: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  const viewedProductIds = new Set<string>();
  const cartProductIds = new Set<string>();
  let lastCartAddAt: Date | null = null;
  let hasOrderComplete = false;
  let sessionPingCount = 0;
  let chatCount = 0;
  let cartAddCount = 0;

  for (const event of sessionEvents) {
    if (event.type === AnalyticsEventType.PRODUCT_VIEW) {
      const productId = metadataString(event.metadata, "productId");
      if (productId) viewedProductIds.add(productId);
    }
    if (event.type === AnalyticsEventType.CART_ADD) {
      cartAddCount += 1;
      lastCartAddAt = event.createdAt;
      for (const id of metadataStringArray(event.metadata, "productIds")) {
        cartProductIds.add(id);
      }
      const singleId = metadataString(event.metadata, "productId");
      if (singleId) cartProductIds.add(singleId);
    }
    if (event.type === AnalyticsEventType.ORDER_COMPLETE) {
      hasOrderComplete = true;
    }
    if (event.type === AnalyticsEventType.SESSION_PING) {
      sessionPingCount += 1;
    }
    if (event.type === AnalyticsEventType.CHAT) {
      chatCount += 1;
    }
  }

  const firstEventAt = sessionEvents[0]?.createdAt;
  const lastEventAt = sessionEvents[sessionEvents.length - 1]?.createdAt;
  const spanMinutes =
    firstEventAt && lastEventAt
      ? Math.max(
          0,
          Math.round(
            (lastEventAt.getTime() - firstEventAt.getTime()) / 60_000,
          ),
        )
      : 0;
  const browsingMinutes = Math.max(sessionPingCount, spanMinutes);

  const returnVisitDays = uniqueDays(visitorEvents.map((event) => event.createdAt));

  const cartAbandoned =
    lastCartAddAt != null &&
    !hasOrderComplete &&
    Date.now() - lastCartAddAt.getTime() >=
      SALES_AGENT_CONSTANTS.CART_ABANDON_MINUTES * 60_000;

  const viewedProducts = await loadViewedProducts([...viewedProductIds]);

  const triggers: SalesOfferTrigger[] = [];

  if (viewedProductIds.size >= SALES_AGENT_CONSTANTS.MIN_PRODUCT_VIEWS_FOR_CLUSTER) {
    triggers.push(SalesOfferTrigger.PRODUCT_CLUSTER);
  }
  if (cartAbandoned) {
    triggers.push(SalesOfferTrigger.CART_ABANDON);
  }
  if (browsingMinutes >= SALES_AGENT_CONSTANTS.MIN_BROWSING_MINUTES) {
    triggers.push(SalesOfferTrigger.HIGH_BROWSING);
  }
  if (returnVisitDays >= SALES_AGENT_CONSTANTS.MIN_RETURN_VISIT_DAYS) {
    triggers.push(SalesOfferTrigger.RETURN_VISIT);
  }

  let email: string | undefined;
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    email = user?.email;
  }

  if (!email && (input.visitorId || input.userId)) {
    const profile = await prisma.salesCustomerProfile.findFirst({
      where: {
        OR: [
          ...(input.visitorId ? [{ visitorId: input.visitorId }] : []),
          ...(input.userId ? [{ userId: input.userId }] : []),
        ],
      },
      select: { email: true },
    });
    email = profile?.email ?? undefined;
  }

  const estimatedCartValue = viewedProducts.reduce(
    (sum, product) => sum + product.price,
    0,
  );

  return {
    sessionId: input.sessionId,
    userId: input.userId,
    visitorId: input.visitorId,
    email,
    viewedProductIds: [...viewedProductIds],
    viewedProducts,
    browsingMinutes,
    returnVisitDays,
    cartAbandoned,
    cartProductIds: [...cartProductIds],
    cartAddCount,
    chatCount,
    hasOrderComplete,
    estimatedCartValue,
    triggers,
  };
}

async function loadViewedProducts(
  productIds: string[],
): Promise<ViewedProductSummary[]> {
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      price: true,
    },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
  }));
}

export function pickPrimaryTrigger(
  triggers: SalesOfferTrigger[],
): SalesOfferTrigger | null {
  if (triggers.length === 0) return null;

  const priority: SalesOfferTrigger[] = [
    SalesOfferTrigger.CART_ABANDON,
    SalesOfferTrigger.PRODUCT_CLUSTER,
    SalesOfferTrigger.RETURN_VISIT,
    SalesOfferTrigger.HIGH_BROWSING,
  ];

  for (const trigger of priority) {
    if (triggers.includes(trigger)) return trigger;
  }

  return triggers[0] ?? null;
}
