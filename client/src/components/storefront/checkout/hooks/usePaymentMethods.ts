import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { sentryTracker } from "@/lib/monitoring";

export type CheckoutPaymentMethodId = "PAYPAL" | "STRIPE";

export function usePaymentMethods() {
  const [availableMethods, setAvailableMethods] = useState<CheckoutPaymentMethodId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{
        success?: boolean;
        data?: CheckoutPaymentMethodId[];
      }>("/api/order/methods");

      const methods = Array.isArray(data?.data) ? data.data : [];
      setAvailableMethods(methods);
    } catch (err: unknown) {
    sentryTracker(err, { source: "usePaymentMethods" });
      console.error("Failed to load payment methods:", err);
      setError("Could not load payment methods");
      setAvailableMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMethods();
  }, [fetchMethods]);

  return {
    availableMethods,
    isLoading,
    error,
    refetch: fetchMethods,
  };
}
