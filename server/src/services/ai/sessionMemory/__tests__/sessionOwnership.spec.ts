const findUnique = jest.fn();
const upsert = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    aiChatSession: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      upsert: (...a: unknown[]) => upsert(...a),
    },
  },
}));

import {
  appendSessionMessages,
  canAccessSession,
  clearSessionMemoryCacheForTests,
  getSessionMessages,
} from "../sessionMemoryStore";
import { loadSessionHistory, persistSessionTurn } from "../SessionMemoryService";

const stored = [{ role: "user", content: "Where is order 123?", createdAt: "2026-01-01T00:00:00.000Z" }];

beforeEach(() => {
  jest.clearAllMocks();
  clearSessionMemoryCacheForTests();
});

describe("canAccessSession", () => {
  it("allows guest sessions for anyone and owned sessions only for the owner", () => {
    expect(canAccessSession(null, undefined)).toBe(true);
    expect(canAccessSession(null, "u2")).toBe(true);
    expect(canAccessSession("u1", "u1")).toBe(true);
    expect(canAccessSession("u1", "u2")).toBe(false);
    expect(canAccessSession("u1", undefined)).toBe(false);
  });
});

describe("session ownership", () => {
  it("returns history to the owner", async () => {
    findUnique.mockResolvedValueOnce({ messages: stored, userId: "u1" });
    await expect(getSessionMessages("s1", "u1")).resolves.toEqual(stored);
  });

  it("hides an owned session from other users and guests", async () => {
    findUnique.mockResolvedValueOnce({ messages: stored, userId: "u1" });
    await expect(getSessionMessages("s1", "u2")).resolves.toEqual([]);
    await expect(loadSessionHistory("s1")).resolves.toEqual([]);
  });

  it("refuses to write into another user's session", async () => {
    findUnique.mockResolvedValueOnce({ messages: stored, userId: "u1" });
    const result = await persistSessionTurn({ sessionId: "s1", userId: "u2", userMessage: "hi", assistantReply: "hello" });
    expect(result).toEqual([]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("claims a guest session for the user who continues it", async () => {
    findUnique.mockResolvedValueOnce({ messages: [], userId: null });
    await appendSessionMessages("s1", [{ role: "user", content: "hi" }], "u1");
    expect(upsert.mock.calls[0][0].update).toMatchObject({ userId: "u1" });
    // Cached owner now applies: another user cannot read it.
    await expect(getSessionMessages("s1", "u2")).resolves.toEqual([]);
    await expect(getSessionMessages("s1", "u1")).resolves.toHaveLength(1);
  });

  it("returns nothing without a session id", async () => {
    await expect(loadSessionHistory(undefined, "u1")).resolves.toEqual([]);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
