"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/lib/assistant/types";
import { AssistantProductCards } from "@/components/assistant/AssistantProductCards";
import { AssistantOrderCards } from "@/components/assistant/AssistantOrderCards";

type AssistantMessageListProps = {
  messages: AssistantMessage[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

export function AssistantMessageList({
  messages,
  isLoading,
  scrollRef,
}: AssistantMessageListProps) {
  return (
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
            <span className="whitespace-pre-wrap">{message.content}</span>
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
                <Link href="/auth/login">Sign in to view your orders</Link>
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
  );
}
