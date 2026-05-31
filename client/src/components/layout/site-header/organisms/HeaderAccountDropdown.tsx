"use client";

import {
  ChevronDown,
  LogOut,
  Store,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/organisms/theme/ThemeToggler";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as AuthUser } from "@/components/auth/types/User";
import {
  SITE_HEADER_ACCOUNT_LINKS,
  getAccountMenuHelper,
  getAccountMenuIcon,
} from "@/components/layout/site-header/config/site-header-account-menu";
import { SITE_HEADER_INFO_LINKS } from "@/components/layout/site-header/config/site-header-info-links";

type HeaderAccountDropdownProps = {
  user: AuthUser | null;
  onLogout: () => void;
};

/** Signed-in / guest profile dropdown in the desktop header. */
export function HeaderAccountDropdown({ user, onLogout }: HeaderAccountDropdownProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-sm font-medium">Welcome</p>
              <p className="text-xs text-muted-foreground">
                {user ? user.name : "Sign In"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl backdrop-blur-none"
      >
        {user ? (
          <>
            <div className="rounded-t-2xl border-b border-border bg-muted/40 px-4 py-4">
              <p className="text-base font-semibold text-foreground">{user.name}</p>
              <p className="break-all text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="px-2 pb-2 pt-2">
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              {SITE_HEADER_ACCOUNT_LINKS.map((item) => (
                <DropdownMenuItem
                  key={item.title}
                  onClick={() => router.push(item.to)}
                  className="mx-1 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        {getAccountMenuIcon(item.title)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getAccountMenuHelper(item.title)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground" />
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            {user.role === "SELLER" && (
              <DropdownMenuItem
                onClick={() => router.push("/seller")}
                className="mx-3 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
              >
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/15">
                  <Store className="h-4 w-4 text-secondary" />
                </span>
                <span className="font-medium">Seller dashboard</span>
              </DropdownMenuItem>
            )}
            {user.role === "USER" && (
              <DropdownMenuItem
                onClick={() => router.push("/seller/register")}
                className="mx-3 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
              >
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/15">
                  <Store className="h-4 w-4 text-secondary" />
                </span>
                <span className="font-medium">Become a seller</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <ThemeToggle variant="menu" />
            <DropdownMenuItem
              onClick={onLogout}
              className="mx-2 mb-2 rounded-lg px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/15">
                <LogOut className="h-4 w-4 text-destructive" />
              </span>
              <span className="font-medium">Logout</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/auth/login")}
              className="mx-2 mt-2 rounded-lg px-3 py-2.5 focus:bg-accent/20"
            >
              Sign In
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/auth/register")}
              className="mx-2 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
            >
              Create Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {SITE_HEADER_INFO_LINKS.map((item) => (
              <DropdownMenuItem
                key={item.title}
                onClick={() => router.push(item.to)}
                className="mx-2 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
              >
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  {item.icon}
                </span>
                {item.title}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
