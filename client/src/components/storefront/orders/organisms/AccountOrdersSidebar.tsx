"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  MapPin,
  CreditCard,
  Package,
  RotateCcw,
  Star,
  Heart,
  ShoppingBag,
  Grid3X3,
  ShoppingCart,
  BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const accountLinks: NavItem[] = [
  { label: "My Profile", href: "/account", icon: User },
  { label: "Address Book", href: "/account?tab=addresses", icon: MapPin },
  { label: "My Payment Options", href: "/account?tab=payments", icon: CreditCard },
];

const orderLinks: NavItem[] = [
  { label: "My Orders", href: "/track-order", icon: Package },
  { label: "My Returns", href: "/track-order?tab=returns", icon: RotateCcw },
  { label: "My Cancellations", href: "/track-order?tab=cancellations", icon: Package },
];

const shopLinks: NavItem[] = [
  { label: "Categories", href: "/products", icon: Grid3X3 },
  { label: "Continue Shopping", href: "/products", icon: ShoppingBag },
  { label: "Checkout", href: "/checkout", icon: ShoppingCart },
  { label: "My Wishlist", href: "/wishlist", icon: Heart },
  { label: "My Reviews", href: "/track-order?tab=to-review", icon: Star },
];

function NavSection({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href.split("?")[0] &&
            (item.href === "/track-order"
              ? pathname === "/track-order"
              : pathname === item.href.split("?")[0]);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AccountOrdersSidebar() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name?.trim() || "Guest";

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6 rounded-xl border border-border bg-card/60 p-4">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            <BadgeCheck className="h-3 w-3" />
            Account
          </span>
        </div>

        <NavSection title="Manage My Account" items={accountLinks} />
        <NavSection title="My Orders" items={orderLinks} />
        <NavSection title="Shop" items={shopLinks} />
      </div>
    </aside>
  );
}
