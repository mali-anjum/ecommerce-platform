import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import CheckoutComponent from "@/components/storefront/checkout/organisms/CheckoutComponent";

function CheckoutSkeleton() {
  return (
    <div>
      <Skeleton />
    </div>
  );
}

function CheckoutSuspense() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutComponent />
    </Suspense>
  );
}

export default CheckoutSuspense;