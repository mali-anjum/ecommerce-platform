"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export default function SellerHomePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Sign in to manage your store.</p>
        <Button asChild className="mt-4">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (user.role === "USER") {
    return (
      <div className="p-8 max-w-lg space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Sell on this marketplace</h1>
        <p className="text-muted-foreground">
          Create a seller profile with a public store name and URL slug. You can list
          products and track orders that include your items.
        </p>
        <Button asChild>
          <Link href="/seller/register">Register as seller</Link>
        </Button>
      </div>
    );
  }

  if (user.role === "SELLER") {
    return (
      <div className="p-8 space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage listings and view sales attributed to your store.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href="/seller/products/list">My products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/seller/products/add">Add product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/seller/sales">Order lines</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-muted-foreground">
      Super admins use <Link href="/super-admin" className="text-primary underline">Super Admin</Link>{" "}
      for catalog tools.
    </div>
  );
}
