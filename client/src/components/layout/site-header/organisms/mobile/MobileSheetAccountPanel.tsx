"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/organisms/theme/ThemeToggler";
import { Button } from "@/components/ui/button";
import type { User as AuthUser } from "@/types/auth/User";
import { SITE_HEADER_ACCOUNT_LINKS } from "@/components/layout/site-header/config/site-header-account-menu";
import { MobileSheetBackHeader } from "@/components/layout/site-header/atoms/MobileSheetBackHeader";

type MobileSheetAccountPanelProps = {
  user: AuthUser | null;
  onBack: () => void;
  onCloseSheet: () => void;
  onLogout: () => void;
};

/** Mobile sheet: account profile, links, theme, logout. */
export function MobileSheetAccountPanel({
  user,
  onBack,
  onCloseSheet,
  onLogout,
}: MobileSheetAccountPanelProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <MobileSheetBackHeader title="Account" onBack={onBack} />

      {user ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 rounded-lg bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {SITE_HEADER_ACCOUNT_LINKS.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onCloseSheet();
                  router.push(item.to);
                }}
              >
                {item.title}
              </Button>
            ))}
          </nav>

          <div className="space-y-3 border-t border-border pt-4">
            <ThemeToggle variant="menu" />
            <Button onClick={onLogout} variant="destructive" className="w-full">
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">Sign in to access your account</p>
          <Button
            onClick={() => {
              onCloseSheet();
              router.push("/auth/login");
            }}
            className="w-full"
          >
            Sign In
          </Button>
          <Button
            onClick={() => {
              onCloseSheet();
              router.push("/auth/register");
            }}
            variant="outline"
            className="w-full"
          >
            Create Account
          </Button>
        </div>
      )}
    </div>
  );
}
