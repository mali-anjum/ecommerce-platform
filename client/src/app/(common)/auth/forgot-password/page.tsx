import type { Metadata } from "next";
import { AccountAuthShell } from "@/components/auth/molecules/AccountAuthShell";
import { ForgotPasswordForm } from "@/components/auth/organisms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AccountAuthShell
      title="Forgot your password?"
      description="Enter your account email and we'll send you a link to reset it."
    >
      <ForgotPasswordForm />
    </AccountAuthShell>
  );
}
