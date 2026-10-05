"use client";

import { Suspense } from "react";
import { ProductLoader } from "@/components/super-admin/products/atoms/ProductLoader";
import { ProductAddScreen } from "@/components/super-admin/products/screen/ProductAddScreen";

export const dynamic = "force-dynamic";

export default function SuperAdminAddProductPage() {
  return (
    <Suspense fallback={<ProductLoader />}>
      <ProductAddScreen listPath="/super-admin/products/list" />
    </Suspense>
  );
}
