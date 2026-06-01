import type { ChatHistoryMessage } from "../types";
import {
  appendSessionMessages,
  getSessionMessages,
  type StoredChatMessage,
} from "./sessionMemoryStore";

export async function loadSessionHistory(
  sessionId?: string,
): Promise<ChatHistoryMessage[]> {
  if (!sessionId) return [];

  const messages = await getSessionMessages(sessionId);
  return messages.map(({ role, content }) => ({ role, content }));
}

export async function persistSessionTurn(input: {
  sessionId?: string;
  userId?: string;
  userMessage: string;
  assistantReply: string;
}): Promise<StoredChatMessage[]> {
  if (!input.sessionId) return [];

  return appendSessionMessages(
    input.sessionId,
    [
      { role: "user", content: input.userMessage },
      { role: "assistant", content: input.assistantReply },
    ],
    input.userId,
  );
}

export function mergeSessionHistory(
  serverHistory: ChatHistoryMessage[],
  clientHistory: ChatHistoryMessage[] = [],
): ChatHistoryMessage[] {
  if (serverHistory.length === 0) {
    return clientHistory.slice(-12);
  }
  if (clientHistory.length === 0) {
    return serverHistory.slice(-12);
  }

  const merged = [...serverHistory];
  const seen = new Set(
    serverHistory.map((message) => `${message.role}:${message.content}`),
  );

  for (const message of clientHistory) {
    const key = `${message.role}:${message.content}`;
    if (!seen.has(key)) {
      merged.push(message);
      seen.add(key);
    }
  }

  return merged.slice(-12);
}
