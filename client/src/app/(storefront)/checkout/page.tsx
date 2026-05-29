"use client";

import { FuturisticCheckoutLoader } from "@/components/user/checkout/FuturisticCheckoutLoader";
import { PayPalProviderWrapper } from "@/components/user/checkout/PayPalProviderWrapper";
import { Suspense } from "react";
import dynamic from "next/dynamic";


const CheckoutContent = dynamic(() => import("@/components/user/checkout/CheckoutComponent"), {
  ssr: false,
  loading: () => <FuturisticCheckoutLoader />,
});

function CheckoutPage() {
  return (
      <PayPalProviderWrapper>
        <Suspense fallback={<FuturisticCheckoutLoader />}>
          <CheckoutContent />
        </Suspense>
      </PayPalProviderWrapper>
  );
}

export default CheckoutPage;