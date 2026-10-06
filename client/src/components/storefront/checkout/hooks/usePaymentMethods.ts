import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { sentryTracker } from "@/lib/monitoring";

export type CheckoutPaymentMethodId = "PAYPAL" | "STRIPE";

type PaymentMethodsResult = {
  methods: CheckoutPaymentMethodId[];
  error: string | null;
};

/** Loads enabled payment methods; never throws so callers can apply the result directly. */
export async function requestPaymentMethods(): Promise<PaymentMethodsResult> {
  try {
    const { data } = await axios.get<{
      success?: boolean;
      data?: CheckoutPaymentMethodId[];
    }>("/api/order/methods");

    return { methods: Array.isArray(data?.data) ? data.data : [], error: null };
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

  const applyResult = useCallback((result: PaymentMethodsResult) => {
    setAvailableMethods(result.methods);
    setError(result.error);
    setIsLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    applyResult(await requestPaymentMethods());
  }, [applyResult]);

  useEffect(() => {
    let cancelled = false;
    void requestPaymentMethods().then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  return {
    availableMethods,
    isLoading,
    error,
    refetch,
  };
}
