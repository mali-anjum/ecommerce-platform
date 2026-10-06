import axios, { AxiosError, AxiosHeaders } from "axios";
import { validateCouponCode } from "../couponApi";
import { API_ROUTES } from "@/lib/routes/api";

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return { ...actual, __esModule: true, default: { ...actual.default, post: jest.fn(), isAxiosError: actual.isAxiosError } };
});

const post = axios.post as jest.Mock;

function axiosError(status: number, data: unknown): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("validateCouponCode", () => {
  beforeEach(() => post.mockReset());

  it("does not call the API for a blank code", async () => {
    await expect(validateCouponCode("   ")).resolves.toEqual({ coupon: null, error: "Please enter a coupon code" });
    expect(post).not.toHaveBeenCalled();
  });

  it("posts the trimmed code with credentials and keeps only checkout fields", async () => {
    post.mockResolvedValueOnce({
      data: { success: true, coupon: { id: "c1", code: "SAVE10", discountPercent: 10, endDate: "2026-12-01", minOrderValue: null } },
    });
    const result = await validateCouponCode("  SAVE10 ");
    expect(post).toHaveBeenCalledWith(`${API_ROUTES.COUPON}/validate`, { code: "SAVE10" }, { withCredentials: true });
    expect(result).toEqual({ coupon: { id: "c1", code: "SAVE10", discountPercent: 10 }, error: null });
  });

  it("returns the server's rejection reason", async () => {
    post.mockRejectedValueOnce(axiosError(400, { success: false, message: "Coupon has expired" }));
    await expect(validateCouponCode("OLD")).resolves.toEqual({ coupon: null, error: "Coupon has expired" });
  });

  it("maps 404 to the server message", async () => {
    post.mockRejectedValueOnce(axiosError(404, { success: false, message: "Invalid coupon code" }));
    await expect(validateCouponCode("NOPE")).resolves.toEqual({ coupon: null, error: "Invalid coupon code" });
  });

  it("asks guests to sign in on 401", async () => {
    post.mockRejectedValueOnce(axiosError(401, { error: "No token" }));
    await expect(validateCouponCode("SAVE10")).resolves.toEqual({ coupon: null, error: "Please sign in to apply a coupon" });
  });

  it("returns a generic message for network failures", async () => {
    post.mockRejectedValueOnce(new Error("Network Error"));
    await expect(validateCouponCode("SAVE10")).resolves.toEqual({
      coupon: null,
      error: "Could not check this coupon. Please try again.",
    });
  });

  it("treats an unsuccessful 200 body as invalid", async () => {
    post.mockResolvedValueOnce({ data: { success: false } });
    await expect(validateCouponCode("SAVE10")).resolves.toEqual({ coupon: null, error: "Invalid coupon code" });
  });
});
