const leadCreate = jest.fn();
const leadFindMany = jest.fn();
const leadCount = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    lead: {
      create: (...a: unknown[]) => leadCreate(...a),
      findMany: (...a: unknown[]) => leadFindMany(...a),
      count: (...a: unknown[]) => leadCount(...a),
    },
  },
}));

import { countLeadsBySource, createLead, listLeads } from "../leadService";

beforeEach(() => jest.clearAllMocks());

describe("leadService", () => {
  it("normalises email, blank phone and message; defaults source to AI", async () => {
    await createLead({ email: "  Ann@Example.COM ", phone: "   ", message: "  Hi  " });
    expect(leadCreate).toHaveBeenCalledWith({
      data: { email: "ann@example.com", phone: null, message: "Hi", source: "AI" },
    });
  });

  it("keeps an explicit source and phone", async () => {
    await createLead({ email: "a@b.co", phone: " +1 555 ", message: "x", source: "MANUAL" as never });
    expect(leadCreate.mock.calls[0][0].data).toMatchObject({ phone: "+1 555", source: "MANUAL" });
  });

  it("filters the list by source", async () => {
    await listLeads({ source: "MANUAL" as never });
    expect(leadFindMany).toHaveBeenCalledWith({ where: { source: "MANUAL" }, orderBy: { createdAt: "desc" } });
    await listLeads();
    expect(leadFindMany.mock.calls[1][0].where).toBeUndefined();
  });

  it("counts per source and in total", async () => {
    leadCount.mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(5);
    await expect(countLeadsBySource()).resolves.toEqual({ ai: 3, manual: 2, total: 5 });
  });
});
