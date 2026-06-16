import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/hooks/use-toast';
import { sentryTracker } from "@/lib/monitoring";

export const useCheckoutData = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  const fetchCheckoutData = useCallback(async (
    fetchAddresses: () => Promise<void>,
    fetchCart: () => Promise<void>,
    fetchCoupons: () => Promise<void>
  ) => {
 
    if (hasFetched.current) {
      return;
    }
    
    setIsLoading(true);
    try {
      await Promise.all([fetchAddresses(), fetchCart(), fetchCoupons()]);
      hasFetched.current = true; // Mark as fetched
    } catch (error) {
    sentryTracker(error, { source: "useCheckoutData" });
      if (isMounted.current) {
        toast({
          title: "Error",
          description: "Failed to load checkout data",
          variant: "destructive",
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return { isLoading, fetchCheckoutData };
};