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
  ownerId: string | null;
  expiresAt: number;
};

type SessionRecord = {
  messages: StoredChatMessage[];
  ownerId: string | null;
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
// TODO: return type here
function trimMessages(messages: StoredChatMessage[]): StoredChatMessage[] {
  return messages.slice(-MAX_SESSION_MESSAGES);
}

function cacheSession(sessionId: string, record: SessionRecord): void {
  pruneCache();
  memoryCache.set(sessionId, {
    ...record,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

function readCache(sessionId: string): SessionRecord | null {
  const entry = memoryCache.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(sessionId);
    return null;
  }
  return { messages: entry.messages, ownerId: entry.ownerId };
}

/**
 * A session that belongs to a signed-in user is private to that user.
 * Guest sessions (no owner) stay usable by whoever holds the id.
 */
export function canAccessSession(ownerId: string | null, requesterId?: string): boolean {
  return ownerId === null || ownerId === requesterId;
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

async function getSessionRecord(sessionId: string): Promise<SessionRecord> {
  const cached = readCache(sessionId);
  if (cached) return cached;

  const row = await prisma.aiChatSession.findUnique({
    where: { id: sessionId },
    select: { messages: true, userId: true },
  });
  const record = {
    messages: trimMessages(parseStoredMessages(row?.messages)),
    ownerId: row?.userId ?? null,
  };
  cacheSession(sessionId, record);
  return record;
}

export async function getSessionMessages(
  sessionId: string,
  requesterId?: string,
): Promise<StoredChatMessage[]> {
  const record = await getSessionRecord(sessionId);
  return canAccessSession(record.ownerId, requesterId) ? record.messages : [];
}

export async function appendSessionMessages(
  sessionId: string,
  newMessages: ChatHistoryMessage[],
  userId?: string,
): Promise<StoredChatMessage[]> {
  const existing = await getSessionRecord(sessionId);
  // Never write into (or re-assign) another user's session.
  if (!canAccessSession(existing.ownerId, userId)) {
    return [];
  }
  const merged = trimMessages([...existing.messages, ...toStoredMessages(newMessages)]);

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

  cacheSession(sessionId, { messages: merged, ownerId: existing.ownerId ?? userId ?? null });
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
