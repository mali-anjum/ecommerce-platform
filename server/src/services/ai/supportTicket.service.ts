import type { Prisma, SupportTicketStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type SupportTicketMessage = {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  createdAt: string;
};

export type SupportTicketRecord = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  status: SupportTicketStatus;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
};

function parseMessages(raw: unknown): SupportTicketMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SupportTicketMessage =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as SupportTicketMessage).role === "string" &&
      typeof (item as SupportTicketMessage).content === "string",
  );
}

function serializeTicket(ticket: {
  id: string;
  userId: string | null;
  sessionId: string | null;
  status: SupportTicketStatus;
  messages: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SupportTicketRecord {
  return {
    id: ticket.id,
    userId: ticket.userId,
    sessionId: ticket.sessionId,
    status: ticket.status,
    messages: parseMessages(ticket.messages),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export async function appendSupportTicketMessage(
  ticketId: string,
  message: Omit<SupportTicketMessage, "createdAt">,
): Promise<SupportTicketRecord> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    throw new Error("Support ticket not found");
  }

  const messages = [
    ...parseMessages(ticket.messages),
    { ...message, createdAt: new Date().toISOString() },
  ];

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { messages: messages as Prisma.InputJsonValue },
  });

  return serializeTicket(updated);
}

export async function createSupportTicket(input: {
  userId?: string;
  sessionId?: string;
  initialMessages: SupportTicketMessage[];
}): Promise<SupportTicketRecord> {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      messages: input.initialMessages as Prisma.InputJsonValue,
    },
  });

  if (input.sessionId) {
    await prisma.aiChatSession.upsert({
      where: { id: input.sessionId },
      create: {
        id: input.sessionId,
        userId: input.userId ?? null,
        openTicketId: ticket.id,
        messages: [],
      },
      update: {
        openTicketId: ticket.id,
        ...(input.userId ? { userId: input.userId } : {}),
      },
    });
  }

  return serializeTicket(ticket);
}

export async function findOpenSupportTicket(input: {
  userId?: string;
  sessionId?: string;
}): Promise<SupportTicketRecord | null> {
  if (input.sessionId) {
    const session = await prisma.aiChatSession.findUnique({
      where: { id: input.sessionId },
      select: { openTicketId: true },
    });
    if (session?.openTicketId) {
      const ticket = await prisma.supportTicket.findFirst({
        where: { id: session.openTicketId, status: "OPEN" },
      });
      if (ticket) return serializeTicket(ticket);
    }
  }

  if (input.userId) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { userId: input.userId, status: "OPEN" },
      orderBy: { updatedAt: "desc" },
    });
    if (ticket) return serializeTicket(ticket);
  }

  return null;
}

export async function listSupportTickets(
  status?: SupportTicketStatus,
): Promise<SupportTicketRecord[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return tickets.map(serializeTicket);
}

export async function closeSupportTicket(
  ticketId: string,
): Promise<SupportTicketRecord> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "CLOSED" },
  });

  if (ticket.sessionId) {
    await prisma.aiChatSession.updateMany({
      where: { id: ticket.sessionId, openTicketId: ticketId },
      data: { openTicketId: null, failureCount: 0 },
    });
  }

  return serializeTicket(ticket);
}

export async function addAgentReply(
  ticketId: string,
  content: string,
): Promise<SupportTicketRecord> {
  return appendSupportTicketMessage(ticketId, {
    role: "agent",
    content,
  });
}
