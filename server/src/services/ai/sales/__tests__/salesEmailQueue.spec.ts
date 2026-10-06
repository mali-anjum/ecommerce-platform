jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    salesEmailJob: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    salesAgentOffer: { findUnique: jest.fn(), update: jest.fn() },
  },
}));
jest.mock("../../../../config/email", () => ({ isEmailConfigured: jest.fn(), sendTransactionalEmail: jest.fn() }));
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { prisma } from "../../../../lib/prisma";
import { isEmailConfigured, sendTransactionalEmail } from "../../../../config/email";
import {
  cancelPendingEmailsForOffer,
  enqueueSalesEmailSequence,
  processDueSalesEmailJobs,
} from "../SalesEmailQueueService";

const jobs = prisma.salesEmailJob as unknown as Record<string, jest.Mock>;
const offers = prisma.salesAgentOffer as unknown as Record<string, jest.Mock>;
const send = sendTransactionalEmail as jest.Mock;

const payload = { intentSummary: "Likes laptops", couponCode: "SAVE-1", discountPercent: 10, productNames: ["Mac"] };
const NOW = new Date("2026-03-15T12:00:00Z");

function job(overrides: Record<string, unknown> = {}) {
  return { id: "j1", offerId: "o1", toEmail: "a@b.co", attempts: 0, scheduledAt: NOW, payload, ...overrides };
}

describe("SalesEmailQueueService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: NOW, doNotFake: ["setImmediate", "nextTick"] });
    (isEmailConfigured as jest.Mock).mockReturnValue(true);
    jobs.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("enqueueSalesEmailSequence", () => {
    it("skips low-intent visitors", async () => {
      await enqueueSalesEmailSequence({ offerId: "o1", toEmail: "a@b.co", intentScore: 49, payload });
      expect(jobs.create).not.toHaveBeenCalled();
    });

    it("schedules the 4-step drip with normalized email and delays", async () => {
      jobs.findFirst.mockResolvedValue(null);
      await enqueueSalesEmailSequence({ offerId: "o1", toEmail: " Ann@X.IO ", intentScore: 50, payload });

      expect(jobs.create).toHaveBeenCalledTimes(4);
      const created = jobs.create.mock.calls.map((c) => c[0].data);
      expect(created.map((d) => d.jobType)).toEqual(["FOLLOW_UP_IMMEDIATE", "FOLLOW_UP_1H", "FOLLOW_UP_24H", "FOLLOW_UP_72H"]);
      expect(created.every((d) => d.toEmail === "ann@x.io")).toBe(true);
      expect(created[0].scheduledAt).toEqual(NOW);
      expect(created[1].scheduledAt).toEqual(new Date(NOW.getTime() + 3_600_000));
      expect(created[0].payload.dripLabel).toBeUndefined();
      expect(created[3].payload.dripLabel).toMatch(/Last chance/);
    });

    it("does not duplicate jobs that already exist (idempotent)", async () => {
      jobs.findFirst.mockResolvedValueOnce({ id: "existing" }).mockResolvedValue(null);
      await enqueueSalesEmailSequence({ offerId: "o1", toEmail: "a@b.co", intentScore: 90, payload });
      expect(jobs.create).toHaveBeenCalledTimes(3);
    });
  });

  it("cancels only pending jobs for an offer", async () => {
    await cancelPendingEmailsForOffer("o1");
    expect(jobs.updateMany).toHaveBeenCalledWith({ where: { offerId: "o1", status: "PENDING" }, data: { status: "CANCELLED" } });
  });

  describe("processDueSalesEmailJobs", () => {
    it("does nothing when email is not configured", async () => {
      (isEmailConfigured as jest.Mock).mockReturnValue(false);
      await expect(processDueSalesEmailJobs()).resolves.toBe(0);
      expect(jobs.findMany).not.toHaveBeenCalled();
    });

    it("sends, marks SENT, and moves a PENDING offer to EMAIL_SENT", async () => {
      jobs.findMany.mockResolvedValue([job()]);
      offers.findUnique.mockResolvedValue({ emailSentAt: null, status: "PENDING" });

      await expect(processDueSalesEmailJobs(5)).resolves.toBe(1);

      expect(jobs.findMany.mock.calls[0][0]).toMatchObject({ where: { status: "PENDING", scheduledAt: { lte: NOW } }, take: 5 });
      expect(jobs.updateMany).toHaveBeenCalledWith({ where: { id: "j1", status: "PENDING" }, data: { status: "PROCESSING" } });
      expect(send.mock.calls[0][0]).toMatchObject({ to: "a@b.co", subject: "A personalized offer just for you" });
      expect(send.mock.calls[0][0].text).toContain("Use code SAVE-1 for 10% off.");
      expect(jobs.update.mock.calls[0][0].data).toMatchObject({ status: "SENT", attempts: { increment: 1 } });
      expect(offers.update.mock.calls[0][0].data.status).toBe("EMAIL_SENT");
    });

    it("keeps a SHOWN offer status and skips the update when already emailed", async () => {
      jobs.findMany.mockResolvedValue([job({ payload: { ...payload, dripLabel: "Reminder" } }), job({ id: "j2" })]);
      offers.findUnique
        .mockResolvedValueOnce({ emailSentAt: null, status: "SHOWN" })
        .mockResolvedValueOnce({ emailSentAt: NOW, status: "EMAIL_SENT" });

      await expect(processDueSalesEmailJobs()).resolves.toBe(2);
      expect(send.mock.calls[0][0].subject).toMatch(/Still thinking/);
      expect(offers.update).toHaveBeenCalledTimes(1);
      expect(offers.update.mock.calls[0][0].data.status).toBe("SHOWN");
    });

    it("skips jobs another worker already claimed", async () => {
      jobs.findMany.mockResolvedValue([job()]);
      jobs.updateMany.mockResolvedValue({ count: 0 });
      await expect(processDueSalesEmailJobs()).resolves.toBe(0);
      expect(send).not.toHaveBeenCalled();
    });

    it("reschedules a failed send in 15 minutes, then fails permanently at max attempts", async () => {
      send.mockRejectedValue(new Error("smtp down"));
      jobs.findMany.mockResolvedValue([job({ attempts: 0 }), job({ id: "j2", attempts: 2 })]);

      await expect(processDueSalesEmailJobs()).resolves.toBe(0);

      const [retry, final] = jobs.update.mock.calls.map((c) => c[0].data);
      expect(retry).toMatchObject({ attempts: 1, status: "PENDING", lastError: "smtp down" });
      expect(retry.scheduledAt).toEqual(new Date(NOW.getTime() + 15 * 60_000));
      expect(final).toMatchObject({ attempts: 3, status: "FAILED", scheduledAt: NOW });
    });
  });
});
