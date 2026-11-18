import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { sentryTracker } from "@/lib/monitoring";

export type CheckoutPaymentMethodId = "PAYPAL" | "STRIPE";

export async function requestPaymentMethods(): Promise<{
  methods: CheckoutPaymentMethodId[];
  error: string | null;
}> {
  try {
    const { data } = await axios.get<{
      success?: boolean;
      data?: CheckoutPaymentMethodId[];
    }>("/api/order/methods");

    return {
      methods: Array.isArray(data?.data) ? data.data : [],
      error: null,
    };
  } catch (err: unknown) {
    sentryTracker(err, { source: "usePaymentMethods" });
    console.error("Failed to load payment methods:", err);
    return { methods: [], error: "Could not load payment methods" };
  }
}

export function usePaymentMethods() {
  const [availableMethods, setAvailableMethods] = useState<CheckoutPaymentMethodId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await requestPaymentMethods();
    setAvailableMethods(result.methods);
    setError(result.error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void requestPaymentMethods().then((result) => {
      if (!active) return;
      setAvailableMethods(result.methods);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return {
    availableMethods,
    isLoading,
    error,
    refetch: fetchMethods,
  };
}
