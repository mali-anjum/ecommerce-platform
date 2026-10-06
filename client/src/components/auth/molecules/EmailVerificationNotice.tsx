"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage, resendVerificationEmail } from "@/components/auth/utils/accountApi";

/** Shows a resend prompt when the signed-in user's email is not verified; renders nothing otherwise. */
export const EmailVerificationNotice = () => {
  const [isUnverified, setIsUnverified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ user?: { emailVerified?: boolean } }>("/api/auth/me", { withCredentials: true })
      .then((res) => {
        if (!cancelled) setIsUnverified(res.data.user?.emailVerified === false);
      })
      .catch(() => {
        // Not signed in or /me unavailable: nothing to show.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isUnverified) return null;

  const onResend = async () => {
    setIsSending(true);
    setFeedback(null);
    try {
      const text = await resendVerificationEmail();
      setFeedback({ ok: true, text: `${text} Please check your inbox.` });
    } catch (err) {
      setFeedback({
        ok: false,
        text: getApiErrorMessage(err, "Could not send the email. Please try again later."),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
      role="region"
      aria-label="Email verification"
    >
      <MailWarning className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Please verify your email address.</p>
        {feedback && (
          <p className={feedback.ok ? "text-muted-foreground" : "text-destructive"} role="status">
            {feedback.text}
          </p>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={onResend} disabled={isSending}>
        {isSending ? "Sending…" : "Resend email"}
      </Button>
    </div>
  );
};
