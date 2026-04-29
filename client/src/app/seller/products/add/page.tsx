"use client";

import { Suspense } from "react";
import ProductForm from "@/components/super-admin/ProductForm";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

function Loading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading product form…</p>
    </div>
  );
}

export default function SellerAddProductPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductForm listPath="/seller/products/list" />
    </Suspense>
  );
}
