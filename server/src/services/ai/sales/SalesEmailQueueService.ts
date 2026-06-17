import {
  SalesEmailJobStatus,
  SalesEmailJobType,
  SalesOfferStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { isEmailConfigured, sendTransactionalEmail } from "../../../config/email";
import { sentryTracker } from "../../../lib/monitoring";
import { EMAIL_DRIP_DELAYS_MS, SALES_AGENT_CONSTANTS } from "./types";
import { meetsEmailScoreThreshold } from "./IntentScoringEngine";

export type EmailJobPayload = {
  intentSummary: string;
  couponCode: string | null;
  discountPercent: number | null;
  productNames: string[];
  dripLabel?: string;
};

function scheduleDelay(type: SalesEmailJobType): Date {
  const delayMs = EMAIL_DRIP_DELAYS_MS[type] ?? 0;
  return new Date(Date.now() + delayMs);
}

function buildEmailText(payload: EmailJobPayload): { subject: string; text: string } {
  const discountLine =
    payload.couponCode && payload.discountPercent
      ? `Use code ${payload.couponCode} for ${payload.discountPercent}% off.`
      : "We saved a personalized selection for you.";

  const productLines =
    payload.productNames.length > 0
      ? `\n\nRecommended:\n${payload.productNames.map((name) => `- ${name}`).join("\n")}`
      : "";

  const dripNote = payload.dripLabel ? `\n\n${payload.dripLabel}` : "";

  return {
    subject: payload.dripLabel
      ? "Still thinking it over? Your offer is waiting"
      : "A personalized offer just for you",
    text: [
      "We noticed your interest in our store.",
      payload.intentSummary,
      discountLine,
      productLines,
      dripNote,
      "\n\nComplete your purchase when you're ready!",
    ].join("\n"),
  };
}

export async function enqueueSalesEmailSequence(input: {
  offerId: string;
  toEmail: string;
  intentScore: number;
  payload: EmailJobPayload;
}): Promise<void> {
  if (!meetsEmailScoreThreshold(input.intentScore)) return;

  const normalized = input.toEmail.trim().toLowerCase();
  const types: SalesEmailJobType[] = [
    SalesEmailJobType.FOLLOW_UP_IMMEDIATE,
    SalesEmailJobType.FOLLOW_UP_1H,
    SalesEmailJobType.FOLLOW_UP_24H,
    SalesEmailJobType.FOLLOW_UP_72H,
  ];

  const dripLabels: Partial<Record<SalesEmailJobType, string>> = {
    [SalesEmailJobType.FOLLOW_UP_1H]:
      "Friendly reminder — your personalized discount is still available.",
    [SalesEmailJobType.FOLLOW_UP_24H]:
      "Items you viewed are still in stock. Don't miss your bundle savings.",
    [SalesEmailJobType.FOLLOW_UP_72H]:
      "Last chance — your exclusive offer expires soon.",
  };

  for (const jobType of types) {
    const existing = await prisma.salesEmailJob.findFirst({
      where: {
        offerId: input.offerId,
        toEmail: normalized,
        jobType,
        status: {
          in: [
            SalesEmailJobStatus.PENDING,
            SalesEmailJobStatus.PROCESSING,
            SalesEmailJobStatus.SENT,
          ],
        },
      },
    });
    if (existing) continue;

    await prisma.salesEmailJob.create({
      data: {
        offerId: input.offerId,
        toEmail: normalized,
        jobType,
        scheduledAt: scheduleDelay(jobType),
        payload: {
          ...input.payload,
          dripLabel: dripLabels[jobType],
        },
      },
    });
  }
}

export async function cancelPendingEmailsForOffer(offerId: string): Promise<void> {
  await prisma.salesEmailJob.updateMany({
    where: {
      offerId,
      status: SalesEmailJobStatus.PENDING,
    },
    data: { status: SalesEmailJobStatus.CANCELLED },
  });
}

export async function processDueSalesEmailJobs(limit = 20): Promise<number> {
  if (!isEmailConfigured()) return 0;

  const now = new Date();
  const jobs = await prisma.salesEmailJob.findMany({
    where: {
      status: SalesEmailJobStatus.PENDING,
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    const claimed = await prisma.salesEmailJob.updateMany({
      where: { id: job.id, status: SalesEmailJobStatus.PENDING },
      data: { status: SalesEmailJobStatus.PROCESSING },
    });
    if (claimed.count === 0) continue;

    const payload = job.payload as EmailJobPayload;
    const { subject, text } = buildEmailText(payload);

    try {
      await sendTransactionalEmail({
        to: job.toEmail,
        subject,
        text,
      });

      await prisma.salesEmailJob.update({
        where: { id: job.id },
        data: {
          status: SalesEmailJobStatus.SENT,
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      if (job.offerId) {
        const offer = await prisma.salesAgentOffer.findUnique({
          where: { id: job.offerId },
          select: { emailSentAt: true, status: true },
        });
        if (offer && !offer.emailSentAt) {
          await prisma.salesAgentOffer.update({
            where: { id: job.offerId },
            data: {
              emailSentAt: new Date(),
              status:
                offer.status === SalesOfferStatus.PENDING
                  ? SalesOfferStatus.EMAIL_SENT
                  : offer.status,
            },
          });
        }
      }

      processed += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const message =
        error instanceof Error ? error.message : "Unknown email error";

      await prisma.salesEmailJob.update({
        where: { id: job.id },
        data: {
          attempts,
          lastError: message,
          status:
            attempts >= SALES_AGENT_CONSTANTS.EMAIL_MAX_ATTEMPTS
              ? SalesEmailJobStatus.FAILED
              : SalesEmailJobStatus.PENDING,
          scheduledAt:
            attempts >= SALES_AGENT_CONSTANTS.EMAIL_MAX_ATTEMPTS
              ? job.scheduledAt
              : new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      sentryTracker(error, { source: "salesEmailQueue.process" });
    }
  }

  return processed;
}

let queueTimer: ReturnType<typeof setInterval> | null = null;

export function startSalesEmailQueueProcessor(): void {
  if (queueTimer) return;

  const pollMs = SALES_AGENT_CONSTANTS.EMAIL_QUEUE_POLL_MS;
  queueTimer = setInterval(() => {
    void processDueSalesEmailJobs().catch((error) => {
      sentryTracker(error, { source: "salesEmailQueue.interval" });
    });
  }, pollMs);

  void processDueSalesEmailJobs().catch((error) => {
    sentryTracker(error, { source: "salesEmailQueue.bootstrap" });
  });
}
