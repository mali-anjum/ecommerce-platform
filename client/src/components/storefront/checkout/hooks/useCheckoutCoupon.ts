import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/hooks/use-toast';
import type { AppliedCoupon } from '@/components/storefront/checkout/types/Coupon';
import { validateCouponCode } from '@/components/storefront/checkout/utils/couponApi';

export const useCheckoutCoupon = () => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // The server checks dates and usage limits; coupon codes are never sent to the browser in bulk.
  const handleApplyCoupon = useCallback(async () => {
    setCouponError('');

    const result = await validateCouponCode(couponCode);
    if (!result.coupon) {
      setCouponError(result.error);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(result.coupon);
    toast({
      title: "Coupon Applied!",
      description: `You saved ${result.coupon.discountPercent}%`,
      variant: "default",
    });
  }, [couponCode, toast]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }, []);

  return {
    couponCode,
    appliedCoupon,
    couponError,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
  };
};
