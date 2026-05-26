import { useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CartItemWithProduct } from '@/types/cart/cartItemStore';
import type { Coupon } from '@/types/checkout/Coupon';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { calculateTotals } from '@/components/user/checkout/checkoutUtils';
import { useCartSelectionStore } from '@/store/useCartSelectionStore';
import { useCartStore } from '@/store/useCartStore';
import type { CheckoutPaymentMethodId } from '@/hooks/checkout/usePaymentMethods';

interface UseCheckoutPaymentProps {
  user: any;
  cartItemsWithDetails: CartItemWithProduct[];
  selectedAddress: string;
  appliedCoupon: Coupon | null;
  items: any[];
  availablePaymentMethods: CheckoutPaymentMethodId[];
  createOrder: (orderRequest: any) => Promise<any>;
  captureOrder: (captureRequest: any) => Promise<any>;
  fetchCart: () => Promise<void>;
  router: AppRouterInstance;
}

export const useCheckoutPayment = ({
  user,
  cartItemsWithDetails,
  selectedAddress,
  appliedCoupon,
  items,
  availablePaymentMethods,
  createOrder,
  captureOrder,
  fetchCart,
  router
}: UseCheckoutPaymentProps) => {
  const { toast } = useToast();
  const selectedIds = useCartSelectionStore((state) => state.selectedIds);
  const pruneInvalidIds = useCartSelectionStore((state) => state.pruneInvalidIds);

  const handlePaymentMethodSelect = useCallback(async (
    paymentMethod: CheckoutPaymentMethodId
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      return;
    }

    if (selectedIds.length === 0 || cartItemsWithDetails.length === 0) {
      toast({
        title: "No items selected",
        description: "Select at least one cart item before checkout.",
        variant: "destructive",
      });
      router.push("/cart");
      return;
    }

    if (!availablePaymentMethods.includes(paymentMethod)) {
      toast({
        title: "Payment unavailable",
        description: "This payment method is not configured on the server.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { total } = calculateTotals(cartItemsWithDetails, appliedCoupon);

      const orderRequest = {
        cartItemIds: selectedIds,
        total,
        paymentMethod,
        addressId: selectedAddress,
        couponId: appliedCoupon?.id,
      };

      const response = await createOrder(orderRequest);

      if (!response?.success) {
        throw new Error(
          response?.message ??
            response?.error ??
            "Failed to create payment order"
        );
      }

      const paymentData = response.data;
      const redirectUrl =
        paymentData.approvalUrl ?? paymentData.url ?? null;

      if (!redirectUrl) {
        throw new Error("No payment redirect URL provided by the server");
      }

      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
          cartItemIds: selectedIds,
          timestamp: Date.now(),
        })
      );

      localStorage.setItem("cartBackup", JSON.stringify(items));

      window.location.href = redirectUrl;
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const description =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Failed to process payment";
      toast({
        title: "Payment Failed",
        description,
        variant: "destructive",
      });
    }
  }, [
    user,
    cartItemsWithDetails,
    selectedAddress,
    appliedCoupon,
    items,
    selectedIds,
    availablePaymentMethods,
    createOrder,
    router,
    toast,
  ]);

  const handlePaymentReturn = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId =
      urlParams.get("paymentId") ||
      urlParams.get("token") ||
      urlParams.get("session_id");

    if (!paymentId) return;

    const pendingOrder = localStorage.getItem("pendingOrder");
    if (!pendingOrder) return;

    const lockKey = `checkout_capture_${paymentId}`;
    if (typeof window !== "undefined") {
      const lockState = sessionStorage.getItem(lockKey);
      if (lockState === "processing" || lockState === "done") {
        return;
      }
      sessionStorage.setItem(lockKey, "processing");
    }

    try {
      const { internalOrderId, paymentMethod, timestamp } =
        JSON.parse(pendingOrder);

      if (Date.now() - timestamp > 30 * 60 * 1000) {
        throw new Error("Payment session expired. Please try again.");
      }

      const captureRequest = {
        paymentId,
        paymentMethod,
        internalOrderId,
      };

      const response = await captureOrder(captureRequest);

      if (response?.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(lockKey, "done");
        }
        await fetchCart();
        const validIds = useCartStore.getState().items.map((item) => item.id);
        pruneInvalidIds(validIds);
        localStorage.removeItem("pendingOrder");
        localStorage.removeItem("cartBackup");

        window.history.replaceState({}, document.title, "/checkout/success");

        toast({
          title: "Order confirmed",
          description: "Your order has been placed successfully",
          className: "bg-success/10 border-success/20 text-success",
        });

        setTimeout(() => {
          router.push(`/checkout/success?orderId=${response.data.order?.id}`);
        }, 1500);
      } else {
        throw new Error(
          response?.message ?? response?.error ?? "Payment capture failed"
        );
      }
    } catch (error: any) {
      console.error("Payment capture error:", error);

      if (typeof window !== "undefined" && paymentId) {
        sessionStorage.removeItem(`checkout_capture_${paymentId}`);
      }

      toast({
        title: "Payment Failed",
        description: error.message || "Failed to complete payment",
        variant: "destructive",
      });

      localStorage.removeItem("pendingOrder");
      localStorage.removeItem("cartBackup");
    }
  }, [
    captureOrder,
    fetchCart,
    router,
    toast,
    pruneInvalidIds,
  ]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("stripe_cancelled") === "1") {
      toast({
        title: "Payment cancelled",
        description: "Your card payment was cancelled. You can try again.",
        variant: "default",
      });
      window.history.replaceState({}, document.title, "/checkout");
      return;
    }

    if (
      urlParams.get("paymentId") ||
      urlParams.get("token") ||
      urlParams.get("session_id")
    ) {
      handlePaymentReturn();
    }
  }, [handlePaymentReturn, toast]);

  return {
    handlePaymentMethodSelect,
    handlePaymentReturn
  };
};
