"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/auth/atoms/FormInput";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/components/schemas/accountSchemas";
import { getApiErrorMessage, requestPasswordReset } from "@/components/auth/utils/accountApi";

export const ForgotPasswordForm = () => {
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setError(null);
    try {
      setSentMessage(await requestPasswordReset(email));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send the reset link. Please try again."));
    }
  };

  if (sentMessage) {
    return (
      <div className="space-y-4 text-center" role="status">
        <MailCheck className="w-10 h-10 mx-auto text-primary" aria-hidden="true" />
        <p>{sentMessage}</p>
        <p className="text-sm text-muted-foreground">
          The link expires in 30 minutes. Check your spam folder if it does not arrive.
        </p>
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <InputField
        label="Email Address"
        type="email"
        icon={Mail}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={isSubmitting}
        {...register("email")}
        error={errors.email}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};
