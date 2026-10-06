jest.mock("../../../lib/prisma", () => ({
  prisma: {
    order: { findMany: jest.fn(), findFirst: jest.fn() },
    orderItem: { findMany: jest.fn(), count: jest.fn() },
    payment: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
  },
}));

import { prisma } from "../../../lib/prisma";
import {
  fetchAdminTransactionsPage,
  fetchSellerOrderLinesPage,
  findOrderForPublicTracking,
  findOrdersForAdmin,
  findOrdersForUser,
} from "../query";

const p = prisma as unknown as {
  order: { findMany: jest.Mock; findFirst: jest.Mock };
  orderItem: { findMany: jest.Mock; count: jest.Mock };
  payment: { findMany: jest.Mock; count: jest.Mock; aggregate: jest.Mock };
};

const noFilters = {
  pageRaw: undefined,
  limitRaw: undefined,
  searchRaw: undefined,
  methodRaw: undefined,
  statusRaw: undefined,
  fromRaw: undefined,
  toRaw: undefined,
};

describe("order list queries", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    p.payment.findMany.mockResolvedValue([]);
    p.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
  });

  it("scopes buyer history to the user, newest first", async () => {
    p.order.findMany.mockResolvedValue([]);
    await findOrdersForUser("u1");
    expect(p.order.findMany.mock.calls[0][0]).toMatchObject({ where: { userId: "u1" }, orderBy: { createdAt: "desc" } });
  });

  it("admin list includes only a buyer summary (no password hash etc.)", async () => {
    p.order.findMany.mockResolvedValue([]);
    await findOrdersForAdmin();
    expect(p.order.findMany.mock.calls[0][0].include.user).toEqual({ select: { id: true, name: true, email: true } });
  });

  it("public tracking requires both order id and a case-insensitive email match", async () => {
    p.order.findFirst.mockResolvedValue(null);
    await findOrderForPublicTracking("o1", "a@b.co");
    expect(p.order.findFirst.mock.calls[0][0].where).toEqual({
      id: "o1",
      user: { email: { equals: "a@b.co", mode: "insensitive" } },
    });
  });

  it("pages seller order lines scoped to the seller", async () => {
    p.orderItem.findMany.mockResolvedValue([{ id: "i1" }]);
    p.orderItem.count.mockResolvedValue(45);
    const result = await fetchSellerOrderLinesPage("s1", "3", "20");
    expect(p.orderItem.findMany.mock.calls[0][0]).toMatchObject({ where: { sellerId: "s1" }, skip: 40, take: 20 });
    expect(p.orderItem.count).toHaveBeenCalledWith({ where: { sellerId: "s1" } });
    expect(result.meta).toEqual({ page: 3, limit: 20, total: 45, totalPages: 3 });
  });

  describe("fetchAdminTransactionsPage", () => {
    it("applies no filters by default and builds the summary", async () => {
      p.payment.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6) // completed
        .mockResolvedValueOnce(3); // failed
      p.payment.aggregate.mockResolvedValue({ _sum: { amount: 1234.5 } });

      const result = await fetchAdminTransactionsPage(noFilters);

      expect(p.payment.findMany.mock.calls[0][0]).toMatchObject({ where: {}, skip: 0, take: 20 });
      expect(result.summary).toEqual({
        totalTransactions: 10,
        completedCount: 6,
        failedCount: 3,
        pendingCount: 1,
        totalAmount: 1234.5,
      });
      expect(p.payment.count.mock.calls[1][0]).toEqual({ where: { attemptStatus: "COMPLETED" } });
    });

    it("whitelists method/status, normalizes case and ignores unknown values", async () => {
      p.payment.count.mockResolvedValue(0);
      await fetchAdminTransactionsPage({ ...noFilters, methodRaw: " stripe ", statusRaw: "failed" });
      expect(p.payment.findMany.mock.calls[0][0].where).toEqual({ method: "STRIPE", attemptStatus: "FAILED" });

      p.payment.findMany.mockClear();
      await fetchAdminTransactionsPage({ ...noFilters, methodRaw: "BITCOIN", statusRaw: "'; DROP" });
      expect(p.payment.findMany.mock.calls[0][0].where).toEqual({});
    });

    it("builds an inclusive date range and ignores invalid dates", async () => {
      p.payment.count.mockResolvedValue(0);
      await fetchAdminTransactionsPage({ ...noFilters, fromRaw: "2026-01-01", toRaw: "2026-01-31" });
      const { createdAt } = p.payment.findMany.mock.calls[0][0].where;
      expect(createdAt.gte).toEqual(new Date("2026-01-01"));
      expect((createdAt.lte as Date).getHours()).toBe(23);
      expect((createdAt.lte as Date).getMilliseconds()).toBe(999);

      p.payment.findMany.mockClear();
      await fetchAdminTransactionsPage({ ...noFilters, fromRaw: "not-a-date", toRaw: 42 });
      expect(p.payment.findMany.mock.calls[0][0].where.createdAt).toBeUndefined();
    });

    it("searches payment id, provider reference, order id, buyer email and name", async () => {
      p.payment.count.mockResolvedValue(0);
      await fetchAdminTransactionsPage({ ...noFilters, searchRaw: "  alice " });
      const { OR } = p.payment.findMany.mock.calls[0][0].where;
      expect(OR).toHaveLength(5);
      expect(OR[0]).toEqual({ id: { contains: "alice", mode: "insensitive" } });
      expect(OR[3]).toEqual({ order: { user: { email: { contains: "alice", mode: "insensitive" } } } });
    });

    it("never reports a negative pending count and caps the page size", async () => {
      p.payment.count.mockResolvedValueOnce(2).mockResolvedValueOnce(2).mockResolvedValueOnce(2);
      const result = await fetchAdminTransactionsPage({ ...noFilters, limitRaw: "5000", pageRaw: "-3" });
      expect(result.summary.pendingCount).toBe(0);
      expect(result.meta).toMatchObject({ page: 1, limit: 100 });
    });
  });
});
