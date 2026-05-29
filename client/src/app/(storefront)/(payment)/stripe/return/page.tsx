"use client";

import { FuturisticCheckoutLoader } from "@/components/user/checkout/FuturisticCheckoutLoader";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Stripe Checkout redirects here after payment with ?session_id=cs_...
 * Forward to /checkout so useCheckoutPayment can capture the order.
 */
function StripeReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      router.replace(`/checkout?session_id=${encodeURIComponent(sessionId)}`);
      return;
    }
    router.replace("/checkout");
  }, [router, searchParams]);

  return <FuturisticCheckoutLoader />;
}

export default function StripeReturnPage() {
  return (
    <Suspense fallback={<FuturisticCheckoutLoader />}>
      <StripeReturnInner />
    </Suspense>
  );
}
