import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Store hooks
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCouponStore } from "@/store/useCouponStore";
import { useOrderStore } from "@/store/useOrderStore";

// Custom hooks
import { useCheckoutData } from '@/hooks/checkout/useCheckoutData';
import { useCheckoutCart } from '@/hooks/checkout/useCheckoutCart';
import { useCheckoutCoupon } from '@/hooks/checkout/useCheckoutCoupon';
import { useCheckoutPayment } from '@/hooks/checkout/useCheckoutPayment';
import { useCheckoutAddress } from '@/hooks/checkout/useCheckoutAddress';
import { usePaymentMethods } from '@/hooks/checkout/usePaymentMethods';

// Components
import { CheckoutHeader } from './CheckoutHeader';
import { CheckoutEmptyState } from './CheckoutEmptyState';
import { CheckoutLeftPanel } from './CheckoutLeftPanel';
import { CheckoutRightPanel } from './CheckoutRightPanel';
import { CheckoutSecurityCard } from './CheckoutSecurityCard';
import { CheckoutSupportCard } from './CheckoutSupportCard';
import { PaymentProcessing } from "@/components/user/checkout/PaymentProcessing";

// Utils
import { calculateTotals, isCheckoutReady } from '@/utils/checkoutUtils';

export function CheckoutContent() {
  const router = useRouter();

  // Store hooks
  const { addresses, fetchAddresses } = useAddressStore();
  const { items, fetchCart } = useCartStore();
  const { couponList, fetchCoupons } = useCouponStore();
  const { createOrder, captureOrder, isPaymentProcessing } = useOrderStore();
  const { user } = useAuthStore();

  // Custom hooks - DECLARE ALL HOOKS FIRST
  const { isLoading, fetchCheckoutData } = useCheckoutData();
  const { cartItemsWithDetails } = useCheckoutCart(items);
  const {
    couponCode,
    appliedCoupon,
    couponError,
    setCouponCode,
    handleApplyCoupon,
  } = useCheckoutCoupon(couponList);
  
  // Use the new address hook instead of useState
  const { selectedAddress, setSelectedAddress } = useCheckoutAddress(addresses);
  const {
    availableMethods: availablePaymentMethods,
    isLoading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethods();

  // Calculate totals - MOVE THIS BEFORE useCheckoutPayment
  const { subtotal, discountAmount, total } = useMemo(
    () => calculateTotals(cartItemsWithDetails, appliedCoupon),
    [cartItemsWithDetails, appliedCoupon]
  );

  // Checkout readiness
  const checkoutReady = useMemo(
    () => isCheckoutReady(selectedAddress, cartItemsWithDetails),
    [selectedAddress, cartItemsWithDetails]
  );

  // Now create payment hook AFTER selectedAddress is defined
  const { handlePaymentMethodSelect, handlePaymentReturn } = useCheckoutPayment({
    user,
    cartItemsWithDetails,
    selectedAddress,
    appliedCoupon,
    items,
    availablePaymentMethods,
    createOrder,
    captureOrder,
    fetchCart,
    router,
  });

  // Fetch initial data
  useEffect(() => {
    fetchCheckoutData(fetchAddresses, fetchCart, fetchCoupons);
  }, [fetchCheckoutData, fetchAddresses, fetchCart, fetchCoupons]);

  // Handle payment return
  useEffect(() => {
    handlePaymentReturn();
  }, [handlePaymentReturn]);

  // =========== EARLY RETURNS MUST BE AT THE END ===========
  // All hooks above must be called on every render

  // if (isLoading) {
  //   return <PaymentProcessing message="Loading your checkout..." />;
  // }

  if (isPaymentProcessing) {
    return <PaymentProcessing />;
  }

  if (cartItemsWithDetails.length === 0) {
    return <CheckoutEmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <CheckoutHeader 
          itemsCount={cartItemsWithDetails.length}
          currentStep={selectedAddress ? 1 : 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutLeftPanel
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              router={router}
              checkoutReady={checkoutReady}
              availablePaymentMethods={availablePaymentMethods}
              paymentMethodsLoading={paymentMethodsLoading}
              paymentMethodsError={paymentMethodsError}
              onSelectPaymentMethod={handlePaymentMethodSelect}
              isPaymentProcessing={isPaymentProcessing}
            />
            
            <CheckoutSecurityCard />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <CheckoutRightPanel
              cartItems={cartItemsWithDetails}
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
              couponCode={couponCode}
              appliedCoupon={appliedCoupon}
              couponError={couponError}
              onCouponChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              checkoutReady={checkoutReady}
            />
            
            <CheckoutSupportCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutContent;