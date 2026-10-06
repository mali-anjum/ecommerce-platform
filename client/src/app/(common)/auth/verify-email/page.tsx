import type { Metadata } from "next";
import { AccountAuthShell } from "@/components/auth/molecules/AccountAuthShell";
import { VerifyEmailStatus } from "@/components/auth/organisms/VerifyEmailStatus";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false },
  referrer: "no-referrer",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  return (
    <AccountAuthShell title="Email verification" description="Confirming your email address.">
      <VerifyEmailStatus token={typeof token === "string" ? token : null} />
    </AccountAuthShell>
  );
}
