const sessionFindUnique = jest.fn();
const sessionUpsert = jest.fn();
const sessionUpdateMany = jest.fn();
const createSupportTicket = jest.fn();
const appendSupportTicketMessage = jest.fn();
const findOpenSupportTicket = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    aiChatSession: {
      findUnique: (...a: unknown[]) => sessionFindUnique(...a),
      upsert: (...a: unknown[]) => sessionUpsert(...a),
      updateMany: (...a: unknown[]) => sessionUpdateMany(...a),
    },
  },
}));
jest.mock("../SupportTicketService", () => ({
  createSupportTicket: (...a: unknown[]) => createSupportTicket(...a),
  appendSupportTicketMessage: (...a: unknown[]) => appendSupportTicketMessage(...a),
  findOpenSupportTicket: (...a: unknown[]) => findOpenSupportTicket(...a),
}));

import {
  getSessionFailureCount,
  handleOpenTicketMessage,
  incrementSessionFailureCount,
  resetSessionFailureCount,
  runHumanHandoffChat,
  shouldEscalateToHuman,
} from "../HandoffService";

const ticket = { id: "abcdef12-3456", status: "OPEN" };

beforeEach(() => jest.clearAllMocks());

describe("session failure counters", () => {
  it("are no-ops without a session", async () => {
    await expect(getSessionFailureCount()).resolves.toBe(0);
    await expect(incrementSessionFailureCount()).resolves.toBe(0);
    await resetSessionFailureCount();
    expect(sessionFindUnique).not.toHaveBeenCalled();
    expect(sessionUpsert).not.toHaveBeenCalled();
    expect(sessionUpdateMany).not.toHaveBeenCalled();
  });

  it("reads, increments and resets", async () => {
    sessionFindUnique.mockResolvedValueOnce(null);
    await expect(getSessionFailureCount("s1")).resolves.toBe(0);
    sessionUpsert.mockResolvedValueOnce({ failureCount: 2 });
    await expect(incrementSessionFailureCount("s1")).resolves.toBe(2);
    expect(sessionUpsert.mock.calls[0][0]).toMatchObject({ create: { id: "s1", failureCount: 1 }, update: { failureCount: { increment: 1 } } });
    await resetSessionFailureCount("s1");
    expect(sessionUpdateMany).toHaveBeenCalledWith({ where: { id: "s1" }, data: { failureCount: 0 } });
  });
});

describe("shouldEscalateToHuman", () => {
  it("escalates on an explicit request", async () => {
    await expect(shouldEscalateToHuman({ message: "I want to talk to a human agent" })).resolves.toEqual({
      escalate: true,
      reason: "user_request",
    });
  });

  it("escalates after repeated failures", async () => {
    sessionFindUnique.mockResolvedValueOnce({ failureCount: 3 });
    await expect(shouldEscalateToHuman({ message: "hmm", sessionId: "s1" })).resolves.toEqual({
      escalate: true,
      reason: "repeated_failure",
    });
  });

  it("does not escalate otherwise", async () => {
    sessionFindUnique.mockResolvedValueOnce({ failureCount: 2 });
    await expect(shouldEscalateToHuman({ message: "show me laptops", sessionId: "s1" })).resolves.toEqual({ escalate: false });
  });
});

describe("runHumanHandoffChat", () => {
  it("appends to an existing open ticket", async () => {
    findOpenSupportTicket.mockResolvedValueOnce(ticket);
    appendSupportTicketMessage.mockResolvedValueOnce(ticket);
    const result = await runHumanHandoffChat({ message: "still broken", userId: "u1", sessionId: "s1", reason: "user_request" });
    expect(appendSupportTicketMessage).toHaveBeenCalledWith(ticket.id, { role: "user", content: "still broken" });
    expect(createSupportTicket).not.toHaveBeenCalled();
    expect(result.supportTicket).toEqual({ id: ticket.id, status: "OPEN" });
  });

  it("opens a new ticket with context and resets the failure counter", async () => {
    findOpenSupportTicket.mockResolvedValueOnce(null);
    createSupportTicket.mockResolvedValueOnce(ticket);
    const result = await runHumanHandoffChat({ message: "refund please", sessionId: "s1", reason: "repeated_failure" });
    const initial = createSupportTicket.mock.calls[0][0].initialMessages;
    expect(initial[0]).toMatchObject({ role: "system", content: "Escalated to human support (repeated_failure)." });
    expect(initial[1]).toMatchObject({ role: "user", content: "refund please" });
    expect(sessionUpdateMany).toHaveBeenCalledWith({ where: { id: "s1" }, data: { failureCount: 0 } });
    expect(result.reply).toContain("abcdef12");
    expect(result.reply).toContain("trouble helping");
  });
});

describe("handleOpenTicketMessage", () => {
  it("returns null with no open ticket", async () => {
    findOpenSupportTicket.mockResolvedValueOnce(null);
    await expect(handleOpenTicketMessage({ message: "hi" })).resolves.toBeNull();
  });

  it("adds the message to the open ticket", async () => {
    findOpenSupportTicket.mockResolvedValueOnce(ticket);
    appendSupportTicketMessage.mockResolvedValueOnce(ticket);
    const result = await handleOpenTicketMessage({ message: "any update?", sessionId: "s1" });
    expect(result?.classifiedIntent).toBe("HUMAN_HANDOFF");
    expect(result?.reply).toContain("added that to your support ticket");
  });
});
