import { prisma } from "../../../lib/prisma";
import type { AssistantChatIntent } from "../types";

const CONVERSION_ATTRIBUTION_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function logAiConversation(input: {
  userId?: string;
  query: string;
  intent: AssistantChatIntent | string;
}): Promise<void> {
  await prisma.aiConversationLog.create({
    data: {
      userId: input.userId ?? null,
      query: input.query.trim().slice(0, 2000),
      intent: input.intent,
    },
  });
}

export function scheduleAiConversationLog(input: {
  userId?: string;
  query: string;
  intent: AssistantChatIntent | string;
}): void {
  void logAiConversation(input).catch((error) => {
    console.error("[ai-analytics] Failed to log conversation", error);
  });
}

export async function markAiChatConversionsForUser(userId: string): Promise<void> {
  const windowStart = new Date(Date.now() - CONVERSION_ATTRIBUTION_WINDOW_MS);

  await prisma.aiConversationLog.updateMany({
    where: {
      userId,
      convertedToOrder: false,
      createdAt: { gte: windowStart },
    },
    data: { convertedToOrder: true },
  });
}

export function scheduleAiChatConversion(userId: string): void {
  void markAiChatConversionsForUser(userId).catch((error) => {
    console.error("[ai-analytics] Failed to mark chat conversion", error);
  });
}
