import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/hooks/use-toast';
import type { Coupon } from '@/components/storefront/checkout/types/Coupon';

export const useCheckoutCoupon = (couponList: Coupon[]) => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = useCallback(() => {
    setCouponError('');

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const coupon = couponList.find((c) => c.code === couponCode.trim());
    if (!coupon) {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (now < startDate || now > endDate) {
      setCouponError("Coupon is not currently valid");
      setAppliedCoupon(null);
      return;
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      setCouponError("Coupon has reached its usage limit");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
    toast({
      title: "Coupon Applied!",
      description: `You saved ${coupon.discountPercent}%`,
      variant: "default",
    });
  }, [couponCode, couponList, toast]);

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