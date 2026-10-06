type Interceptor = (error: unknown) => Promise<unknown>;

const instance = Object.assign(jest.fn(), {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  interceptors: { response: { use: jest.fn() } },
});

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    __esModule: true,
    default: { create: () => instance, post: jest.fn(), isAxiosError: actual.isAxiosError },
  };
});
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("@/lib/logger", () => ({
  authLogger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn(), auth: jest.fn() },
}));
const wishlist = { clearWishlist: jest.fn(), fetchWishlist: jest.fn().mockResolvedValue(undefined) };
jest.mock("@/components/storefront/wishlist/state/useWishlistStore", () => ({
  useWishlistStore: { getState: () => wishlist },
}));

import axios from "axios";
import { useAuthStore } from "../useAuthStore";
import type { User } from "@/components/auth/types/User";

const responseInterceptor = instance.interceptors.response.use.mock.calls[0][1] as Interceptor;

function axiosError(status: number, data: unknown = {}, url = "/me") {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data },
    config: { url, method: "get" },
  });
}

const user = { id: "u1", email: "a@b.co", role: "USER", name: "Ann" } as unknown as User;
const session = (hasRefreshToken: boolean, hasAccessToken: boolean) => ({
  data: { success: true, hasRefreshToken, hasAccessToken, cookiesPresent: [] },
});

let clock = 1_000_000_000;
const storage = new Map<string, string>();

describe("useAuthStore", () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      window: {},
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => void storage.set(k, v),
        removeItem: (k: string) => void storage.delete(k),
      },
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  beforeEach(() => {
    for (const fn of [instance, instance.get, instance.post, instance.patch, axios.post as jest.Mock]) fn.mockReset();
    wishlist.clearWishlist.mockReset();
    wishlist.fetchWishlist.mockReset().mockResolvedValue(undefined);
    storage.clear();
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "performance"] });
    clock += 60_000; // past the session-check cache window
    jest.setSystemTime(clock);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    useAuthStore.setState({ user: null, isLoading: false, error: null, tokenExpiry: null, isRefreshing: false, refreshPromise: null });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("stores the user, token expiry and loads the wishlist", async () => {
      instance.post.mockResolvedValue({
        data: { success: true, user, tokenInfo: { refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: clock + 720_000 } },
      });
      await expect(useAuthStore.getState().login("a@b.co", "pw")).resolves.toBe(true);
      expect(instance.post).toHaveBeenCalledWith("/login", { email: "a@b.co", password: "pw" });
      expect(useAuthStore.getState()).toMatchObject({ user, isLoading: false, error: null });
      expect(useAuthStore.getState().tokenExpiry?.accessTokenExpiresIn).toBe(900_000);
      expect(JSON.parse(storage.get("token_expiry") ?? "{}").accessTokenExpiresIn).toBe(900_000);
      expect(wishlist.fetchWishlist).toHaveBeenCalled();
    });

    it("surfaces the server message for bad credentials or a deactivated account", async () => {
      instance.post.mockRejectedValue(axiosError(403, { error: "Account is deactivated" }, "/login"));
      await expect(useAuthStore.getState().login("a@b.co", "pw")).resolves.toBe(false);
      expect(useAuthStore.getState()).toMatchObject({ user: null, isLoading: false, error: "Account is deactivated" });
      expect(storage.has("token_expiry")).toBe(false);
    });

    it("treats success=false as a failure", async () => {
      instance.post.mockResolvedValue({ data: { success: false, error: "Verify your email first" } });
      await expect(useAuthStore.getState().login("a@b.co", "pw")).resolves.toBe(false);
      expect(useAuthStore.getState().error).toBe("Verify your email first");
    });
  });

  it("register returns the new user id and throws the server message on failure", async () => {
    instance.post.mockResolvedValueOnce({ data: { userId: "u9" } });
    await expect(useAuthStore.getState().register("Ann", "a@b.co", "pw")).resolves.toBe("u9");

    instance.post.mockRejectedValueOnce(axiosError(409, { error: "Email already registered" }, "/register"));
    await expect(useAuthStore.getState().register("Ann", "a@b.co", "pw")).rejects.toThrow("Email already registered");
    expect(useAuthStore.getState().error).toBe("Email already registered");
  });

  it("registerSeller normalizes the slug and adopts the upgraded user", async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { data: { user: { ...user, role: "SELLER" } } } });
    await expect(useAuthStore.getState().registerSeller({ storeName: "  Acme  ", slug: " Acme-Store " })).resolves.toBe(true);
    expect((axios.post as jest.Mock).mock.calls[0][1]).toEqual({ storeName: "Acme", slug: "acme-store" });
    expect(useAuthStore.getState().user?.role).toBe("SELLER");

    (axios.post as jest.Mock).mockRejectedValue(axiosError(409, { message: "Slug taken" }));
    await expect(useAuthStore.getState().registerSeller({ storeName: "A", slug: "a" })).resolves.toBe(false);
    expect(useAuthStore.getState().error).toBe("Slug taken");
  });

  it("logout clears local state even when the server call fails", async () => {
    useAuthStore.setState({ user });
    storage.set("token_expiry", "{}");
    instance.post.mockRejectedValue(new Error("offline"));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(storage.has("token_expiry")).toBe(false);
    expect(wishlist.clearWishlist).toHaveBeenCalled();
  });

  describe("token expiry", () => {
    it("converts second-based durations and reports refresh timing", () => {
      useAuthStore.getState().updateTokenExpiry({ refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: 720 });
      const info = useAuthStore.getState().getTokenExpiryInfo();
      expect(info).toMatchObject({ isValid: true, timeUntilExpiry: 900_000, shouldRefresh: false });

      jest.setSystemTime(clock + 800_000);
      expect(useAuthStore.getState().getTokenExpiryInfo()).toMatchObject({ isValid: true, shouldRefresh: true });
      jest.setSystemTime(clock + 901_000);
      expect(useAuthStore.getState().getTokenExpiryInfo()).toMatchObject({ isValid: false, timeUntilExpiry: 0 });
    });

    it("rehydrates valid stored expiry and discards corrupt data", () => {
      storage.set("token_expiry", JSON.stringify({ refreshedAt: clock, accessTokenExpiresIn: 60_000, suggestedRefreshTime: clock + 30_000 }));
      expect(useAuthStore.getState().getTokenExpiryInfo()?.isValid).toBe(true);

      useAuthStore.setState({ tokenExpiry: null });
      storage.set("token_expiry", "{not json");
      expect(useAuthStore.getState().getTokenExpiryInfo()).toBeNull();
      expect(storage.has("token_expiry")).toBe(false);

      storage.set("token_expiry", JSON.stringify({ refreshedAt: clock, accessTokenExpiresIn: -1, suggestedRefreshTime: 0 }));
      expect(useAuthStore.getState().getTokenExpiryInfo()).toBeNull();
    });
  });

  describe("refreshAccessToken", () => {
    it("stores normalized expiry and the returned user", async () => {
      instance.post.mockResolvedValue({
        data: { success: true, user, tokenInfo: { refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: 720 } },
      });
      await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(true);
      expect(useAuthStore.getState()).toMatchObject({ user, isRefreshing: false, refreshPromise: null });
      expect(useAuthStore.getState().tokenExpiry?.accessTokenExpiresIn).toBe(900_000);
    });

    it("shares one in-flight refresh between concurrent callers", async () => {
      let resolve: (value: unknown) => void = () => undefined;
      instance.post.mockReturnValue(new Promise((r) => (resolve = r)));
      const first = useAuthStore.getState().refreshAccessToken();
      const second = useAuthStore.getState().refreshAccessToken();
      resolve({ data: { success: true, tokenInfo: { refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: 720 } } });
      await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
      expect(instance.post).toHaveBeenCalledTimes(1);
    });

    it("logs out after a 401 when no refresh cookie remains", async () => {
      useAuthStore.setState({ user });
      instance.post.mockRejectedValueOnce(axiosError(401, { error: "Refresh token revoked" }, "/refresh-token"));
      instance.get.mockResolvedValue(session(false, false));
      await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);
      expect(useAuthStore.getState().error).toBe("Refresh token revoked");

      instance.post.mockResolvedValue({ data: {} }); // logout call
      jest.advanceTimersByTime(150);
      await Promise.resolve();
      expect(instance.post).toHaveBeenLastCalledWith("/logout");
    });

    it("keeps the session after a 401 while the refresh cookie still exists", async () => {
      useAuthStore.setState({ user });
      instance.post.mockRejectedValueOnce(axiosError(401, {}, "/refresh-token"));
      instance.get.mockResolvedValue(session(true, false));
      await useAuthStore.getState().refreshAccessToken();
      jest.advanceTimersByTime(500);
      expect(instance.post).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it("reports network failures without logging out", async () => {
      instance.post.mockRejectedValue(new Error("offline"));
      await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);
      expect(useAuthStore.getState().error).toBe("Network error during refresh");
    });
  });

  describe("initialize", () => {
    it("clears state when there is no refresh cookie", async () => {
      useAuthStore.setState({ user });
      instance.get.mockResolvedValue(session(false, false));
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("refreshes then loads the user when only the refresh cookie exists", async () => {
      instance.get.mockImplementation((url: string) =>
        Promise.resolve(url === "/check-session" ? session(true, false) : { data: { user } })
      );
      instance.post.mockResolvedValue({ data: { success: true, tokenInfo: { refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: 720 } } });
      await useAuthStore.getState().initialize();
      expect(instance.post).toHaveBeenCalledWith("/refresh-token");
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it("fetches the user directly when the access token is still fresh", async () => {
      instance.get.mockImplementation((url: string) =>
        Promise.resolve(url === "/check-session" ? session(true, true) : { data: { user } })
      );
      await useAuthStore.getState().initialize();
      expect(instance.post).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(user);
    });
  });

  it("checkSession caches results briefly and fails closed", async () => {
    instance.get.mockResolvedValueOnce(session(true, true));
    await useAuthStore.getState().checkSession();
    await useAuthStore.getState().checkSession();
    expect(instance.get).toHaveBeenCalledTimes(1);

    jest.setSystemTime(clock + 5_000);
    instance.get.mockRejectedValueOnce(new Error("down"));
    await expect(useAuthStore.getState().checkSession()).resolves.toMatchObject({ success: false, hasRefreshToken: false });
  });

  describe("401 interceptor", () => {
    it("refreshes once and retries the original request", async () => {
      instance.post.mockResolvedValue({ data: { success: true, tokenInfo: { refreshedAt: clock, accessTokenExpiresIn: 900, suggestedRefreshTime: 720 } } });
      instance.mockResolvedValue({ data: "retried" });
      const error = axiosError(401, {}, "/me");
      await expect(responseInterceptor(error)).resolves.toEqual({ data: "retried" });
      expect((error.config as { _retry?: boolean })._retry).toBe(true);
    });

    it("never retries auth mutations such as /login", async () => {
      const error = axiosError(401, {}, "/login");
      await expect(responseInterceptor(error)).rejects.toBe(error);
      expect(instance.post).not.toHaveBeenCalled();
    });

    it("rejects non-401 errors untouched", async () => {
      const error = axiosError(500);
      await expect(responseInterceptor(error)).rejects.toBe(error);
    });
  });
});
