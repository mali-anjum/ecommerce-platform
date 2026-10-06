"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/auth/atoms/FormInput";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormData,
} from "@/components/schemas/accountSchemas";
import { getApiErrorMessage, resetPassword } from "@/components/auth/utils/accountApi";

type ResetPasswordFormProps = {
  token: string | null;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center" role="alert">
        <p>This reset link is missing or incomplete.</p>
        <Link href="/auth/forgot-password" className="text-primary font-medium hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    setError(null);
    try {
      setDoneMessage(await resetPassword(token, password));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset your password. Please try again."));
    }
  };

  if (doneMessage) {
    return (
      <div className="space-y-4 text-center" role="status">
        <CheckCircle2 className="w-10 h-10 mx-auto text-primary" aria-hidden="true" />
        <p>{doneMessage}</p>
        <p className="text-sm text-muted-foreground">
          For your security, you have been signed out on all devices.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <InputField
        label="New Password"
        type="password"
        icon={Lock}
        placeholder="At least 6 characters"
        autoComplete="new-password"
        disabled={isSubmitting}
        {...register("password")}
        error={errors.password}
      />
      <InputField
        label="Confirm New Password"
        type="password"
        icon={Lock}
        placeholder="Repeat your new password"
        autoComplete="new-password"
        disabled={isSubmitting}
        {...register("confirmPassword")}
        error={errors.confirmPassword}
      />

      {error && (
        <div className="space-y-2 text-sm" role="alert">
          <p className="text-destructive">{error}</p>
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
};
