jest.mock("../../../lib/prisma", () => ({
  prisma: {
    aiConversationLog: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../../lib/prisma";
import {
  logAiConversation,
  markAiChatConversionsForUser,
} from "../conversationLogService";

const mockCreate = prisma.aiConversationLog.create as jest.Mock;
const mockUpdateMany = prisma.aiConversationLog.updateMany as jest.Mock;

describe("conversationLogService", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdateMany.mockReset();
  });

  it("persists conversation logs", async () => {
    mockCreate.mockResolvedValue({ id: "log-1" });

    await logAiConversation({
      userId: "user-1",
      query: "Show me laptops",
      intent: "product_recommendation",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        query: "Show me laptops",
        intent: "product_recommendation",
      },
    });
  });

  it("marks recent logs as converted for a user", async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 });

    await markAiChatConversionsForUser("user-1");

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          convertedToOrder: false,
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
        data: { convertedToOrder: true },
      }),
    );
  });
});
