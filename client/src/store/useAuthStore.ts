// src/store/useAuthStore.ts - CORRECTED VERSION
import axios from "axios";
import type { AxiosError } from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
// import { warmupService } from "@/utils/warmupService";
import type { User } from "@/types/auth/User";
import type { TokenExpiryInfoBackendRes } from "@/types/auth/TokenExpiryInfoFromBackend";
import type { Session } from "@/types/auth/Session";
import {
  shouldRetryUnauthorizedRequest,
  type RetryableRequestConfig,
} from "@/lib/auth/shouldRetryAuthRequest";
import { authLogger } from "@/utils/Logger";
import { normalizeRefreshResponseTokenInfo } from "@/lib/auth/normalizeTokenInfo";
import { runWithRefreshLock } from "@/lib/auth/runWithRefreshLock";

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
  getUserRole: () => "USER" | "SUPER_ADMIN" | null;
  reset: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;
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

            // Check if token needs refresh
            const expiryInfo = get().getTokenExpiryInfo();

            if (expiryInfo?.shouldRefresh) {
              await get().refreshAccessToken();
            } else if (sessionData.hasAccessToken) {
              // If we have valid access token, fetch user data
              await get().fetchMe();
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("🔐 AuthStore: No valid session found");
            }
            get().clearTokenExpiry();
          }
        } catch (error) {
          console.error("AuthStore: Initialization error:", error);
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

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 AuthStore: Login process started for:", email);
          }

          // await warmupService.ensureWarm();

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
        const state = get();

        if (state.isRefreshing && state.refreshPromise) {
          authLogger.debug(
            "Refresh already in progress, returning existing promise"
          );
          return state.refreshPromise;
        }

        set({ isRefreshing: true });
        authLogger.info("Starting token refresh process");

        const refreshPromise = runWithRefreshLock(async () => {
          const startTime = performance.now();
          try {
            authLogger.http("POST", "/api/auth/refresh-token", undefined, {
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
                res.data
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
                statusCode,
                errorMessage,
                duration: `${duration.toFixed(2)}ms`,
                url: error.config?.url,
              });

              set({ error: errorMessage });

              if (statusCode === 401) {
                authLogger.auth("Refresh token invalid, logging out");
                setTimeout(() => get().logout(), 100);
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
        const now = Date.now();
        if (
          lastSessionCheckResult &&
          now - lastSessionCheckAt < SESSION_CHECK_COOLDOWN_MS
        ) {
          return lastSessionCheckResult;
        }
        if (checkSessionInFlight) {
          return checkSessionInFlight;
        }

        checkSessionInFlight = (async () => {
        try {
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
      } catch (refreshError) {
        console.error("❌ Interceptor: Token refresh failed", refreshError);
        useAuthStore.getState().logout();
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
