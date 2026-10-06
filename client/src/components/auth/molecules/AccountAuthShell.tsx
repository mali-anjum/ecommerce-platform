import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

type AccountAuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** Centered card layout shared by forgot-password, reset-password, and verify-email pages. */
export const AccountAuthShell = ({ title, description, children }: AccountAuthShellProps) => (
  <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
    <Card className="w-full max-w-md glass-effect border border-glass-border">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="flex justify-center">
          <Link href="/auth/login" aria-label="Back to sign in">
            <Image
              src="/images/logo.webp"
              width={160}
              height={40}
              alt="Store logo"
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  </main>
);
