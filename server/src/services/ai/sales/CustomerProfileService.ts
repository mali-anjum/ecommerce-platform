import {
  SalesCustomerSegment,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type { BehaviorSignals } from "./types";
import { resolveCustomerSegment } from "./SalesDecisionService";

export async function upsertSalesCustomerProfile(input: {
  signals: BehaviorSignals;
  intentScore: number;
  email?: string | null;
}): Promise<void> {
  const segment = resolveCustomerSegment(input.signals, input.intentScore);
  const email = input.email ?? input.signals.email ?? null;
  const now = new Date();

  const data: Prisma.SalesCustomerProfileUncheckedCreateInput = {
    visitorId: input.signals.visitorId ?? null,
    userId: input.signals.userId ?? null,
    email,
    segment,
    intentScore: input.intentScore,
    sessionId: input.signals.sessionId,
    lastSeenAt: now,
  };

  if (input.signals.visitorId) {
    await prisma.salesCustomerProfile.upsert({
      where: { visitorId: input.signals.visitorId },
      create: data,
      update: {
        userId: input.signals.userId ?? undefined,
        email: email ?? undefined,
        segment,
        intentScore: input.intentScore,
        sessionId: input.signals.sessionId,
        lastSeenAt: now,
      },
    });
    return;
  }

  if (input.signals.userId) {
    await prisma.salesCustomerProfile.upsert({
      where: { userId: input.signals.userId },
      create: data,
      update: {
        email: email ?? undefined,
        segment,
        intentScore: input.intentScore,
        sessionId: input.signals.sessionId,
        lastSeenAt: now,
      },
    });
  }
}

export async function attachEmailToProfile(input: {
  sessionId: string;
  visitorId?: string;
  userId?: string;
  email: string;
}): Promise<void> {
  const normalized = input.email.trim().toLowerCase();
  const orConditions: Prisma.SalesCustomerProfileWhereInput[] = [
    { sessionId: input.sessionId },
  ];
  if (input.visitorId) orConditions.push({ visitorId: input.visitorId });
  if (input.userId) orConditions.push({ userId: input.userId });

  const existing = await prisma.salesCustomerProfile.findFirst({
    where: { OR: orConditions },
  });

  if (existing) {
    await prisma.salesCustomerProfile.update({
      where: { id: existing.id },
      data: { email: normalized, lastSeenAt: new Date() },
    });
    return;
  }

  await prisma.salesCustomerProfile.create({
    data: {
      visitorId: input.visitorId ?? null,
      userId: input.userId ?? null,
      email: normalized,
      sessionId: input.sessionId,
      lastSeenAt: new Date(),
    },
  });
}

export async function incrementProfileOfferCount(input: {
  visitorId?: string;
  userId?: string;
}): Promise<void> {
  const where: Prisma.SalesCustomerProfileWhereInput = input.visitorId
    ? { visitorId: input.visitorId }
    : input.userId
      ? { userId: input.userId }
      : {};

  if (!input.visitorId && !input.userId) return;

  await prisma.salesCustomerProfile.updateMany({
    where,
    data: { offerCount: { increment: 1 } },
  });
}

export async function markProfilesConverted(input: {
  userId?: string;
  visitorId?: string;
  sessionId?: string;
}): Promise<void> {
  const orConditions: Prisma.SalesCustomerProfileWhereInput[] = [];
  if (input.userId) orConditions.push({ userId: input.userId });
  if (input.visitorId) orConditions.push({ visitorId: input.visitorId });
  if (input.sessionId) orConditions.push({ sessionId: input.sessionId });
  if (orConditions.length === 0) return;

  await prisma.salesCustomerProfile.updateMany({
    where: { OR: orConditions },
    data: {
      segment: SalesCustomerSegment.CONVERTED,
      intentScore: 100,
      lastSeenAt: new Date(),
    },
  });
}

export async function fetchSegmentBreakdown(start: Date, end: Date) {
  const groups = await prisma.salesCustomerProfile.groupBy({
    by: ["segment"],
    where: { lastSeenAt: { gte: start, lte: end } },
    _count: { segment: true },
    orderBy: { _count: { segment: "desc" } },
  });

  return groups.map((group) => ({
    segment: group.segment,
    count: group._count.segment,
  }));
}
