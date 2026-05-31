"use client";

import { FuturisticCheckoutLoader } from "@/components/storefront/checkout/atoms/FuturisticCheckoutLoader";
import { PayPalProviderWrapper } from "@/components/storefront/checkout/organisms/PayPalProviderWrapper";
import { Suspense } from "react";
import dynamic from "next/dynamic";


const CheckoutContent = dynamic(() => import("@/components/storefront/checkout/organisms/CheckoutComponent"), {
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