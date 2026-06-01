"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  AssistantChatResponse,
  AssistantMessage,
  LeadSession,
} from "@/lib/assistant/types";
import { getAnalyticsSessionId } from "@/lib/analytics/sessionId";
import { AssistantProductCards } from "@/components/assistant/AssistantProductCards";
import { AssistantOrderCards } from "@/components/assistant/AssistantOrderCards";

const HIDDEN_PREFIXES = ["/auth", "/super-admin", "/seller"];

function createMessage(
  role: AssistantMessage["role"],
  content: string,
  extras?: Pick<
    AssistantMessage,
    | "intent"
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

function extractProductIdFromPath(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/^\/products\/([^/]+)/);
  return match?.[1];
}

export function ShoppingAssistantWidget() {
  const pathname = usePathname();
  const productId = extractProductIdFromPath(pathname);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createMessage(
      "assistant",
      "Hi! I can help with products, shipping, returns, and FAQs. What would you like to know?",
    ),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadSession, setLeadSession] = useState<LeadSession>({ active: false });
  const [sessionId] = useState(() => getAnalyticsSessionId());
  const [failureCount, setFailureCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hidden = HIDDEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage("user", trimmed);
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

      setMessages((prev) => [
        ...prev,
        createMessage("assistant", payload.data.reply, {
          intent: payload.data.intent,
          classifiedIntent: payload.data.classifiedIntent,
          products:
            payload.data.intent === "product_recommendation"
              ? payload.data.products
              : undefined,
          orders:
            payload.data.intent === "order_support"
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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setFailureCount((count) => count + 1);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "assistant",
          "Sorry, I could not answer right now. Please check the Help Center or try again in a moment.",
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, productId, leadSession, sessionId]);

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-24 right-8 z-40">
        <Button
          type="button"
          size="icon"
          aria-label="Open shopping assistant"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border/70 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle>Shopping Assistant</SheetTitle>
                <SheetDescription>
                  Ask about orders, products, FAQs, or say “talk to agent” for human help.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/70 bg-card/95 text-foreground",
                  )}
                >
                  {message.content}
                  {message.role === "assistant" &&
                    message.products &&
                    message.products.length > 0 && (
                      <AssistantProductCards products={message.products} />
                    )}
                  {message.role === "assistant" &&
                    message.orders &&
                    message.orders.length > 0 && (
                      <AssistantOrderCards orders={message.orders} />
                    )}
                  {message.role === "assistant" && message.supportTicket && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Support ticket {message.supportTicket.id.slice(0, 8)} ·{" "}
                      {message.supportTicket.status.toLowerCase()}
                    </p>
                  )}
                  {message.role === "assistant" && message.requiresAuth && (
                    <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                      <a href="/auth/login">Sign in to view your orders</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <div className="border-t border-border/70 p-4">
            {error && (
              <p className="mb-2 text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  leadSession.active
                    ? "Continue lead form…"
                    : failureCount >= 2
                      ? "Having trouble? Try “talk to agent” for human support."
                      : "Try: return policy, best laptops, or talk to agent…"
                }
                rows={2}
                className="min-h-[72px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
