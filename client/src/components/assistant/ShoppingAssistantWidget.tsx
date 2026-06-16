"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAssistantChat } from "@/components/assistant/hooks/useAssistantChat";
import { AssistantMessageList } from "@/components/assistant/AssistantMessageList";
const HIDDEN_PREFIXES = ["/auth", "/super-admin", "/seller"];

function extractProductIdFromPath(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/^\/products\/([^/]+)/);
  return match?.[1];
}

export function ShoppingAssistantWidget() {
  const pathname = usePathname();
  const productId = extractProductIdFromPath(pathname);
  const [open, setOpen] = useState(false);

  const {
    input,
    setInput,
    messages,
    isLoading,
    error,
    scrollRef,
    sendMessage,
    placeholder,
  } = useAssistantChat({ productId, scrollOnChange: open });

  const hidden = HIDDEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

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
          className="h-14 w-14 rounded-full bg-linear-to-r from-primary to-secondary shadow-lg hover:scale-105 transition-transform"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary">
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

          <AssistantMessageList
            messages={messages}
            isLoading={isLoading}
            scrollRef={scrollRef}
          />

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
                placeholder={placeholder}
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
