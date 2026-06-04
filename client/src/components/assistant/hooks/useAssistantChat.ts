"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AssistantChatResponse,
  AssistantMessage,
  ClassifiedIntent,
  LeadSession,
} from "@/lib/assistant/types";
import {
  isOrderSupportIntent,
  isProductSearchIntent,
} from "@/lib/assistant/intent";
import { getAnalyticsSessionId } from "@/lib/analytics/sessionId";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sentryTracker } from "@/lib/monitoring";

const WELCOME_MESSAGE =
  "Hi! I can help with products, shipping, returns, and FAQs. What would you like to know?";

export function createAssistantMessage(
  role: AssistantMessage["role"],
  content: string,
  extras?: Pick<
    AssistantMessage,
    | "products"
    | "orders"
    | "orderSupportIntent"
    | "requiresAuth"
    | "leadCapture"
    | "supportTicket"
    | "classifiedIntent"
  >,
): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...extras,
  };
}

type UseAssistantChatOptions = {
  productId?: string;
  scrollOnChange?: boolean;
};

export function useAssistantChat({
  productId,
  scrollOnChange = true,
}: UseAssistantChatOptions = {}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createAssistantMessage("assistant", WELCOME_MESSAGE),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadSession, setLeadSession] = useState<LeadSession>({ active: false });
  const [sessionId] = useState(() => getAnalyticsSessionId());
  const [failureCount, setFailureCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollOnChange || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scrollOnChange]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!isFeatureEnabled("ai.chat")) {
      setError("AI chat is disabled in feature-flags.config.json");
      return;
    }

    const userMessage = createAssistantMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const history = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: trimmed,
          history: history.slice(0, -1),
          sessionId,
          ...(productId ? { productId } : {}),
          ...(leadSession.active ? { leadSession } : {}),
        }),
      });

      const payload = (await res.json()) as AssistantChatResponse & {
        message?: string;
      };

      if (!res.ok || !payload.success) {
        throw new Error(
          payload.message || "Assistant is unavailable. Please try again later.",
        );
      }

      if (payload.data.leadCapture) {
        setLeadSession(payload.data.leadCapture.session);
      }

      const classifiedIntent = payload.data.classifiedIntent;

      setMessages((prev) => [
        ...prev,
        createAssistantMessage("assistant", payload.data.reply, {
          classifiedIntent,
          products: isProductSearchIntent(classifiedIntent)
            ? payload.data.products
            : undefined,
          orders: isOrderSupportIntent(classifiedIntent)
            ? payload.data.orders
            : undefined,
          orderSupportIntent: payload.data.orderSupportIntent,
          requiresAuth: payload.data.requiresAuth,
          leadCapture: payload.data.leadCapture,
          supportTicket: payload.data.supportTicket,
        }),
      ]);
      setFailureCount(0);
    } catch (err) {
    sentryTracker(err, { source: "useAssistantChat" });
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setFailureCount((count) => count + 1);
      setMessages((prev) => [
        ...prev,
        createAssistantMessage(
          "assistant",
          "Sorry, I could not answer right now. Please check the Help Center or try again in a moment.",
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, productId, leadSession, sessionId]);

  const placeholder =
    leadSession.active
      ? "Continue lead form…"
      : failureCount >= 2
        ? "Having trouble? Try “talk to agent” for human support."
        : "Try: return policy, best laptops, or talk to agent…";

  return {
    input,
    setInput,
    messages,
    isLoading,
    error,
    failureCount,
    leadSession,
    scrollRef,
    sendMessage,
    placeholder,
  };
}
