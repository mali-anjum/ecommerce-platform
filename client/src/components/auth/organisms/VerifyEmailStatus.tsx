"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage, verifyEmailToken } from "@/components/auth/utils/accountApi";

type VerifyEmailStatusProps = {
  token: string | null;
};

type Status =
  | { state: "verifying" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export const VerifyEmailStatus = ({ token }: VerifyEmailStatusProps) => {
  const [status, setStatus] = useState<Status>(
    token
      ? { state: "verifying" }
      : { state: "error", message: "This verification link is missing or incomplete." },
  );
  // Tokens are single-use: React Strict Mode runs effects twice in dev, so guard against a second request.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    verifyEmailToken(token)
      .then((message) => setStatus({ state: "success", message }))
      .catch((err) =>
        setStatus({
          state: "error",
          message: getApiErrorMessage(err, "We could not verify your email. Please try again."),
        }),
      );
  }, [token]);

  if (status.state === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p>Verifying your email…</p>
      </div>
    );
  }

  const isSuccess = status.state === "success";
  return (
    <div className="space-y-4 text-center" role={isSuccess ? "status" : "alert"}>
      {isSuccess ? (
        <CheckCircle2 className="w-10 h-10 mx-auto text-primary" aria-hidden="true" />
      ) : (
        <XCircle className="w-10 h-10 mx-auto text-destructive" aria-hidden="true" />
      )}
      <p>{status.message}</p>
      {isSuccess ? (
        <Button asChild className="w-full">
          <Link href="/home">Continue shopping</Link>
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Signed in? You can request a new link from{" "}
          <Link href="/account" className="text-primary hover:underline">
            your account
          </Link>
          .
        </p>
      )}
    </div>
  );
};
