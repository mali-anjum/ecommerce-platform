"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import {
  isPayPalSdkConfigured,
  publicEnv,
} from "@/config/publicEnv";

export function PayPalProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isPayPalSdkConfigured()) {
    return <>{children}</>;
  }

  const options = {
    clientId: publicEnv.paypalClientId,
    currency: "USD",
    intent: "capture",
    locale: publicEnv.paypalLocale,
    components: "buttons",
    "data-sdk-integration-source": "developer-studio",
  };

  return (
    <PayPalScriptProvider options={options} deferLoading={false}>
      {children}
    </PayPalScriptProvider>
  );
}
