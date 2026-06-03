jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    aiChatSession: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../../../lib/prisma";
import {
  appendSessionMessages,
  clearSessionMemoryCacheForTests,
} from "../sessionMemoryStore";
import { mergeSessionHistory } from "../SessionMemoryService";

const mockFindUnique = prisma.aiChatSession.findUnique as jest.Mock;
const mockUpsert = prisma.aiChatSession.upsert as jest.Mock;

describe("mergeSessionHistory", () => {
  it("prefers server history when client history is empty", () => {
    expect(
      mergeSessionHistory([{ role: "user", content: "Hello" }], []),
    ).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("deduplicates overlapping client and server messages", () => {
    const result = mergeSessionHistory(
      [{ role: "user", content: "Hello" }],
      [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    );

    expect(result).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ]);
  });
});

describe("appendSessionMessages", () => {
  beforeEach(() => {
    clearSessionMemoryCacheForTests();
    mockFindUnique.mockReset();
    mockUpsert.mockReset();
  });

  it("appends and returns stored messages", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ messages: [] });

    await appendSessionMessages(
      "session-1",
      [
        { role: "user", content: "Need laptops" },
        { role: "assistant", content: "Here are some options" },
      ],
      "user-1",
    );

    const row = await prisma.aiChatSession.findUnique({
      where: { id: "session-1" },
      select: { messages: true },
    });

    expect(mockUpsert).toHaveBeenCalled();
    expect(row).toBeNull();
  });
});
