import { getCouponRejection, type CouponRuleInput } from "../couponRules";

const NOW = new Date("2026-06-15T12:00:00Z");
const coupon = (overrides: Partial<CouponRuleInput> = {}): CouponRuleInput => ({
  isActive: true,
  startDate: new Date("2026-06-01T00:00:00Z"),
  endDate: new Date("2026-06-30T23:59:59Z"),
  usageLimit: 10,
  usageCount: 3,
  minOrderValue: null,
  ...overrides,
});

describe("getCouponRejection", () => {
  it("accepts an active coupon inside its window with uses left", () => {
    expect(getCouponRejection(coupon(), NOW)).toBeNull();
  });

  it("rejects inactive coupons", () => {
    expect(getCouponRejection(coupon({ isActive: false }), NOW)).toBe("Coupon is not active");
  });

  it("rejects coupons before their start date", () => {
    expect(getCouponRejection(coupon({ startDate: new Date("2026-06-16T00:00:00Z") }), NOW)).toBe(
      "Coupon is not valid yet",
    );
  });

  it("rejects expired coupons", () => {
    expect(getCouponRejection(coupon({ endDate: new Date("2026-06-15T11:59:59Z") }), NOW)).toBe(
      "Coupon has expired",
    );
  });

  it("accepts on the exact start and end instants", () => {
    expect(getCouponRejection(coupon({ startDate: NOW }), NOW)).toBeNull();
    expect(getCouponRejection(coupon({ endDate: NOW }), NOW)).toBeNull();
  });

  it("rejects coupons that reached their usage limit", () => {
    expect(getCouponRejection(coupon({ usageCount: 10 }), NOW)).toBe("Coupon has reached its usage limit");
    expect(getCouponRejection(coupon({ usageCount: 11 }), NOW)).toBe("Coupon has reached its usage limit");
    expect(getCouponRejection(coupon({ usageCount: 9 }), NOW)).toBeNull();
  });

  it("enforces minOrderValue only when a subtotal is given", () => {
    const min = coupon({ minOrderValue: 50 });
    expect(getCouponRejection(min, NOW)).toBeNull();
    expect(getCouponRejection(min, NOW, 49.99)).toBe("Order must be at least 50.00 to use this coupon");
    expect(getCouponRejection(min, NOW, 50)).toBeNull();
  });

  it("defaults to the current time", () => {
    const always = coupon({ startDate: new Date(0), endDate: new Date("2999-01-01") });
    expect(getCouponRejection(always)).toBeNull();
  });
});
