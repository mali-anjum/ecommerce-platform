import { Prisma } from "@prisma/client";
import type { NextFunction, Response } from "express";

const knowledge = {
  listPublicFaqs: jest.fn(),
  listAllFaqsForAdmin: jest.fn(),
  createFaqItem: jest.fn(),
  updateFaqItem: jest.fn(),
  deleteFaqItem: jest.fn(),
  getStorePolicies: jest.fn(),
  updateStorePolicies: jest.fn(),
};
const tickets = { listSupportTickets: jest.fn(), closeSupportTicket: jest.fn(), addAgentReply: jest.fn() };
const leads = { createLead: jest.fn(), listLeads: jest.fn(), countLeadsBySource: jest.fn() };

jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/knowledge/knowledgeService", () => knowledge);
jest.mock("../../services/ai/handoff/SupportTicketService", () => tickets);
jest.mock("../../services/lead/leadService", () => leads);

import * as faq from "../faqController";
import * as ticketController from "../supportTicketController";
import { getLeads, postLead } from "../leadController";
import { NotFoundError } from "../../utils/ApiError";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: (req: never, res: Response, next: NextFunction) => unknown, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, query: {}, body: {}, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}
const notFound = () => new Prisma.PrismaClientKnownRequestError("x", { code: "P2025", clientVersion: "t" });

beforeEach(() => jest.clearAllMocks());

describe("faqController", () => {
  it("returns public FAQs and policies", async () => {
    knowledge.listPublicFaqs.mockResolvedValueOnce([{ id: "f1" }]);
    const { res } = await run(faq.getPublicFaqs, {});
    expect(res.json.mock.calls[0][0].data).toEqual({ faqs: [{ id: "f1" }] });

    knowledge.getStorePolicies.mockResolvedValueOnce({ id: "default" });
    const policies = await run(faq.getStorePoliciesHandler, {});
    expect(policies.res.json.mock.calls[0][0].data).toEqual({ policies: { id: "default" } });
  });

  it("creates from validated data with 201", async () => {
    knowledge.createFaqItem.mockResolvedValueOnce({ id: "f1" });
    const { res } = await run(faq.createAdminFaq, { validatedData: { question: "Q", answer: "A" } });
    expect(knowledge.createFaqItem).toHaveBeenCalledWith({ question: "Q", answer: "A" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it.each([
    ["updateAdminFaq", faq.updateAdminFaq, knowledge.updateFaqItem],
    ["deleteAdminFaq", faq.deleteAdminFaq, knowledge.deleteFaqItem],
  ])("%s maps a missing row to 404", async (_name, handler, service) => {
    service.mockRejectedValueOnce(notFound());
    const { next } = await run(handler, { params: { id: "f9" }, validatedData: {} });
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it("propagates other database errors instead of hiding them as 404", async () => {
    knowledge.updateFaqItem.mockRejectedValueOnce(new Error("connection lost"));
    const { next } = await run(faq.updateAdminFaq, { params: { id: "f1" }, validatedData: {} });
    expect(next.mock.calls[0][0]).not.toBeInstanceOf(NotFoundError);
    expect(next.mock.calls[0][0].message).toBe("connection lost");
  });

  it("updates store policies", async () => {
    knowledge.updateStorePolicies.mockResolvedValueOnce({ id: "default", shipsInternationally: true });
    await run(faq.updateStorePoliciesHandler, { validatedData: { shipsInternationally: true } });
    expect(knowledge.updateStorePolicies).toHaveBeenCalledWith({ shipsInternationally: true });
  });
});

describe("supportTicketController", () => {
  it.each([
    ["open", "OPEN"],
    ["CLOSED", "CLOSED"],
    ["weird", undefined],
  ])("filters tickets by status=%p", async (status, expected) => {
    tickets.listSupportTickets.mockResolvedValueOnce([]);
    await run(ticketController.getAdminSupportTickets, { query: { status } });
    expect(tickets.listSupportTickets).toHaveBeenCalledWith(expected);
  });

  it("closes a ticket, mapping missing ones to 404", async () => {
    tickets.closeSupportTicket.mockResolvedValueOnce({ id: "t1" });
    const ok = await run(ticketController.closeAdminSupportTicket, { params: { id: "t1" } });
    expect(ok.res.json.mock.calls[0][0].data).toEqual({ ticket: { id: "t1" } });

    tickets.closeSupportTicket.mockRejectedValueOnce(notFound());
    const missing = await run(ticketController.closeAdminSupportTicket, { params: { id: "t9" } });
    expect(missing.next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it("requires a reply message", async () => {
    const { res } = await run(ticketController.replyAdminSupportTicket, { params: { id: "t1" }, body: { message: "   " } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(tickets.addAgentReply).not.toHaveBeenCalled();
  });

  it("adds a trimmed agent reply and 404s for missing tickets", async () => {
    tickets.addAgentReply.mockResolvedValueOnce({ id: "t1" });
    await run(ticketController.replyAdminSupportTicket, { params: { id: "t1" }, body: { message: "  On it " } });
    expect(tickets.addAgentReply).toHaveBeenCalledWith("t1", "On it");

    tickets.addAgentReply.mockRejectedValueOnce(new NotFoundError("Support ticket not found"));
    const { next } = await run(ticketController.replyAdminSupportTicket, { params: { id: "t9" }, body: { message: "x" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });
});

describe("leadController", () => {
  it("captures a lead with AI source unless MANUAL", async () => {
    leads.createLead.mockResolvedValue({ id: "l1" });
    const { res } = await run(postLead, { validatedData: { email: "a@b.co", message: "Hi" } });
    expect(leads.createLead).toHaveBeenCalledWith({ email: "a@b.co", phone: undefined, message: "Hi", source: "AI" });
    expect(res.status).toHaveBeenCalledWith(201);

    await run(postLead, { validatedData: { email: "a@b.co", message: "Hi", source: "MANUAL" } });
    expect(leads.createLead.mock.calls[1][0].source).toBe("MANUAL");
  });

  it("lists leads with counts and an optional valid source filter", async () => {
    leads.listLeads.mockResolvedValue([]);
    leads.countLeadsBySource.mockResolvedValue({ ai: 0, manual: 0, total: 0 });
    await run(getLeads, { query: { source: "manual" } });
    expect(leads.listLeads).toHaveBeenCalledWith({ source: "MANUAL" });
    await run(getLeads, { query: { source: "spam" } });
    expect(leads.listLeads).toHaveBeenLastCalledWith(undefined);
  });
});
