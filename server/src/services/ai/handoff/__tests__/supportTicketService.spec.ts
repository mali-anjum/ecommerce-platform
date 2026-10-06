const ticketFindUnique = jest.fn();
const ticketFindFirst = jest.fn();
const ticketFindMany = jest.fn();
const ticketCreate = jest.fn();
const ticketUpdate = jest.fn();
const sessionUpsert = jest.fn();
const sessionFindUnique = jest.fn();
const sessionUpdateMany = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    supportTicket: {
      findUnique: (...a: unknown[]) => ticketFindUnique(...a),
      findFirst: (...a: unknown[]) => ticketFindFirst(...a),
      findMany: (...a: unknown[]) => ticketFindMany(...a),
      create: (...a: unknown[]) => ticketCreate(...a),
      update: (...a: unknown[]) => ticketUpdate(...a),
    },
    aiChatSession: {
      upsert: (...a: unknown[]) => sessionUpsert(...a),
      findUnique: (...a: unknown[]) => sessionFindUnique(...a),
      updateMany: (...a: unknown[]) => sessionUpdateMany(...a),
    },
  },
}));

import {
  addAgentReply,
  closeSupportTicket,
  createSupportTicket,
  findOpenSupportTicket,
  listSupportTickets,
} from "../SupportTicketService";
import { NotFoundError } from "../../../../utils/ApiError";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  userId: "u1",
  sessionId: "s1",
  status: "OPEN",
  messages: [{ role: "user", content: "Help", createdAt: "2026-01-01T00:00:00.000Z" }, { bad: true }, "junk"],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("SupportTicketService", () => {
  it("serialises tickets and drops malformed messages", async () => {
    ticketFindMany.mockResolvedValueOnce([row()]);
    const [ticket] = await listSupportTickets();
    expect(ticket).toEqual({
      id: "t1",
      userId: "u1",
      sessionId: "s1",
      status: "OPEN",
      messages: [{ role: "user", content: "Help", createdAt: "2026-01-01T00:00:00.000Z" }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(ticketFindMany.mock.calls[0][0]).toEqual({ where: undefined, orderBy: { updatedAt: "desc" }, take: 100 });
  });

  it("filters by status", async () => {
    ticketFindMany.mockResolvedValueOnce([]);
    await listSupportTickets("CLOSED" as never);
    expect(ticketFindMany.mock.calls[0][0].where).toEqual({ status: "CLOSED" });
  });

  it("creates a ticket and links it to the chat session", async () => {
    ticketCreate.mockResolvedValueOnce(row());
    await createSupportTicket({ userId: "u1", sessionId: "s1", initialMessages: [] });
    expect(sessionUpsert.mock.calls[0][0]).toMatchObject({
      where: { id: "s1" },
      create: { id: "s1", userId: "u1", openTicketId: "t1" },
      update: { openTicketId: "t1", userId: "u1" },
    });
  });

  it("creates a guest ticket without a session link", async () => {
    ticketCreate.mockResolvedValueOnce(row({ userId: null, sessionId: null }));
    await createSupportTicket({ initialMessages: [] });
    expect(ticketCreate.mock.calls[0][0].data).toMatchObject({ userId: null, sessionId: null });
    expect(sessionUpsert).not.toHaveBeenCalled();
  });

  it("finds the open ticket via the session first, then the user", async () => {
    sessionFindUnique.mockResolvedValueOnce({ openTicketId: "t1" });
    ticketFindFirst.mockResolvedValueOnce(row());
    await expect(findOpenSupportTicket({ sessionId: "s1", userId: "u1" })).resolves.toMatchObject({ id: "t1" });
    expect(ticketFindFirst.mock.calls[0][0].where).toEqual({ id: "t1", status: "OPEN" });

    sessionFindUnique.mockResolvedValueOnce({ openTicketId: null });
    ticketFindFirst.mockResolvedValueOnce(row({ id: "t2" }));
    await expect(findOpenSupportTicket({ sessionId: "s1", userId: "u1" })).resolves.toMatchObject({ id: "t2" });
  });

  it("returns null with nothing to look up", async () => {
    await expect(findOpenSupportTicket({})).resolves.toBeNull();
  });

  it("appends an agent reply", async () => {
    ticketFindUnique.mockResolvedValueOnce(row({ messages: [] }));
    ticketUpdate.mockImplementationOnce(async ({ data }) => row({ messages: data.messages }));
    const ticket = await addAgentReply("t1", "We are on it");
    expect(ticket.messages).toHaveLength(1);
    expect(ticket.messages[0]).toMatchObject({ role: "agent", content: "We are on it" });
  });

  it("throws NotFoundError when replying to a missing ticket", async () => {
    ticketFindUnique.mockResolvedValueOnce(null);
    await expect(addAgentReply("nope", "hi")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("closes a ticket and releases the session", async () => {
    ticketUpdate.mockResolvedValueOnce(row({ status: "CLOSED" }));
    await closeSupportTicket("t1");
    expect(ticketUpdate).toHaveBeenCalledWith({ where: { id: "t1" }, data: { status: "CLOSED" } });
    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: { id: "s1", openTicketId: "t1" },
      data: { openTicketId: null, failureCount: 0 },
    });
  });
});
