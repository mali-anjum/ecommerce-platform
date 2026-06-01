import {
  createSupportTicket,
  appendSupportTicketMessage,
  findOpenSupportTicket,
  type SupportTicketRecord,
} from "./supportTicket.service";
import {
  isHumanHandoffTrigger,
  REPEATED_FAILURE_THRESHOLD,
} from "./handoffParser";
import { prisma } from "../../lib/prisma";

export type HandoffResult = {
  intent: "human_handoff";
  classifiedIntent: "HUMAN_HANDOFF";
  reply: string;
  products: [];
  productIdsReferenced: [];
  orders: [];
  supportTicket: {
    id: string;
    status: "OPEN" | "CLOSED";
  };
};

export async function getSessionFailureCount(
  sessionId?: string,
): Promise<number> {
  if (!sessionId) return 0;
  const session = await prisma.aiChatSession.findUnique({
    where: { id: sessionId },
    select: { failureCount: true },
  });
  return session?.failureCount ?? 0;
}

export async function incrementSessionFailureCount(
  sessionId?: string,
): Promise<number> {
  if (!sessionId) return 0;

  const session = await prisma.aiChatSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, failureCount: 1 },
    update: { failureCount: { increment: 1 } },
    select: { failureCount: true },
  });

  return session.failureCount;
}

export async function resetSessionFailureCount(sessionId?: string): Promise<void> {
  if (!sessionId) return;
  await prisma.aiChatSession.updateMany({
    where: { id: sessionId },
    data: { failureCount: 0 },
  });
}

function buildHandoffReply(ticketId: string, reason: string): string {
  if (reason === "repeated_failure") {
    return `I'm having trouble helping with that. I've opened support ticket ${ticketId.slice(0, 8)} for a human agent. They'll follow up soon — you can keep messaging here and we'll add it to your ticket.`;
  }

  return `I've connected you with our support team. Ticket ${ticketId.slice(0, 8)} is open — a human agent will respond shortly. You can continue describing your issue here.`;
}

function toHandoffResult(
  ticket: SupportTicketRecord,
  reason: string,
): HandoffResult {
  return {
    intent: "human_handoff",
    classifiedIntent: "HUMAN_HANDOFF",
    reply: buildHandoffReply(ticket.id, reason),
    products: [],
    productIdsReferenced: [],
    orders: [],
    supportTicket: {
      id: ticket.id,
      status: ticket.status,
    },
  };
}

export async function runHumanHandoffChat(input: {
  message: string;
  userId?: string;
  sessionId?: string;
  reason: "user_request" | "repeated_failure";
}): Promise<HandoffResult> {
  const existing = await findOpenSupportTicket({
    userId: input.userId,
    sessionId: input.sessionId,
  });

  if (existing) {
    const updated = await appendSupportTicketMessage(existing.id, {
      role: "user",
      content: input.message,
    });

    return {
      ...toHandoffResult(updated, input.reason),
      reply:
        "Your message was added to your open support ticket. A human agent will respond as soon as possible.",
    };
  }

  const now = new Date().toISOString();
  const ticket = await createSupportTicket({
    userId: input.userId,
    sessionId: input.sessionId,
    initialMessages: [
      {
        role: "system",
        content: `Escalated to human support (${input.reason}).`,
        createdAt: now,
      },
      {
        role: "user",
        content: input.message,
        createdAt: now,
      },
    ],
  });

  await resetSessionFailureCount(input.sessionId);
  return toHandoffResult(ticket, input.reason);
}

export async function shouldEscalateToHuman(input: {
  message: string;
  sessionId?: string;
}): Promise<{ escalate: boolean; reason?: "user_request" | "repeated_failure" }> {
  if (isHumanHandoffTrigger(input.message)) {
    return { escalate: true, reason: "user_request" };
  }

  const failureCount = await getSessionFailureCount(input.sessionId);
  if (failureCount >= REPEATED_FAILURE_THRESHOLD) {
    return { escalate: true, reason: "repeated_failure" };
  }

  return { escalate: false };
}

export async function handleOpenTicketMessage(input: {
  message: string;
  userId?: string;
  sessionId?: string;
}): Promise<HandoffResult | null> {
  const openTicket = await findOpenSupportTicket({
    userId: input.userId,
    sessionId: input.sessionId,
  });

  if (!openTicket) return null;

  const updated = await appendSupportTicketMessage(openTicket.id, {
    role: "user",
    content: input.message,
  });

  return {
    ...toHandoffResult(updated, "user_request"),
    reply:
      "Thanks — we've added that to your support ticket. A human agent will reply soon.",
  };
}
