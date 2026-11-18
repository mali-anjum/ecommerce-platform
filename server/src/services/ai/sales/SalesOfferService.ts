import {
  SalesEmailJobStatus,
  SalesOfferStatus,
  SalesOfferTrigger,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { isFeatureEnabled } from "../../../config/featureFlags";
import { getProductRecommendations } from "../recommendations/ProductRecommendationService";
import { analyzeBuyingIntent } from "./BuyingIntentAnalyzer";
import {
  collectBehaviorSignals,
  pickPrimaryTrigger,
} from "./BehaviorSignalService";
import {
  attachEmailToProfile,
  incrementProfileOfferCount,
  markProfilesConverted,
  upsertSalesCustomerProfile,
} from "./CustomerProfileService";
import { decideSalesActions } from "./SalesDecisionService";
import {
  computeIntentScore,
  shouldPromptGuestEmailCapture,
} from "./IntentScoringEngine";
import {
  cancelPendingEmailsForOffer,
  enqueueSalesEmailSequence,
} from "./SalesEmailQueueService";
import { createSalesLead } from "./SalesFollowUpService";
import {
  SALES_AGENT_CONSTANTS,
  type SalesAgentContext,
  type SalesOfferPayload,
} from "./types";
import { sentryTracker } from "../../../lib/monitoring";

const productSelect = {
  id: true,
  name: true,
  brand: true,
  price: true,
  discountPercent: true,
  images: true,
  category: true,
  stock: true,
  rating: true,
} as const;

function effectivePrice(price: number, discountPercent: number | null): number {
  if (discountPercent != null && discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
  }
  return price;
}

function generateCouponCode(sessionId: string): string {
  const suffix = sessionId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SAVE-${suffix}`;
}

async function hasRecentOffer(input: {
  sessionId: string;
  userId?: string;
  visitorId?: string;
}): Promise<boolean> {
  const since = new Date(
    Date.now() - SALES_AGENT_CONSTANTS.OFFER_COOLDOWN_HOURS * 60 * 60 * 1000,
  );

  const existing = await prisma.salesAgentOffer.findFirst({
    where: {
      createdAt: { gte: since },
      OR: [
        { sessionId: input.sessionId },
        ...(input.userId ? [{ userId: input.userId }] : []),
        ...(input.visitorId ? [{ visitorId: input.visitorId }] : []),
      ],
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function createPersonalizedCoupon(sessionId: string) {
  const code = generateCouponCode(sessionId);
  const now = new Date();
  const endDate = new Date(
    now.getTime() + SALES_AGENT_CONSTANTS.COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  );

  return prisma.coupon.create({
    data: {
      code,
      discountPercent: SALES_AGENT_CONSTANTS.DEFAULT_DISCOUNT_PERCENT,
      startDate: now,
      endDate,
      usageLimit: 1,
      usageCount: 0,
      isActive: true,
    },
  });
}

function buildRecommendationQuery(
  intentSummary: string,
  themeKeywords: string[],
): string {
  if (themeKeywords.length > 0) {
    return `${intentSummary} ${themeKeywords.join(" ")}`;
  }
  return intentSummary;
}

function parseStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function loadRecommendedProducts(productIds: string[]) {
  if (productIds.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      isArchived: false,
      stock: { gt: 0 },
    },
    select: productSelect,
  });

  return rows.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    discountPercent: product.discountPercent,
    effectivePrice: effectivePrice(product.price, product.discountPercent),
    images: product.images,
    category: product.category,
    stock: product.stock,
    rating: product.rating,
  }));
}

function mapOfferRecord(
  id: string,
  offer: {
    intentSummary: string;
    intentScore: number;
    segment: string;
    triggerReason: SalesOfferTrigger;
    couponCode: string | null;
    discountPercent: number | null;
    recommendedProductIds: string[];
  },
  products: Awaited<ReturnType<typeof loadRecommendedProducts>>,
): SalesOfferPayload {
  return {
    id,
    intentSummary: offer.intentSummary,
    intentScore: offer.intentScore,
    segment: offer.segment,
    triggerReason: offer.triggerReason,
    couponCode: offer.couponCode,
    discountPercent: offer.discountPercent,
    products,
  };
}

export async function getSalesAgentContext(input: {
  sessionId: string;
  userId?: string;
  visitorId?: string;
}): Promise<SalesAgentContext | null> {
  if (!isFeatureEnabled("ai.salesAgent") || !input.sessionId) return null;

  try {
    const signals = await collectBehaviorSignals(input);
    const scoreBreakdown = computeIntentScore(signals);
    const decision = decideSalesActions({
      signals,
      intentScore: scoreBreakdown.total,
      hasRecentOffer: await hasRecentOffer(input),
    });

    await upsertSalesCustomerProfile({
      signals,
      intentScore: scoreBreakdown.total,
      email: signals.email,
    });

    const offers = await getPendingOffersForSession(input.sessionId);

    return {
      intentScore: scoreBreakdown.total,
      scoreBreakdown,
      segment: decision.segment,
      triggers: signals.triggers,
      shouldCaptureEmail: shouldPromptGuestEmailCapture(
        scoreBreakdown.total,
        Boolean(signals.email),
        signals.triggers.length,
      ),
      offers,
    };
  } catch (error) {
    sentryTracker(error, { source: "salesOfferService.context" });
    return null;
  }
}

export async function evaluateSalesAgentOffer(input: {
  sessionId: string;
  userId?: string;
  visitorId?: string;
}): Promise<SalesOfferPayload | null> {
  if (!isFeatureEnabled("ai.salesAgent") || !input.sessionId) return null;

  try {
    const signals = await collectBehaviorSignals(input);
    const scoreBreakdown = computeIntentScore(signals);
    const intentScore = scoreBreakdown.total;
    const recentOffer = await hasRecentOffer(input);
    const decision = decideSalesActions({
      signals,
      intentScore,
      hasRecentOffer: recentOffer,
    });

    await upsertSalesCustomerProfile({
      signals,
      intentScore,
      email: signals.email,
    });

    if (!decision.shouldCreateOffer) {
      return null;
    }

    const trigger = pickPrimaryTrigger(signals.triggers);
    if (!trigger) return null;

    const intent = await analyzeBuyingIntent(signals.viewedProducts);
    const excludeIds = new Set(signals.viewedProductIds);

    const recommendation = await getProductRecommendations(
      buildRecommendationQuery(intent.intentSummary, intent.themeKeywords),
      {
        searchTerms: intent.complementaryCategories,
        categories: intent.complementaryCategories,
        sortBy: "popular",
      },
    );

    const recommendedProducts = recommendation.products.filter(
      (product) => !excludeIds.has(product.id),
    );

    const coupon = await createPersonalizedCoupon(input.sessionId);

    const offer = await prisma.salesAgentOffer.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        visitorId: input.visitorId ?? null,
        email: signals.email ?? null,
        intentScore,
        segment: decision.segment,
        intentSummary: intent.intentSummary,
        triggerReason: trigger,
        viewedProductIds: signals.viewedProductIds,
        recommendedProductIds: recommendedProducts.map((product) => product.id),
        couponId: coupon.id,
        couponCode: coupon.code,
        discountPercent: coupon.discountPercent,
        status: SalesOfferStatus.PENDING,
      },
    });

    await incrementProfileOfferCount({
      visitorId: input.visitorId,
      userId: input.userId,
    });

    if (signals.email && decision.shouldQueueEmails) {
      await enqueueSalesEmailSequence({
        offerId: offer.id,
        toEmail: signals.email,
        intentScore,
        payload: {
          intentSummary: intent.intentSummary,
          couponCode: coupon.code,
          discountPercent: coupon.discountPercent,
          productNames: recommendedProducts.map((product) => product.name),
        },
      });

      await createSalesLead({
        email: signals.email,
        intentSummary: intent.intentSummary,
        triggerReason: trigger,
        couponCode: coupon.code,
      });
    }

    return mapOfferRecord(
      offer.id,
      {
        intentSummary: intent.intentSummary,
        intentScore,
        segment: decision.segment,
        triggerReason: trigger,
        couponCode: coupon.code,
        discountPercent: coupon.discountPercent,
        recommendedProductIds: recommendedProducts.map((product) => product.id),
      },
      recommendedProducts,
    );
  } catch (error) {
    sentryTracker(error, { source: "salesOfferService.evaluate" });
    console.error("[sales-agent] Failed to evaluate offer", error);
    return null;
  }
}

export async function captureGuestEmailForSales(input: {
  sessionId: string;
  email: string;
  visitorId?: string;
  userId?: string;
}): Promise<{ queued: boolean; offerId?: string }> {
  const normalized = input.email.trim().toLowerCase();
  await attachEmailToProfile({
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    userId: input.userId,
    email: normalized,
  });

  const pendingOffer = await prisma.salesAgentOffer.findFirst({
    where: {
      sessionId: input.sessionId,
      status: { in: [SalesOfferStatus.PENDING, SalesOfferStatus.SHOWN] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (pendingOffer) {
    await prisma.salesAgentOffer.update({
      where: { id: pendingOffer.id },
      data: { email: normalized },
    });

    const productIds = parseStringArray(pendingOffer.recommendedProductIds);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { name: true },
    });

    await enqueueSalesEmailSequence({
      offerId: pendingOffer.id,
      toEmail: normalized,
      intentScore: pendingOffer.intentScore,
      payload: {
        intentSummary: pendingOffer.intentSummary,
        couponCode: pendingOffer.couponCode,
        discountPercent: pendingOffer.discountPercent,
        productNames: products.map((product) => product.name),
      },
    });

    await createSalesLead({
      email: normalized,
      intentSummary: pendingOffer.intentSummary,
      triggerReason: pendingOffer.triggerReason,
      couponCode: pendingOffer.couponCode,
    });

    return { queued: true, offerId: pendingOffer.id };
  }

  const created = await evaluateSalesAgentOffer({
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    userId: input.userId,
  });

  if (created && normalized) {
    const row = await prisma.salesAgentOffer.findUnique({
      where: { id: created.id },
    });
    if (row && !row.email) {
      await prisma.salesAgentOffer.update({
        where: { id: created.id },
        data: { email: normalized },
      });
      await enqueueSalesEmailSequence({
        offerId: created.id,
        toEmail: normalized,
        intentScore: created.intentScore,
        payload: {
          intentSummary: created.intentSummary,
          couponCode: created.couponCode,
          discountPercent: created.discountPercent,
          productNames: created.products.map((product) => product.name),
        },
      });
    }
  }

  return { queued: Boolean(created), offerId: created?.id };
}

export function scheduleSalesAgentEvaluation(input: {
  sessionId?: string;
  userId?: string;
  visitorId?: string;
}): void {
  if (!input.sessionId || !isFeatureEnabled("ai.salesAgent")) return;

  void evaluateSalesAgentOffer({
    sessionId: input.sessionId,
    userId: input.userId,
    visitorId: input.visitorId,
  });
}

export async function getPendingOffersForSession(
  sessionId: string,
): Promise<SalesOfferPayload[]> {
  const offers = await prisma.salesAgentOffer.findMany({
    where: {
      sessionId,
      status: {
        in: [SalesOfferStatus.PENDING, SalesOfferStatus.EMAIL_SENT, SalesOfferStatus.SHOWN],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const payloads: SalesOfferPayload[] = [];

  for (const offer of offers) {
    const productIds = parseStringArray(offer.recommendedProductIds);
    const products = await loadRecommendedProducts(productIds);
    payloads.push(
      mapOfferRecord(
        offer.id,
        {
          intentSummary: offer.intentSummary,
          intentScore: offer.intentScore,
          segment: offer.segment,
          triggerReason: offer.triggerReason,
          couponCode: offer.couponCode,
          discountPercent: offer.discountPercent,
          recommendedProductIds: productIds,
        },
        products,
      ),
    );
  }

  return payloads;
}

export async function markOfferShown(offerId: string, sessionId: string): Promise<void> {
  await prisma.salesAgentOffer.updateMany({
    where: {
      id: offerId,
      sessionId,
      status: { in: [SalesOfferStatus.PENDING, SalesOfferStatus.EMAIL_SENT] },
    },
    data: {
      status: SalesOfferStatus.SHOWN,
      shownAt: new Date(),
    },
  });
}

export async function dismissOffer(offerId: string, sessionId: string): Promise<void> {
  await prisma.salesAgentOffer.updateMany({
    where: { id: offerId, sessionId },
    data: { status: SalesOfferStatus.DISMISSED },
  });
  await cancelPendingEmailsForOffer(offerId);
}

export async function markSalesOffersConverted(input: {
  userId?: string;
  visitorId?: string;
  sessionId?: string;
}): Promise<void> {
  const orConditions: Prisma.SalesAgentOfferWhereInput[] = [];
  if (input.userId) orConditions.push({ userId: input.userId });
  if (input.visitorId) orConditions.push({ visitorId: input.visitorId });
  if (input.sessionId) orConditions.push({ sessionId: input.sessionId });
  if (orConditions.length === 0) return;

  const openOffers = await prisma.salesAgentOffer.findMany({
    where: {
      OR: orConditions,
      status: {
        notIn: [SalesOfferStatus.CONVERTED, SalesOfferStatus.DISMISSED],
      },
    },
    select: { id: true },
  });

  await prisma.salesAgentOffer.updateMany({
    where: {
      OR: orConditions,
      status: {
        notIn: [SalesOfferStatus.CONVERTED, SalesOfferStatus.DISMISSED],
      },
    },
    data: { status: SalesOfferStatus.CONVERTED },
  });

  await Promise.all(
    openOffers.map((offer) =>
      cancelPendingEmailsForOffer(offer.id)
    )
  );
  
  await markProfilesConverted(input);
}

export function scheduleSalesOfferConversion(input: {
  userId?: string;
  visitorId?: string;
  sessionId?: string;
}): void {
  void markSalesOffersConverted(input).catch((error) => {
    sentryTracker(error, { source: "salesOfferService.conversion" });
  });
}

export async function fetchSalesAgentSummary(start: Date, end: Date) {
  const [
    offersGenerated,
    emailsSent,
    offersShown,
    offersConverted,
    avgScore,
    emailsQueued,
    emailsFailed,
  ] = await Promise.all([
    prisma.salesAgentOffer.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.salesAgentOffer.count({
      where: {
        createdAt: { gte: start, lte: end },
        emailSentAt: { not: null },
      },
    }),
    prisma.salesAgentOffer.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: SalesOfferStatus.SHOWN,
      },
    }),
    prisma.salesAgentOffer.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: SalesOfferStatus.CONVERTED,
      },
    }),
    prisma.salesAgentOffer.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _avg: { intentScore: true },
    }),
    prisma.salesEmailJob.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.salesEmailJob.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: SalesEmailJobStatus.FAILED,
      },
    }),
  ]);

  return {
    offersGenerated,
    emailsSent,
    offersShown,
    offersConverted,
    avgIntentScore: Math.round(avgScore._avg.intentScore ?? 0),
    emailsQueued,
    emailsFailed,
  };
}
