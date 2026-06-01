import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type { ChatHistoryMessage } from "../types";

export type StoredChatMessage = ChatHistoryMessage & {
  createdAt: string;
};

const MAX_SESSION_MESSAGES = 24;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = {
  messages: StoredChatMessage[];
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

function trimMessages(messages: StoredChatMessage[]): StoredChatMessage[] {
  return messages.slice(-MAX_SESSION_MESSAGES);
}

function cacheMessages(sessionId: string, messages: StoredChatMessage[]): void {
  pruneCache();
  memoryCache.set(sessionId, {
    messages,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

function readCache(sessionId: string): StoredChatMessage[] | null {
  const entry = memoryCache.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(sessionId);
    return null;
  }
  return entry.messages;
}

function toStoredMessages(messages: ChatHistoryMessage[]): StoredChatMessage[] {
  const now = new Date().toISOString();
  return messages.map((message) => ({ ...message, createdAt: now }));
}

function parseStoredMessages(raw: unknown): StoredChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is StoredChatMessage =>
        typeof item === "object" &&
        item !== null &&
        (item as StoredChatMessage).role !== undefined &&
        typeof (item as StoredChatMessage).content === "string",
    )
    .map((item) => ({
      role: item.role,
      content: item.content,
      createdAt:
        typeof item.createdAt === "string"
          ? item.createdAt
          : new Date().toISOString(),
    }));
}

export async function getSessionMessages(
  sessionId: string,
): Promise<StoredChatMessage[]> {
  const cached = readCache(sessionId);
  if (cached) return cached;

  const row = await prisma.aiChatSession.findUnique({
    where: { id: sessionId },
    select: { messages: true },
  });
  const messages = trimMessages(parseStoredMessages(row?.messages));
  cacheMessages(sessionId, messages);
  return messages;
}

export async function appendSessionMessages(
  sessionId: string,
  newMessages: ChatHistoryMessage[],
  userId?: string,
): Promise<StoredChatMessage[]> {
  const existing = await getSessionMessages(sessionId);
  const merged = trimMessages([...existing, ...toStoredMessages(newMessages)]);

  await prisma.aiChatSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      userId: userId ?? null,
      messages: merged as Prisma.InputJsonValue,
    },
    update: {
      ...(userId ? { userId } : {}),
      messages: merged as Prisma.InputJsonValue,
    },
  });

  cacheMessages(sessionId, merged);
  return merged;
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  memoryCache.delete(sessionId);
  await prisma.aiChatSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      userId: null,
      messages: [] as Prisma.InputJsonValue,
    },
    update: { messages: [] as Prisma.InputJsonValue },
  });
}

export function clearSessionMemoryCacheForTests(): void {
  memoryCache.clear();
}
