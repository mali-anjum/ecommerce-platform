"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Receipt } from "lucide-react";

const nav = [
  { href: "/seller", label: "Overview", icon: LayoutDashboard },
  { href: "/seller/products/list", label: "Products", icon: Package },
  { href: "/seller/sales", label: "Sales", icon: Receipt },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          Seller hub
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <Link
            href="/seller/register"
            className="mt-4 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            {user?.role === "USER" ? "Become a seller" : "Shop settings"}
          </Link>
          <Link
            href="/home"
            className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            Back to shopping
          </Link>
        </nav>
      </aside>
      <main className="pl-56">{children}</main>
    </div>
  );
}
