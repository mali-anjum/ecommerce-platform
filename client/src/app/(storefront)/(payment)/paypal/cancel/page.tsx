"use client";

import { FuturisticCheckoutLoader } from "@/components/storefront/checkout/atoms/FuturisticCheckoutLoader";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function PayPalCancelInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout");
  }, [router]);

  return <FuturisticCheckoutLoader />;
}

export default function PayPalCancelPage() {
  return (
    <Suspense fallback={<FuturisticCheckoutLoader />}>
      <PayPalCancelInner />
    </Suspense>
  );
}
