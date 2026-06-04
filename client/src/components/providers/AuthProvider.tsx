// app/components/AuthProvider.tsx - ENHANCED
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import useSilentAuth from "@/components/providers/hooks/useSilentAuth";
import { usePathname } from "next/navigation";
import { authLogger } from "@/lib/logger";
import { sentryTracker } from "@/lib/monitoring";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { initialize } = useAuthStore();
  const isPublicAuthRoute =
    pathname === "/auth/login" || pathname === "/auth/register";

  // Keep silent auth active on public auth routes too, so existing cookie sessions
  // can be restored and redirected away from login/register screens.
  useSilentAuth(true);

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      const traceId = `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        authLogger.info("AuthProvider initialize:start", {
          traceId,
          pathname,
          isPublicAuthRoute,
        });
        
        await initialize();
        authLogger.info("AuthProvider initialize:success", { traceId });
        
        if (mounted) {
          setIsInitialized(true);
          setInitError(null);
        }
      } catch (error: any) {
    sentryTracker(error, { source: "AuthProvider" });
        authLogger.error("AuthProvider initialize:error", {
          traceId,
          message: error?.message || "unknown_error",
        });
        if (mounted) {
          setIsInitialized(true); // Still show app
          setInitError(error.message || "Auth initialization failed");
        }
      }
    };

    initTimeout = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
    };
  }, [initialize, isPublicAuthRoute]);

  if (!isInitialized && !isPublicAuthRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (initError && process.env.NODE_ENV === 'development') {
    console.warn("AuthProvider initialization warning:", initError);
  }

  return <>{children}</>;
}