"use client";

import { FuturisticCheckoutLoader } from "@/components/user/checkout/FuturisticCheckoutLoader";
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
