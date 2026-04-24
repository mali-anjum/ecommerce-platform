// app/components/AuthProvider.tsx - ENHANCED
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import useSilentAuth from "@/hooks/useSilentAuth";
import { usePathname } from "next/navigation";

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

  useSilentAuth(!isPublicAuthRoute);

  useEffect(() => {
    if (isPublicAuthRoute) {
      setIsInitialized(true);
      setInitError(null);
      return;
    }

    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 AuthProvider: Initializing...");
        }
        
        await initialize();
        
        if (mounted) {
          setIsInitialized(true);
          setInitError(null);
        }
      } catch (error: any) {
        console.error("AuthProvider: Initialization error:", error);
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