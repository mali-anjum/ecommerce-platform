import { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { sentryTracker } from "../../lib/monitoring";

export type AnalyticsEventMetadata = Record<string, unknown>;

export type LogAnalyticsEventInput = {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  metadata?: AnalyticsEventMetadata;
};

export class AnalyticsEventService {
  async log(input: LogAnalyticsEventInput): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  schedule(input: LogAnalyticsEventInput): void {
    void this.log(input).catch((error) => {
      sentryTracker(error, { source: "analyticsEventService" });
      console.error("[analytics-event] Failed to log event", error);
    });
  }
}

export const analyticsEventService = new AnalyticsEventService();

export const logAnalyticsEvent = (input: LogAnalyticsEventInput) =>
  analyticsEventService.log(input);

export const scheduleAnalyticsEvent = (input: LogAnalyticsEventInput) =>
  analyticsEventService.schedule(input);
