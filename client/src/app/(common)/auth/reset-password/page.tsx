import type { Metadata } from "next";
import { AccountAuthShell } from "@/components/auth/molecules/AccountAuthShell";
import { ResetPasswordForm } from "@/components/auth/organisms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
  // Keeps the one-time token in the URL from leaking to other sites via the Referer header.
  referrer: "no-referrer",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <AccountAuthShell title="Choose a new password" description="Enter and confirm your new password.">
      <ResetPasswordForm token={typeof token === "string" ? token : null} />
    </AccountAuthShell>
  );
}
