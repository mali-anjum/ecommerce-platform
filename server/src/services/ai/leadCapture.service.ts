import { LeadSource } from "@prisma/client";
import { createLead } from "../lead/leadService";
import {
  extractEmail,
  extractPhone,
  isLeadCaptureTrigger,
  isSkipPhoneMessage,
} from "./leadCaptureParser";
import type { LeadCaptureResult, LeadSession } from "./types";

function emptySession(): LeadSession {
  return { active: false };
}

function activeSession(partial: Omit<LeadSession, "active">): LeadSession {
  return { active: true, ...partial };
}

export async function runLeadCaptureChat(input: {
  message: string;
  leadSession?: LeadSession;
  initialRequirement?: string;
}): Promise<LeadCaptureResult | null> {
  const message = input.message.trim();
  const session = input.leadSession ?? emptySession();

  if (!session.active && !isLeadCaptureTrigger(message)) {
    return null;
  }

  if (!session.active) {
    return {
      intent: "lead_capture",
      reply:
        "Great — I can connect you with our team. What is your email address?",
      products: [],
      productIdsReferenced: [],
      orders: [],
      leadCapture: {
        step: "email",
        session: activeSession({
          initialRequirement: message,
        }),
      },
    };
  }

  if (!session.email) {
    const email = extractEmail(message);
    if (!email) {
      return {
        intent: "lead_capture",
        reply: "Please enter a valid email address so we can follow up.",
        products: [],
        productIdsReferenced: [],
        orders: [],
        leadCapture: {
          step: "email",
          session,
        },
      };
    }

    return {
      intent: "lead_capture",
      reply:
        "Thanks! What is your phone number? (Optional — reply “skip” to continue without one.)",
      products: [],
      productIdsReferenced: [],
      orders: [],
      leadCapture: {
        step: "phone",
        session: activeSession({
          ...session,
          email,
        }),
      },
    };
  }

  if (session.phone === undefined) {
    const phone = isSkipPhoneMessage(message)
      ? null
      : extractPhone(message);

    if (!isSkipPhoneMessage(message) && !phone) {
      return {
        intent: "lead_capture",
        reply:
          "Please share a valid phone number, or reply “skip” if you prefer email only.",
        products: [],
        productIdsReferenced: [],
        orders: [],
        leadCapture: {
          step: "phone",
          session,
        },
      };
    }

    return {
      intent: "lead_capture",
      reply:
        "Almost done — what are you looking to buy or any details we should know?",
      products: [],
      productIdsReferenced: [],
      orders: [],
      leadCapture: {
        step: "message",
        session: activeSession({
          ...session,
          phone: phone ?? null,
        }),
      },
    };
  }

  if (!session.message) {
    const requirement = message.trim();
    if (requirement.length < 3) {
      return {
        intent: "lead_capture",
        reply: "Please share a brief description of what you need.",
        products: [],
        productIdsReferenced: [],
        orders: [],
        leadCapture: {
          step: "message",
          session,
        },
      };
    }

    const fullMessage = session.initialRequirement
      ? `${session.initialRequirement}\n\nDetails: ${requirement}`
      : requirement;

    const lead = await createLead({
      email: session.email,
      phone: session.phone,
      message: fullMessage,
      source: LeadSource.AI,
    });

    return {
      intent: "lead_capture",
      reply:
        "Thank you! Our team has your details and will reach out shortly. Is there anything else I can help with?",
      products: [],
      productIdsReferenced: [],
      orders: [],
      leadCapture: {
        step: "complete",
        session: emptySession(),
        leadId: lead.id,
      },
    };
  }

  return null;
}
