"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";

export default function SellerRegisterPage() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, error: authError, registerSeller } = useAuthStore();

  if (user && user.role !== "USER") {
    return (
      <div className="p-8 max-w-md space-y-4">
        <p className="text-muted-foreground">
          Your account already has a seller or admin role.
        </p>
        <Button asChild>
          <Link href="/seller">Go to seller dashboard</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await registerSeller({ storeName, slug });
      if (!ok) {
        throw new Error("Seller registration failed");
      }
      toast({
        title: "Seller account ready",
        description: "You can now add products to your store.",
      });
      router.push("/seller");
      router.refresh();
    } catch {
      toast({
        title: "Could not create seller",
        description: authError || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open your store</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Choose a display name and a unique URL slug (lowercase, letters, numbers,
          hyphens).
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Northwind Outfitters"
            required
            minLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Store slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="northwind-outfitters"
            required
            minLength={2}
          />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating…" : "Create seller account"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        You must be logged in as a regular shopper (USER). After creation, your role
        becomes SELLER and your session is refreshed automatically.
      </p>
    </div>
  );
}
