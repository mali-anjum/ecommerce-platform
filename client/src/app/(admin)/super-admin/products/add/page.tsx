"use client";

import { Suspense } from "react";
import { ProductLoader } from "@/components/super-admin/products/atoms/ProductLoader";


export function ProductAddScreen() {
    return (
      <Suspense fallback={<ProductLoader />}>
        <ProductAddScreen />
      </Suspense>
  );
}