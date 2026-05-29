"use client";

import { FuturisticCheckoutLoader } from "@/components/user/checkout/FuturisticCheckoutLoader";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function StripeCancelInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout?stripe_cancelled=1");
  }, [router]);

  return <FuturisticCheckoutLoader />;
}

export default function StripeCancelPage() {
  return (
    <Suspense fallback={<FuturisticCheckoutLoader />}>
      <StripeCancelInner />
    </Suspense>
  );
}
