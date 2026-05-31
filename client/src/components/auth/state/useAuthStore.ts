// src/store/useAuthStore.ts - CORRECTED VERSION
import axios from "axios";
import type { AxiosError } from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/components/auth/types/User";
import type { TokenExpiryInfoBackendRes } from "@/components/auth/types/TokenExpiryInfoFromBackend";
import type { Session } from "@/components/auth/types/Session";
import {
  shouldRetryUnauthorizedRequest,
  type RetryableRequestConfig,
} from "@/lib/auth/shouldRetryAuthRequest";
import { authLogger } from "@/lib/logger";
import { normalizeRefreshResponseTokenInfo } from "@/lib/auth/normalizeTokenInfo";
import { runWithRefreshLock } from "@/lib/auth/runWithRefreshLock";
import { API_ROUTES } from "@/lib/routes/api";
import { useWishlistStore } from "@/components/storefront/wishlist/state/useWishlistStore";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  tokenExpiry: TokenExpiryInfoBackendRes | null;
  isRefreshing: boolean;
  refreshPromise: Promise<boolean> | null;
  // Actions
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
  getUserRole: () => "USER" | "SELLER" | "SUPER_ADMIN" | null;
  reset: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;
  registerSeller: (payload: {
    storeName: string;
    slug: string;
  }) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  heartbeat: () => Promise<void>;
  getTokenExpiryInfo: () => {
    isValid: boolean;
    timeUntilExpiry: number;
    shouldRefresh: boolean;
  } | null;
  updateTokenExpiry: (tokenInfo: any) => void;
  clearTokenExpiry: () => void;
  fetchMe: () => Promise<User | null>;
  checkSession: () => Promise<Session>;
}

const getBaseURL = () => "/api/auth";

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
});

const SESSION_CHECK_COOLDOWN_MS = 2500;
const TOKEN_EXPIRY_STORAGE_KEY = "token_expiry";
let checkSessionInFlight: Promise<Session> | null = null;
let lastSessionCheckAt = 0;
let lastSessionCheckResult: Session | null = null;

const toPositiveMs = (value: unknown, fallbackMs: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallbackMs;
  }
  return value <= 1000 ? value * 1000 : value;
};

const isTokenExpiryInfo = (
  value: unknown
): value is TokenExpiryInfoBackendRes => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.refreshedAt === "number" &&
    Number.isFinite(candidate.refreshedAt) &&
    typeof candidate.accessTokenExpiresIn === "number" &&
    Number.isFinite(candidate.accessTokenExpiresIn) &&
    candidate.accessTokenExpiresIn > 0 &&
    typeof candidate.suggestedRefreshTime === "number" &&
    Number.isFinite(candidate.suggestedRefreshTime)
  );
};

const persistTokenExpiry = (tokenExpiry: TokenExpiryInfoBackendRes | null) => {
  if (typeof window === "undefined") return;

  if (tokenExpiry === null) {
    localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, JSON.stringify(tokenExpiry));
};

const getStoredTokenExpiry = (): TokenExpiryInfoBackendRes | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isTokenExpiryInfo(parsed)) {
      localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
    return null;
  }
};

const getTokenExpiryStatus = (tokenExpiry: TokenExpiryInfoBackendRes) => {
  const now = Date.now();
  const expiresAt = tokenExpiry.refreshedAt + tokenExpiry.accessTokenExpiresIn;
  return {
    isValid: now < expiresAt,
    timeUntilExpiry: Math.max(0, expiresAt - now),
    shouldRefresh: now > tokenExpiry.suggestedRefreshTime,
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      tokenExpiry: null,
      isRefreshing: false,
      refreshPromise: null,

      setUser: (user: User | null) => set({ user }),

      isAuthenticated: () => {
        return !!get().user;
      },

      getUserRole: () => {
        return get().user?.role || null;
      },

      reset: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
          tokenExpiry: null,
        });
        persistTokenExpiry(null);
        useWishlistStore.getState().clearWishlist();
      },

      clearError: () => set({ error: null }),

      initialize: async () => {
        if (typeof window === "undefined") return;

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("🔧 AuthStore: Initializing auth state...");
          }

          const sessionData = await get().checkSession();

          if (sessionData.hasRefreshToken) {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 AuthStore: Refresh token found");
            }

            // Force immediate refresh when refresh token exists but access token is missing.
            if (!sessionData.hasAccessToken) {
              const refreshed = await get().refreshAccessToken();
              if (refreshed) {
                await get().fetchMe();
              } else {
                set({ user: null });
                get().clearTokenExpiry();
              }
            } else {
              // Check if token needs refresh
              const expiryInfo = get().getTokenExpiryInfo();

              if (expiryInfo?.shouldRefresh) {
                const refreshed = await get().refreshAccessToken();
                if (refreshed && !get().user) {
                  await get().fetchMe();
                }
              } else {
                // If we have valid access token, fetch user data
                await get().fetchMe();
              }
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("🔐 AuthStore: No valid session found");
            }
            // If no refresh token exists, clear persisted auth state.
            set({ user: null });
            get().clearTokenExpiry();
          }
        } catch (error) {
          console.error("AuthStore: Initialization error:", error);
          set({ user: null });
          get().clearTokenExpiry();
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/register", {
            name,
            email,
            password,
          });

          if (response.data.tokenInfo) {
            get().updateTokenExpiry(response.data.tokenInfo);
          }

          set({ isLoading: false });
          return response.data.userId;
        } catch (error: any) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || "Registration failed"
            : "Registration failed";
          set({ isLoading: false, error: errorMessage });
          return null;
        }
      },

      registerSeller: async ({ storeName, slug }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(
            `${API_ROUTES.SELLERS}/register`,
            {
              storeName: storeName.trim(),
              slug: slug.trim().toLowerCase(),
            },
            { withCredentials: true }
          );

          const nextUser = response.data?.data?.user as User | undefined;
          if (nextUser) {
            set({ user: nextUser });
          }

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message ||
              error.response?.data?.error ||
              error.message ||
              "Seller registration failed"
            : "Seller registration failed";
          set({ isLoading: false, error: String(errorMessage) });
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 AuthStore: Login process started for:", email);
          }

          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          if (response.data.success && response.data.user) {
            if (response.data.tokenInfo) {
              get().updateTokenExpiry(response.data.tokenInfo);
            }

            set({
              isLoading: false,
              user: response.data.user,
              error: null,
            });
            void useWishlistStore.getState().fetchWishlist();
            return true;
          } else {
            const errorMessage = response.data.error || "Login failed";
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || error.message || "Login failed"
            : error.message || "Login failed";

          console.error("❌ AuthStore: Login failed:", errorMessage);
          set({ isLoading: false, error: errorMessage });
          get().clearTokenExpiry();
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await axiosInstance.post("/logout");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          get().reset();
        }
      },

      updateTokenExpiry: (tokenInfo: any) => {
        if (!tokenInfo) return;

        const accessTokenExpiresInMs = toPositiveMs(
          tokenInfo.accessTokenExpiresIn,
          15 * 60 * 1000
        );
        const refreshedAt =
          typeof tokenInfo.refreshedAt === "number" &&
          Number.isFinite(tokenInfo.refreshedAt)
            ? tokenInfo.refreshedAt
            : Date.now();
        const suggestedRefreshTime = toPositiveMs(
          tokenInfo.suggestedRefreshTime,
          accessTokenExpiresInMs * 0.8
        );

        const tokenExpiry: TokenExpiryInfoBackendRes = {
          refreshedAt,
          accessTokenExpiresIn: accessTokenExpiresInMs,
          suggestedRefreshTime:
            suggestedRefreshTime > refreshedAt
              ? suggestedRefreshTime
              : refreshedAt + suggestedRefreshTime,
        };

        set({ tokenExpiry });
        persistTokenExpiry(tokenExpiry);
      },

      clearTokenExpiry: () => {
        set({ tokenExpiry: null });
        persistTokenExpiry(null);
      },

      getTokenExpiryInfo: () => {
        const { tokenExpiry } = get();

        if (tokenExpiry) {
          return getTokenExpiryStatus(tokenExpiry);
        }

        const storedExpiry = getStoredTokenExpiry();
        if (!storedExpiry) return null;

        set({ tokenExpiry: storedExpiry });
        return getTokenExpiryStatus(storedExpiry);
      },


      heartbeat: async () => {
        try {
          const res = await axiosInstance.post("/heartbeat");
          if (res.data?.tokenInfo) {
            get().updateTokenExpiry(res.data.tokenInfo);
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("AuthStore: heartbeat failed", error);
          }
        }
      },

      refreshAccessToken: async () => {
        const traceId = `refresh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const state = get();

        if (state.isRefreshing && state.refreshPromise) {
          authLogger.debug(
            "Refresh already in progress, returning existing promise",
            { traceId }
          );
          return state.refreshPromise;
        }

        set({ isRefreshing: true });
        authLogger.info("Starting token refresh process", { traceId });

        const refreshPromise = runWithRefreshLock(async () => {
          const startTime = performance.now();
          try {
            authLogger.http("POST", "/api/auth/refresh-token", undefined, {
              traceId,
              note: "cannot detect httpOnly cookies from client; check server logs or /check-session",
            });

            const res = await axiosInstance.post("/refresh-token");
            const duration = performance.now() - startTime;

            if (res.data.success && res.data.tokenInfo) {
              const norm = normalizeRefreshResponseTokenInfo(res.data.tokenInfo);

              const expiryData: TokenExpiryInfoBackendRes = {
                refreshedAt: norm.refreshedAt,
                accessTokenExpiresIn: norm.accessTokenExpiresInMs,
                suggestedRefreshTime: norm.suggestedRefreshAtMs,
              };

              authLogger.auth("Token refresh successful", {
                traceId,
                duration: `${duration.toFixed(2)}ms`,
                accessTokenExpiresIn: `${norm.accessTokenExpiresInMs}ms`,
                suggestedRefreshTime: new Date(
                  expiryData.suggestedRefreshTime
                ).toISOString(),
                expiresAt: new Date(
                  norm.refreshedAt + norm.accessTokenExpiresInMs
                ).toISOString(),
              });

              persistTokenExpiry(expiryData);
              set({
                tokenExpiry: expiryData,
                error: null,
                isRefreshing: false,
                refreshPromise: null,
              });

              if (res.data.user) {
                set({ user: res.data.user });
                authLogger.debug("User data updated from refresh");
              }

              return true;
            } else {
              authLogger.warn(
                "Token refresh API returned success=false",
                { traceId, data: res.data }
              );
              set({
                error: res.data.error || "Refresh failed",
                isRefreshing: false,
                refreshPromise: null,
              });
              return false;
            }
          } catch (error: any) {
            const duration = performance.now() - startTime;

            if (axios.isAxiosError(error)) {
              const errorMessage =
                error.response?.data?.error || "Token refresh failed";
              const statusCode = error.response?.status;

              authLogger.error("Token refresh HTTP error", error, {
                traceId,
                statusCode,
                errorMessage,
                duration: `${duration.toFixed(2)}ms`,
                url: error.config?.url,
                responseData: error.response?.data,
              });

              set({ error: errorMessage });

              if (statusCode === 401) {
                authLogger.warn(
                  "Refresh returned 401; verifying session before forced logout"
                );
                try {
                  const session = await get().checkSession();
                  if (!session.hasRefreshToken) {
                    authLogger.auth(
                      "No refresh cookie present after 401, performing logout"
                    );
                    setTimeout(() => get().logout(), 100);
                  } else {
                    authLogger.info(
                      "Refresh cookie still present after 401; keeping session and retrying later"
                    );
                  }
                } catch (sessionError) {
                  authLogger.error(
                    "Session re-check failed after refresh 401; falling back to logout",
                    sessionError
                  );
                  setTimeout(() => get().logout(), 100);
                }
              }
            } else {
              authLogger.error("Token refresh network/unknown error", error, {
                duration: `${duration.toFixed(2)}ms`,
              });
              set({ error: "Network error during refresh" });
            }

            get().clearTokenExpiry();
            set({
              isRefreshing: false,
              refreshPromise: null,
            });
            return false;
          }
        });

        set({ refreshPromise });
        return refreshPromise;
      },

      checkSession: async (): Promise<Session> => {
        const traceId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        if (
          lastSessionCheckResult &&
          now - lastSessionCheckAt < SESSION_CHECK_COOLDOWN_MS
        ) {
          authLogger.debug("checkSession: returning cached result", {
            traceId,
            ageMs: now - lastSessionCheckAt,
            hasRefreshToken: lastSessionCheckResult.hasRefreshToken,
            hasAccessToken: lastSessionCheckResult.hasAccessToken,
          });
          return lastSessionCheckResult;
        }
        if (checkSessionInFlight) {
          authLogger.debug("checkSession: joining in-flight request", { traceId });
          return checkSessionInFlight;
        }

        checkSessionInFlight = (async () => {
        try {
          authLogger.debug("checkSession: requesting /check-session", { traceId });
          const res = await axiosInstance.get("/check-session");

          if (process.env.NODE_ENV === "development") {
            console.log("🔍 AuthStore: Session check result:", res.data);
          }

          const normalizedSession: Session = {
            success: res.data.success ?? true,
            hasRefreshToken: res.data.hasRefreshToken ?? false,
            hasAccessToken: res.data.hasAccessToken ?? false,
            cookiesPresent: res.data.cookiesPresent ?? [],
            ...res.data,
          };
          lastSessionCheckAt = Date.now();
          lastSessionCheckResult = normalizedSession;
          authLogger.info("checkSession: completed", {
            traceId,
            hasRefreshToken: normalizedSession.hasRefreshToken,
            hasAccessToken: normalizedSession.hasAccessToken,
            success: normalizedSession.success,
          });
          return normalizedSession;
        } catch (error) {
          console.error("AuthStore: Session check failed:", error);
          const failedSession: Session = {
            success: false,
            hasRefreshToken: false,
            hasAccessToken: false,
            cookiesPresent: [],
            error: "Session check failed",
          };
          lastSessionCheckAt = Date.now();
          lastSessionCheckResult = failedSession;
          authLogger.warn("checkSession: failed", {
            traceId,
            error: error instanceof Error ? error.message : "unknown_error",
          });
          return failedSession;
        } finally {
          checkSessionInFlight = null;
        }
        })();

        return checkSessionInFlight;
      },

      fetchMe: async () => {
        try {
          const res = await axiosInstance.get("/me");

          if (res.data.user) {
            set({ user: res.data.user, error: null });
            return res.data.user;
          }
          return null;
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token might be expired, but don't logout - let interceptor handle it
          }
          console.error("AuthStore: fetchMe failed:", error);
          return null;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        tokenExpiry: state.tokenExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tokenExpiry = getStoredTokenExpiry();
        }
      },
    }
  )
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Optional: Log successful auth API calls in development
    if (
      process.env.NODE_ENV === "development" &&
      response.config.url?.includes("/auth/")
    ) {
      console.log(
        `✅ API ${response.config.method?.toUpperCase()} ${
          response.config.url
        }: ${response.status}`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetryableRequestConfig;

    // Only retry for 401 errors on protected API calls (never for auth mutations)
    if (shouldRetryUnauthorizedRequest(error.response?.status, originalRequest)) {
      originalRequest._retry = true;

      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Interceptor: Token expired, attempting refresh...");
      }

      try {
        const refreshSuccess = await useAuthStore
          .getState()
          .refreshAccessToken();

        if (refreshSuccess) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "✅ Interceptor: Token refresh successful, retrying request"
            );
          }
          return axiosInstance(originalRequest);
        }
        const session = await useAuthStore.getState().checkSession();
        if (!session.hasRefreshToken) {
          useAuthStore.getState().logout();
        }
      } catch (refreshError) {
        console.error("❌ Interceptor: Token refresh failed", refreshError);
        try {
          const session = await useAuthStore.getState().checkSession();
          if (!session.hasRefreshToken) {
            useAuthStore.getState().logout();
          }
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }

    // Log other errors
    const responseStatus = error.response?.status;
    if (typeof responseStatus === "number" && responseStatus >= 500) {
      console.error(
        "🚨 Server error:",
        responseStatus,
        error.config?.url ?? "unknown"
      );
    }

    return Promise.reject(error);
  }
);
