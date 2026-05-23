"use client";

import { FuturisticCheckoutLoader } from "@/components/user/checkout/FuturisticCheckoutLoader";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * PayPal redirects here after approval with ?token=...&PayerID=...
 * Checkout reads those params; forward so capture runs on /checkout.
 */
function PayPalReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/checkout?${query}` : "/checkout");
  }, [router, searchParams]);

  return <FuturisticCheckoutLoader />;
}

export default function PayPalReturnPage() {
  return (
    <Suspense fallback={<FuturisticCheckoutLoader />}>
      <PayPalReturnInner />
    </Suspense>
  );
}
