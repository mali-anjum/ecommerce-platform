import { useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CartItemWithProduct } from '@/types/cart/cartItemStore';
import type { Coupon } from '@/types/checkout/Coupon';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface UseCheckoutPaymentProps {
  user: any;
  cartItemsWithDetails: CartItemWithProduct[];
  selectedAddress: string;
  appliedCoupon: Coupon | null;
  items: any[];
  createOrder: (orderRequest: any) => Promise<any>;
  captureOrder: (captureRequest: any) => Promise<any>;
  clearCart: () => Promise<void>;
  router: AppRouterInstance;
}

export const useCheckoutPayment = ({
  user,
  cartItemsWithDetails,
  selectedAddress,
  appliedCoupon,
  items,
  createOrder,
  captureOrder,
  clearCart,
  router
}: UseCheckoutPaymentProps) => {
  const { toast } = useToast();

  const calculateTotal = useCallback((items: CartItemWithProduct[], coupon: Coupon | null) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
    const discount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
    return Math.max(0, subtotal - discount);
  }, []);

  const handlePaymentMethodSelect = useCallback(async (
    paymentMethod: "PAYPAL" | "STRIPE" | "CARD"
  ) => {
    // Validate user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      router.push("/login?redirect=/checkout");
      return;
    }

    // Validate address is selected
    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      return;
    }

    // Validate cart is not empty
    if (cartItemsWithDetails.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty",
        variant: "destructive",
      });
      router.push("/cart");
      return;
    }

    // Handle specific payment methods
    if (paymentMethod === "CARD") {
      toast({
        title: "Coming Soon",
        description: "Direct card payments will be available soon",
        variant: "default",
      });
      return;
    }

    try {
      const total = calculateTotal(cartItemsWithDetails, appliedCoupon);
      
      // Prepare payment order request
      const orderRequest = {
        items: cartItemsWithDetails.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productCategory: item.product.category,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product.price,
        })),
        total,
        paymentMethod,
        addressId: selectedAddress,
        couponId: appliedCoupon?.id,
      };

      // Call createOrder endpoint
      const response = await createOrder(orderRequest);

      if (!response?.success) {
        throw new Error(response?.error || "Failed to create payment order");
      }

      const paymentData = response.data;

      // Store order info for when user returns
      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
          timestamp: Date.now(),
        })
      );

      // Store cart backup in case of failure
      localStorage.setItem("cartBackup", JSON.stringify(items));

      // Redirect based on payment method
      if (paymentMethod === "PAYPAL" && paymentData.approvalUrl) {
        window.location.href = paymentData.approvalUrl;
      } else if (paymentMethod === "STRIPE" && paymentData.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error("No payment URL provided");
      }
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const description =
        error?.response?.data?.message ??
        error?.message ??
        "Failed to process payment";
      toast({
        title: "Payment Failed",
        description,
        variant: "destructive",
      });
    }
  }, [user, cartItemsWithDetails, selectedAddress, appliedCoupon, items, createOrder, calculateTotal, router, toast]);

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

      // Check if order is too old (30 minutes)
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
        // Clear cart and local storage
        await clearCart();
        localStorage.removeItem("pendingOrder");
        localStorage.removeItem("cartBackup");

        // Clean URL
        window.history.replaceState({}, document.title, "/checkout/success");

        // Show success
        toast({
          title: "🎉 Order Confirmed!",
          description: "Your order has been placed successfully",
          className: "bg-success/10 border-success/20 text-success",
        });

        // Redirect to success page
        setTimeout(() => {
          router.push(`/checkout/success?orderId=${response.data.order?.id}`);
        }, 1500);
      } else {
        throw new Error(response?.error || "Payment capture failed");
      }
    } catch (error: any) {
      console.error("Payment capture error:", error);

      if (typeof window !== "undefined" && paymentId) {
        sessionStorage.removeItem(`checkout_capture_${paymentId}`);
      }

      // Restore cart from backup if available
      const cartBackup = localStorage.getItem("cartBackup");
      if (cartBackup) {
        // You would implement cart restoration here
        console.log("Cart backup available for restoration");
      }

      toast({
        title: "Payment Failed",
        description: error.message || "Failed to complete payment",
        variant: "destructive",
      });

      // Clean up
      localStorage.removeItem("pendingOrder");
      localStorage.removeItem("cartBackup");
    }
  }, [captureOrder, clearCart, router, toast]);

  useEffect(() => {
    // Check if we have payment parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("paymentId") ||
      urlParams.get("token") ||
      urlParams.get("session_id")
    ) {
      handlePaymentReturn();
    }
  }, [handlePaymentReturn]);

  return {
    handlePaymentMethodSelect,
    handlePaymentReturn
  };
};