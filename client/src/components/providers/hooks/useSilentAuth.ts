// hooks/useSilentAuth.tsx - WITH LOGGER
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { authLogger } from "@/lib/logger";
import { getSafeISOString } from "@/components/auth/utils/getSafeISOString";
import { sentryTracker } from "@/lib/monitoring";

export const REFRESH_FAILURE_COOLDOWN_MS = 2 * 60 * 1000;

export function isRefreshCooldownActive(
  cooldownUntilMs: number,
  nowMs = Date.now(),
): boolean {
  return cooldownUntilMs > nowMs;
}

export function shouldActivateRefreshFailureCooldown(params: {
  retryCount: number;
  hasRefreshToken: boolean;
  hasAccessToken: boolean;
}): boolean {
  return (
    params.retryCount >= 2 &&
    params.hasRefreshToken &&
    !params.hasAccessToken
  );
}

export default function useSilentAuth(enabled = true) {
  const { refreshAccessToken, checkSession, getTokenExpiryInfo, heartbeat } =
    useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const storageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshCooldownUntilRef = useRef<number>(0);
  const flowCounterRef = useRef<number>(0);

  const calculateRefreshTime = useCallback(async (): Promise<number | null> => {
    try {
      const sessionInfo = await checkSession();

      if (sessionInfo.hasRefreshToken && !sessionInfo.hasAccessToken) {
        authLogger.warn(
          "Missing access token but have refresh token - refreshing immediately",
        );
        return 0;
      }

      const expiryInfo = getTokenExpiryInfo();

      if (expiryInfo) {
        if (expiryInfo.shouldRefresh) {
          authLogger.debug("Token needs immediate refresh");
          return 0;
        }

        if (expiryInfo.timeUntilExpiry > 0) {
          const refreshTime = Math.max(expiryInfo.timeUntilExpiry * 0.2, 10000);
      
          authLogger.debug(
            `Scheduled refresh in ${Math.round(refreshTime / 60000)}m`,
          );
          return refreshTime;
        }
      }

      if (sessionInfo?.hasRefreshToken) {
        const DEFAULT_REFRESH_TIME = 12 * 60 * 1000;
        authLogger.info("Using default refresh time", {
          defaultTime: "12 minutes",
        });
        return DEFAULT_REFRESH_TIME;
      }

      authLogger.warn("No refresh token available, skipping schedule");
      return null;
    } catch (error) {
    sentryTracker(error, { source: "useSilentAuth" });
      authLogger.error("Failed to calculate refresh time", error);
      return null;
    }
  }, [checkSession, getTokenExpiryInfo]);

  const performTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      authLogger.debug("Refresh already in progress, skipping duplicate");
      return;
    }

    const now = Date.now();
    if (isRefreshCooldownActive(refreshCooldownUntilRef.current, now)) {
      authLogger.warn("Skipping refresh: cooldown active after repeated 401s", {
        cooldownUntil: getSafeISOString(refreshCooldownUntilRef.current) || "Invalid date",
      });
      return;
    }

    isRefreshingRef.current = true;

    try {
      const sessionSnapshot = await checkSession();
      authLogger.info("Initiating token refresh...", {
        hasRefreshToken: sessionSnapshot.hasRefreshToken,
        hasAccessToken: sessionSnapshot.hasAccessToken,
      });
      if (sessionSnapshot.hasRefreshToken && sessionSnapshot.hasAccessToken) {
        authLogger.info(
          "Skipping refresh call: both accessToken and refreshToken are present",
        );
        return;
      }
      const startTime = performance.now();

      const success = await refreshAccessToken();
      const duration = performance.now() - startTime;

      if (success) {
        authLogger.auth("Token refreshed successfully", {
          duration: `${duration.toFixed(2)}ms`,
          retryCount: retryCountRef.current,
        });

        retryCountRef.current = 0;
        refreshCooldownUntilRef.current = 0;
        setTimeout(() => {
          authLogger.debug("Rescheduling next refresh after successful refresh");
          scheduleTokenRefresh();
        }, 1000);
      } else {
        authLogger.warn("Token refresh failed (no success)", {
          duration: `${duration.toFixed(2)}ms`,
          retryCount: retryCountRef.current + 1,
        });

        retryCountRef.current++;
        const postFailureSession = await checkSession();

        if (
          shouldActivateRefreshFailureCooldown({
            retryCount: retryCountRef.current,
            hasRefreshToken: postFailureSession.hasRefreshToken,
            hasAccessToken: postFailureSession.hasAccessToken,
          })
        ) {
          // Avoid hammering refresh endpoint when cookie exists but token is rejected (usually stale/revoked token).
          const cooldownMs = REFRESH_FAILURE_COOLDOWN_MS;
          refreshCooldownUntilRef.current = Date.now() + cooldownMs;
          authLogger.warn(
            "Refresh token exists but refresh keeps failing; activating cooldown",
            {
              retryCount: retryCountRef.current,
              cooldownSeconds: Math.round(cooldownMs / 1000),
            },
          );
          return;
        }

        const backoffTime = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          30000,
        );

        authLogger.info(`Scheduling retry with exponential backoff`, {
          backoffSeconds: Math.round(backoffTime / 1000),
          retryCount: retryCountRef.current,
        });

        setTimeout(() => scheduleTokenRefresh(), backoffTime);
      }
    } catch (error) {
    sentryTracker(error, { source: "useSilentAuth" });
      authLogger.error("Token refresh operation failed with error", error, {
        retryCount: retryCountRef.current + 1,
      });

      retryCountRef.current++;
      const backoffTime = Math.min(
        1000 * Math.pow(2, retryCountRef.current),
        30000,
      );

      authLogger.info(`Scheduling retry after error`, {
        backoffSeconds: Math.round(backoffTime / 1000),
        retryCount: retryCountRef.current,
      });

      setTimeout(() => scheduleTokenRefresh(), backoffTime);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshAccessToken]);

  const scheduleTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      authLogger.debug("Refresh already in progress, skipping");
      return;
    }

    try {
      const refreshTime = await calculateRefreshTime();

      if (refreshTime === null) {
        authLogger.info("No session detected, skipping refresh schedule");
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        authLogger.debug("Cleared existing refresh timeout");
      }

      if (refreshTime <= 0) {
        authLogger.info("Immediate token refresh required");
        await performTokenRefresh();
        return;
      }

      // ✅ FIXED: Use getSafeISOString here
      authLogger.info(`Scheduled next token refresh`, {
        refreshInMinutes: Math.round(refreshTime / 60000),
        refreshInSeconds: Math.round(refreshTime / 1000),
        scheduledTime: getSafeISOString(Date.now() + refreshTime) || 'Invalid date',
      });

      timeoutRef.current = setTimeout(async () => {
        authLogger.debug("Executing scheduled token refresh");
        await performTokenRefresh();
      }, refreshTime);
    } catch (error) {
    sentryTracker(error, { source: "useSilentAuth" });
      authLogger.error("Token refresh scheduling failed", error);
    }
  }, [calculateRefreshTime, performTokenRefresh]);

  const checkAndRefreshIfNeeded = useCallback(async () => {
    const flowId = `silent-auth-${++flowCounterRef.current}`;
    try {
      if (process.env.NODE_ENV === "development") {
        authLogger.debug("Checking if token refresh is needed...", { flowId });
      }

      // ✅ FIRST: Check session to see what cookies we have
      const sessionInfo = await checkSession();

      authLogger.debug("Session check result:", {
        flowId,
        hasRefreshToken: sessionInfo.hasRefreshToken,
        hasAccessToken: sessionInfo.hasAccessToken,
        success: sessionInfo.success,
        cooldownActive: isRefreshCooldownActive(refreshCooldownUntilRef.current),
      });

      // ✅ CRITICAL FIX: If we have refreshToken but NO accessToken, refresh IMMEDIATELY
      if (sessionInfo.hasRefreshToken && !sessionInfo.hasAccessToken) {
        authLogger.warn(
          "Has refresh token but NO access token - refreshing immediately",
          { flowId },
        );
        await performTokenRefresh();
        return;
      }

      // ✅ SECOND: Check token expiry info
      const expiryInfo = getTokenExpiryInfo();

      if (expiryInfo?.shouldRefresh) {
        authLogger.warn("Token requires immediate refresh based on expiry", {
          flowId,
          timeUntilExpiry: expiryInfo.timeUntilExpiry,
          isExpired: expiryInfo.isValid,
        });
        await performTokenRefresh();
        return;
      }

      if (sessionInfo.hasRefreshToken && sessionInfo.hasAccessToken) {
        authLogger.info(
          "Both access token and refresh token are present; no immediate refresh needed",
          {
            flowId,
          },
        );
        return;
      }

      // ✅ THIRD: If no expiry info but we have session, schedule refresh
      if (!expiryInfo) {
        if (sessionInfo?.hasRefreshToken) {
          authLogger.info("Valid session found, scheduling refresh");
          await scheduleTokenRefresh();
        } else {
          authLogger.debug("No valid session found, not scheduling refresh");
        }
      } else {
        if (sessionInfo.hasAccessToken) {
          // Keep backend activity timestamp fresh while user is active.
          await heartbeat();
        }
        authLogger.debug("Token does not need immediate refresh", {
          timeUntilExpiry: expiryInfo.timeUntilExpiry,
          shouldRefresh: expiryInfo.shouldRefresh,
        });
      }
    } catch (error) {
    sentryTracker(error, { source: "useSilentAuth" });
      authLogger.error("Session check failed", error);
    }
  }, [
    checkSession,
    scheduleTokenRefresh,
    getTokenExpiryInfo,
    performTokenRefresh,
    heartbeat,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    authLogger.debug("useSilentAuth hook initialized");

    // Run immediately on app startup/reload so missing access tokens are restored quickly.
    void checkAndRefreshIfNeeded();

    initialCheckTimeoutRef.current = setTimeout(() => {
      void checkAndRefreshIfNeeded();
    }, 1000);

    intervalRef.current = setInterval(
      () => {
        authLogger.debug("Performing scheduled token health check");
        void checkAndRefreshIfNeeded();
      },
      3 * 60 * 1000,
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        authLogger.debug("Tab became visible, checking token status");
        setTimeout(() => void checkAndRefreshIfNeeded(), 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== "token_expiry" && !e.key?.includes("auth-storage")) {
        return;
      }
      if (storageDebounceRef.current) {
        clearTimeout(storageDebounceRef.current);
      }
      storageDebounceRef.current = setTimeout(() => {
        storageDebounceRef.current = null;
        if (process.env.NODE_ENV === "development") {
          authLogger.debug("Auth storage changed, syncing across tabs", {
            changedKey: e.key,
          });
        }
        void checkAndRefreshIfNeeded();
      }, 750);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      authLogger.debug("useSilentAuth hook cleaning up...");

      if (storageDebounceRef.current) {
        clearTimeout(storageDebounceRef.current);
        storageDebounceRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        authLogger.debug("Cleared refresh timeout");
      }
      if (initialCheckTimeoutRef.current) {
        clearTimeout(initialCheckTimeoutRef.current);
        initialCheckTimeoutRef.current = null;
        authLogger.debug("Cleared initial auth check timeout");
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        authLogger.debug("Cleared interval checker");
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAndRefreshIfNeeded, enabled]);

  return null;
}
