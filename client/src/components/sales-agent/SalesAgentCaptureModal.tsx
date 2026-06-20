"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { intentScoreLabel } from "@/lib/sales-agent/types";

type SalesAgentCaptureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intentScore: number;
  intentSummary?: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (email: string) => Promise<boolean>;
};

export function SalesAgentCaptureModal({
  open,
  onOpenChange,
  intentScore,
  intentSummary,
  isSubmitting,
  error,
  onSubmit,
}: SalesAgentCaptureModalProps) {
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {intentScoreLabel(intentScore)} purchase intent
            </span>
          </div>
          <DialogTitle>Get your personalized offer</DialogTitle>
          <DialogDescription>
            {intentSummary
              ? `${intentSummary} — enter your email and we will send a tailored discount and product picks.`
              : "Enter your email to receive a tailored discount and product recommendations."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(email);
          }}
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
              disabled={isSubmitting}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Send my offer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
